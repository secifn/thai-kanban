import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { importBoardArchive } from '../services/importService';

export const importArchive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'กรุณาอัพโหลดไฟล์ .boardarchive' });
      return;
    }

    // Check file extension
    if (!file.originalname.endsWith('.boardarchive')) {
      res.status(400).json({ error: 'รองรับเฉพาะไฟล์ .boardarchive เท่านั้น' });
      return;
    }

    const result = await importBoardArchive(file.buffer, userId);

    res.status(201).json({
      message: 'นำเข้าบอร์ดสำเร็จ',
      ...result,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้าไฟล์',
    });
  }
};
