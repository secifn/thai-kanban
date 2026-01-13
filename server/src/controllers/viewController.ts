import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

// Get all views for a board
export const getViews = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const views = await prisma.view.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ views });
  } catch (error) {
    console.error('Get views error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Create view
export const createView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const { title, type, parentId, filter, sortOptions, visiblePropertyIds } = req.body;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์สร้างมุมมอง' });
      return;
    }

    const view = await prisma.view.create({
      data: {
        title: title || 'มุมมองใหม่',
        type: type || 'BOARD',
        parentId,
        filter: filter ? JSON.stringify(filter) : '{}',
        sortOptions: sortOptions ? JSON.stringify(sortOptions) : '[]',
        visiblePropertyIds: visiblePropertyIds ? JSON.stringify(visiblePropertyIds) : '[]',
        boardId,
      },
    });

    res.status(201).json({
      message: 'สร้างมุมมองสำเร็จ',
      view,
    });
  } catch (error) {
    console.error('Create view error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Update view
export const updateView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const viewId = req.params.viewId as string;
    const { title, type, filter, sortOptions, visiblePropertyIds, columnWidths, kanbanCalculations } = req.body;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขมุมมอง' });
      return;
    }

    const view = await prisma.view.update({
      where: { id: viewId },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(filter !== undefined && { filter: JSON.stringify(filter) }),
        ...(sortOptions !== undefined && { sortOptions: JSON.stringify(sortOptions) }),
        ...(visiblePropertyIds !== undefined && { visiblePropertyIds: JSON.stringify(visiblePropertyIds) }),
        ...(columnWidths !== undefined && { columnWidths: JSON.stringify(columnWidths) }),
        ...(kanbanCalculations !== undefined && { kanbanCalculations: JSON.stringify(kanbanCalculations) }),
      },
    });

    res.json({
      message: 'อัพเดทมุมมองสำเร็จ',
      view,
    });
  } catch (error) {
    console.error('Update view error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

// Delete view
export const deleteView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const boardId = req.params.boardId as string;
    const viewId = req.params.viewId as string;

    // Check permission
    const member = await prisma.boardMember.findFirst({
      where: {
        boardId,
        userId,
        role: { in: ['ADMIN', 'EDITOR'] },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบมุมมอง' });
      return;
    }

    // Don't allow deleting the last view
    const viewCount = await prisma.view.count({
      where: { boardId },
    });

    if (viewCount <= 1) {
      res.status(400).json({ error: 'ไม่สามารถลบมุมมองสุดท้ายได้' });
      return;
    }

    await prisma.view.delete({
      where: { id: viewId },
    });

    res.json({ message: 'ลบมุมมองสำเร็จ' });
  } catch (error) {
    console.error('Delete view error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
