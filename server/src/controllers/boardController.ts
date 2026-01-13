import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

// Default card properties configuration (Thai labels)
const defaultCardProperties = [
  {
    id: 'status',
    name: 'สถานะ',
    type: 'select',
    options: [
      { id: 'todo', value: 'กำลังทำ', color: 'propColorRed' },
      { id: 'next', value: 'จะทำต่อ', color: 'propColorPurple' },
      { id: 'done', value: 'พร้อมรายงาน', color: 'propColorGreen' },
      { id: 'idea', value: 'IDEA', color: 'propColorGray' },
      { id: 'archived', value: 'เก็บไว้ในลิ้นชัก', color: 'propColorBrown' },
    ],
  },
  {
    id: 'priority',
    name: 'ความเร่งด่วน',
    type: 'select',
    options: [
      { id: 'high', value: 'สูง', color: 'propColorRed' },
      { id: 'medium', value: 'ปานกลาง', color: 'propColorYellow' },
      { id: 'low', value: 'ต่ำ', color: 'propColorGray' },
    ],
  },
  {
    id: 'assignee',
    name: 'ผู้รับผิดชอบ',
    type: 'text',
    options: [],
  },
  {
    id: 'dueDate',
    name: 'วันครบกำหนด',
    type: 'date',
    options: [],
  },
  {
    id: 'notes',
    name: 'หมายเหตุ',
    type: 'text',
    options: [],
  },
];

// Get all boards for user
export const getBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const boards = await prisma.board.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Get single board with cards and views
export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        cards: {
          orderBy: { order: 'asc' },
        },
        views: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!board) {
      res.status(404).json({ error: 'ไม่พบบอร์ดนี้' });
      return;
    }

    res.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Create board
export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, description, icon } = req.body;

    if (!title) {
      res.status(400).json({ error: 'กรุณาระบุชื่อบอร์ด' });
      return;
    }

    const board = await prisma.board.create({
      data: {
        title,
        description,
        icon: icon || '📋',
        properties: JSON.stringify(defaultCardProperties),
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
        views: {
          create: {
            title: 'มุมมอง Kanban',
            type: 'BOARD',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        views: true,
      },
    });

    res.status(201).json({
      message: 'สร้างบอร์ดสำเร็จ',
      board,
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Update board
export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const { title, description, icon, properties, showDescription } = req.body;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขบอร์ดนี้' });
      return;
    }

    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(properties && { properties: JSON.stringify(properties) }),
        ...(showDescription !== undefined && { showDescription }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    res.json({
      message: 'อัพเดทบอร์ดสำเร็จ',
      board,
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Delete board
export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;

    // Check if admin
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบบอร์ดนี้' });
      return;
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    res.json({ message: 'ลบบอร์ดสำเร็จ' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Add board member
export const addBoardMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const { email, role = 'EDITOR' } = req.body;

    // Check if admin
    const isAdmin = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เพิ่มสมาชิก' });
      return;
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      res.status(404).json({ error: 'ไม่พบผู้ใช้นี้ในระบบ' });
      return;
    }

    // Check if already member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId: userToAdd.id,
          boardId,
        },
      },
    });

    if (existingMember) {
      res.status(400).json({ error: 'ผู้ใช้นี้เป็นสมาชิกของบอร์ดอยู่แล้ว' });
      return;
    }

    const member = await prisma.boardMember.create({
      data: {
        userId: userToAdd.id,
        boardId,
        role: role as string,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      message: 'เพิ่มสมาชิกสำเร็จ',
      member,
    });
  } catch (error) {
    console.error('Add board member error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Remove board member
export const removeBoardMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const memberId = req.params.memberId as string;

    // Check if admin
    const isAdmin = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบสมาชิก' });
      return;
    }

    await prisma.boardMember.delete({
      where: { id: memberId },
    });

    res.json({ message: 'ลบสมาชิกสำเร็จ' });
  } catch (error) {
    console.error('Remove board member error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Update member role
export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    // Check if admin
    const isAdmin = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขบทบาท' });
      return;
    }

    const member = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.json({
      message: 'อัพเดทบทบาทสำเร็จ',
      member,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
