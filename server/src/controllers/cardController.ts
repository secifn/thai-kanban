import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

// Get all cards for a board
export const getCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;

    // Check access
    const member = await prisma.boardMember.findFirst({
      where: { boardId, userId },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงบอร์ดนี้' });
      return;
    }

    const cards = await prisma.card.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Create card
export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const { title, properties, icon, parentId } = req.body;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เพิ่มการ์ด' });
      return;
    }

    // Get max order
    const maxOrder = await prisma.card.aggregate({
      where: { boardId },
      _max: { order: true },
    });

    const card = await prisma.card.create({
      data: {
        title: title || 'การ์ดใหม่',
        properties: properties ? JSON.stringify(properties) : '{}',
        icon: icon || '📝',
        order: (maxOrder._max.order || 0) + 1,
        parentId,
        boardId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      message: 'สร้างการ์ดสำเร็จ',
      card,
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Get single card
export const getCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const cardId = req.params.cardId as string;

    // Check access
    const member = await prisma.boardMember.findFirst({
      where: { boardId, userId },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงบอร์ดนี้' });
      return;
    }

    const card = await prisma.card.findFirst({
      where: { id: cardId, boardId },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!card) {
      res.status(404).json({ error: 'ไม่พบการ์ดนี้' });
      return;
    }

    res.json({ card });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Update card
export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const cardId = req.params.cardId as string;
    const { title, content, properties, icon, order, parentId } = req.body;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขการ์ด' });
      return;
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content: JSON.stringify(content) }),
        ...(properties !== undefined && { properties: JSON.stringify(properties) }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({
      message: 'อัพเดทการ์ดสำเร็จ',
      card,
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Delete card
export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const cardId = req.params.cardId as string;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบการ์ด' });
      return;
    }

    await prisma.card.delete({
      where: { id: cardId },
    });

    res.json({ message: 'ลบการ์ดสำเร็จ' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Reorder cards (batch update)
export const reorderCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const { cards } = req.body; // Array of { id, order, properties }

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขการ์ด' });
      return;
    }

    // Update each card
    await Promise.all(
      cards.map((card: { id: string; order: number; properties?: object }) =>
        prisma.card.update({
          where: { id: card.id },
          data: {
            order: card.order,
            ...(card.properties && { properties: JSON.stringify(card.properties) }),
          },
        })
      )
    );

    res.json({ message: 'จัดเรียงการ์ดสำเร็จ' });
  } catch (error) {
    console.error('Reorder cards error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
