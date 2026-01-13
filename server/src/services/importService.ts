import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import fs from 'fs/promises';
import path from 'path';

interface FocalboardBlock {
  type: string;
  data: {
    id: string;
    parentId?: string;
    createdBy?: string;
    modifiedBy?: string;
    type?: string;
    title: string;
    description?: string;
    icon?: string;
    showDescription?: boolean;
    fields?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    cardProperties?: Array<{
      id: string;
      name: string;
      type: string;
      options?: Array<{
        id: string;
        value: string;
        color: string;
      }>;
    }>;
    createAt?: number;
    updateAt?: number;
    boardId?: string;
  };
}

interface FocalboardMember {
  type: 'boardMember';
  data: {
    boardId: string;
    oderId: string;
    roles: string;
    schemeAdmin: boolean;
    schemeEditor: boolean;
  };
}

interface ImportResult {
  boardId: string;
  boardTitle: string;
  cardsImported: number;
  viewsImported: number;
  filesImported: number;
}

export async function importBoardArchive(
  archiveBuffer: Buffer,
  userId: string
): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(archiveBuffer);
  
  // Read version.json
  const versionFile = zip.file('version.json');
  if (!versionFile) {
    throw new Error('ไฟล์ archive ไม่ถูกต้อง: ไม่พบ version.json');
  }
  
  // Find the board directory
  const directories = Object.keys(zip.files).filter(
    (name) => name.endsWith('/') && name.split('/').length === 2
  );
  
  if (directories.length === 0) {
    throw new Error('ไฟล์ archive ไม่ถูกต้อง: ไม่พบโฟลเดอร์บอร์ด');
  }
  
  const boardDir = directories[0];
  const boardJsonl = zip.file(`${boardDir}board.jsonl`);
  
  if (!boardJsonl) {
    throw new Error('ไฟล์ archive ไม่ถูกต้อง: ไม่พบ board.jsonl');
  }
  
  const jsonlContent = await boardJsonl.async('string');
  const lines = jsonlContent.trim().split('\n');
  
  let boardData: FocalboardBlock | null = null;
  const cards: FocalboardBlock[] = [];
  const views: FocalboardBlock[] = [];
  const contentBlocks: FocalboardBlock[] = [];
  
  // Parse JSONL
  for (const line of lines) {
    try {
      const block = JSON.parse(line) as FocalboardBlock | FocalboardMember;
      
      if (block.type === 'board') {
        boardData = block as FocalboardBlock;
      } else if (block.type === 'block') {
        const blockData = block as FocalboardBlock;
        if (blockData.data.type === 'card') {
          cards.push(blockData);
        } else if (blockData.data.type === 'view') {
          views.push(blockData);
        } else {
          contentBlocks.push(blockData);
        }
      }
    } catch (e) {
      console.error('Error parsing line:', e);
    }
  }
  
  if (!boardData) {
    throw new Error('ไฟล์ archive ไม่ถูกต้อง: ไม่พบข้อมูลบอร์ด');
  }
  
  // Map old property IDs to new ones
  const propertyIdMap = new Map<string, string>();
  const cardProperties = boardData.data.cardProperties || [];
  
  const newProperties = cardProperties.map((prop) => {
    const newId = uuidv4();
    propertyIdMap.set(prop.id, newId);
    return {
      id: newId,
      name: prop.name,
      type: prop.type,
      options: prop.options?.map((opt) => ({
        id: uuidv4(),
        value: opt.value,
        color: opt.color,
        _originalId: opt.id,
      })) || [],
    };
  });
  
  // Create option ID map
  const optionIdMap = new Map<string, string>();
  cardProperties.forEach((prop, propIndex) => {
    prop.options?.forEach((opt, optIndex) => {
      const newProp = newProperties[propIndex];
      const newOpt = newProp.options[optIndex];
      optionIdMap.set(opt.id, newOpt.id);
    });
  });
  
  // Create board
  const board = await prisma.board.create({
    data: {
      title: boardData.data.title || 'บอร์ดที่นำเข้า',
      description: boardData.data.description,
      icon: boardData.data.icon || '📋',
      showDescription: boardData.data.showDescription || false,
      properties: JSON.stringify(newProperties.map(({ ...p }) => p)),
      createdById: userId,
      members: {
        create: {
          userId,
          role: 'ADMIN',
        },
      },
    },
  });
  
  // Create cards
  const cardIdMap = new Map<string, string>();
  let cardOrder = 0;
  
  for (const cardBlock of cards) {
    const oldProperties = cardBlock.data.fields?.properties as Record<string, string> || {};
    const newCardProperties: Record<string, string> = {};
    
    // Map properties
    for (const [oldPropId, value] of Object.entries(oldProperties)) {
      const newPropId = propertyIdMap.get(oldPropId);
      if (newPropId) {
        // Check if value is an option ID that needs mapping
        const newValue = optionIdMap.get(value) || value;
        newCardProperties[newPropId] = newValue;
      }
    }
    
    const card = await prisma.card.create({
      data: {
        title: cardBlock.data.title,
        icon: cardBlock.data.fields?.icon as string || '📝',
        properties: JSON.stringify(newCardProperties),
        order: cardOrder++,
        boardId: board.id,
        createdById: userId,
      },
    });
    
    cardIdMap.set(cardBlock.data.id, card.id);
  }
  
  // Create views
  let viewsImported = 0;
  for (const viewBlock of views) {
    const fields = viewBlock.data.fields || {};
    
    await prisma.view.create({
      data: {
        title: viewBlock.data.title || 'มุมมอง',
        type: (fields.viewType as string)?.toUpperCase() === 'TABLE' ? 'TABLE' :
              (fields.viewType as string)?.toUpperCase() === 'CALENDAR' ? 'CALENDAR' :
              (fields.viewType as string)?.toUpperCase() === 'GALLERY' ? 'GALLERY' : 'BOARD',
        filter: JSON.stringify(fields.filter || {}),
        sortOptions: JSON.stringify(fields.sortOptions || []),
        visiblePropertyIds: JSON.stringify(
          ((fields.visiblePropertyIds as string[]) || []).map((id) => propertyIdMap.get(id) || id)
        ),
        columnWidths: JSON.stringify(fields.columnWidths || {}),
        kanbanCalculations: JSON.stringify(fields.kanbanCalculations || {}),
        boardId: board.id,
      },
    });
    viewsImported++;
  }
  
  // If no views were created, create a default one
  if (viewsImported === 0) {
    await prisma.view.create({
      data: {
        title: 'มุมมอง Kanban',
        type: 'BOARD',
        boardId: board.id,
      },
    });
    viewsImported = 1;
  }
  
  // Import files/attachments
  let filesImported = 0;
  const uploadsDir = path.join(__dirname, '../../uploads', board.id);
  await fs.mkdir(uploadsDir, { recursive: true });
  
  for (const [filePath, file] of Object.entries(zip.files)) {
    if (!file.dir && !filePath.endsWith('.json') && !filePath.endsWith('.jsonl')) {
      const filename = path.basename(filePath);
      const fileBuffer = await file.async('nodebuffer');
      const newFilePath = path.join(uploadsDir, filename);
      
      await fs.writeFile(newFilePath, fileBuffer);
      
      await prisma.file.create({
        data: {
          filename,
          mimetype: getMimeType(filename),
          size: fileBuffer.length,
          path: `/uploads/${board.id}/${filename}`,
          boardId: board.id,
        },
      });
      filesImported++;
    }
  }
  
  return {
    boardId: board.id,
    boardTitle: board.title,
    cardsImported: cards.length,
    viewsImported,
    filesImported,
  };
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
