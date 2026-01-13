import { Router } from 'express';
import multer from 'multer';
import { importArchive } from '../controllers/importController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Import route
router.post('/archive', authMiddleware, upload.single('file'), importArchive);

export default router;
