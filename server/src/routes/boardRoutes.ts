import { Router } from 'express';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
  updateMemberRole,
} from '../controllers/boardController';
import {
  getCards,
  createCard,
  getCard,
  updateCard,
  deleteCard,
  reorderCards,
} from '../controllers/cardController';
import {
  getViews,
  createView,
  updateView,
  deleteView,
} from '../controllers/viewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Board routes
router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoard);
router.put('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);

// Board members
router.post('/:boardId/members', addBoardMember);
router.delete('/:boardId/members/:memberId', removeBoardMember);
router.put('/:boardId/members/:memberId', updateMemberRole);

// Card routes
router.get('/:boardId/cards', getCards);
router.post('/:boardId/cards', createCard);
router.get('/:boardId/cards/:cardId', getCard);
router.put('/:boardId/cards/:cardId', updateCard);
router.delete('/:boardId/cards/:cardId', deleteCard);
router.put('/:boardId/cards-reorder', reorderCards);

// View routes
router.get('/:boardId/views', getViews);
router.post('/:boardId/views', createView);
router.put('/:boardId/views/:viewId', updateView);
router.delete('/:boardId/views/:viewId', deleteView);

export default router;
