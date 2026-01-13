import { create } from 'zustand';
import type { Board, Card, View, CardProperty } from '../types';
import { boardApi, cardApi, viewApi } from '../services/api';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  cards: Card[];
  views: View[];
  currentView: View | null;
  isLoading: boolean;
  error: string | null;
  
  // Board actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (board: Partial<Board>) => Promise<Board>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  
  // Card actions
  createCard: (card: Partial<Card>) => Promise<Card>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  reorderCards: (cards: Array<{ id: string; order: number; properties?: Record<string, string> }>) => Promise<void>;
  
  // View actions
  createView: (view: Partial<View>) => Promise<View>;
  updateView: (viewId: string, updates: Partial<View>) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
  setCurrentView: (view: View | null) => void;
  
  // Utility
  clearError: () => void;
  getCardsByStatus: (statusPropertyId: string) => Map<string, Card[]>;
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  boards: [],
  currentBoard: null,
  cards: [],
  views: [],
  currentView: null,
  isLoading: false,
  error: null,
  
  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { boards } = await boardApi.getBoards();
      // Parse properties JSON string
      const parsedBoards = boards.map(board => ({
        ...board,
        properties: typeof board.properties === 'string' 
          ? JSON.parse(board.properties) 
          : board.properties || []
      }));
      set({ boards: parsedBoards, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด', isLoading: false });
    }
  },
  
  fetchBoard: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { board } = await boardApi.getBoard(boardId);
      // Parse JSON strings
      const parsedBoard: Board = {
        ...board,
        properties: typeof board.properties === 'string' 
          ? JSON.parse(board.properties) as CardProperty[]
          : board.properties || [],
      };
      
      const parsedCards = (board.cards || []).map(card => ({
        ...card,
        properties: typeof card.properties === 'string' 
          ? JSON.parse(card.properties) 
          : card.properties || {},
      }));
      
      const parsedViews = (board.views || []).map(view => ({
        ...view,
        filter: typeof view.filter === 'string' ? JSON.parse(view.filter) : view.filter || {},
        sortOptions: typeof view.sortOptions === 'string' ? JSON.parse(view.sortOptions) : view.sortOptions || [],
        visiblePropertyIds: typeof view.visiblePropertyIds === 'string' ? JSON.parse(view.visiblePropertyIds) : view.visiblePropertyIds || [],
        columnWidths: typeof view.columnWidths === 'string' ? JSON.parse(view.columnWidths) : view.columnWidths || {},
        kanbanCalculations: typeof view.kanbanCalculations === 'string' ? JSON.parse(view.kanbanCalculations) : view.kanbanCalculations || {},
      }));
      
      const currentView = parsedViews.length > 0 ? parsedViews[0] : null;
      
      set({ 
        currentBoard: parsedBoard, 
        cards: parsedCards, 
        views: parsedViews,
        currentView,
        isLoading: false 
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด', isLoading: false });
    }
  },
  
  createBoard: async (board: Partial<Board>) => {
    set({ isLoading: true, error: null });
    try {
      const { board: newBoard } = await boardApi.createBoard(board);
      const parsedBoard = {
        ...newBoard,
        properties: typeof newBoard.properties === 'string' 
          ? JSON.parse(newBoard.properties) 
          : newBoard.properties || []
      };
      set(state => ({ 
        boards: [...state.boards, parsedBoard], 
        isLoading: false 
      }));
      return parsedBoard;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด', isLoading: false });
      throw error;
    }
  },
  
  updateBoard: async (boardId: string, updates: Partial<Board>) => {
    try {
      await boardApi.updateBoard(boardId, updates);
      set(state => ({
        boards: state.boards.map(b => 
          b.id === boardId ? { ...b, ...updates } : b
        ),
        currentBoard: state.currentBoard?.id === boardId 
          ? { ...state.currentBoard, ...updates }
          : state.currentBoard,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  deleteBoard: async (boardId: string) => {
    try {
      await boardApi.deleteBoard(boardId);
      set(state => ({
        boards: state.boards.filter(b => b.id !== boardId),
        currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  createCard: async (card: Partial<Card>) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      const { card: newCard } = await cardApi.createCard(currentBoard.id, card);
      const parsedCard = {
        ...newCard,
        properties: typeof newCard.properties === 'string' 
          ? JSON.parse(newCard.properties) 
          : newCard.properties || {},
      };
      set(state => ({ cards: [...state.cards, parsedCard] }));
      return parsedCard;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  updateCard: async (cardId: string, updates: Partial<Card>) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      await cardApi.updateCard(currentBoard.id, cardId, updates);
      set(state => ({
        cards: state.cards.map(c => 
          c.id === cardId ? { ...c, ...updates } : c
        ),
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  deleteCard: async (cardId: string) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      await cardApi.deleteCard(currentBoard.id, cardId);
      set(state => ({
        cards: state.cards.filter(c => c.id !== cardId),
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  reorderCards: async (cards) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      await cardApi.reorderCards(currentBoard.id, cards);
      
      // Update local state
      set(state => ({
        cards: state.cards.map(card => {
          const update = cards.find(c => c.id === card.id);
          if (update) {
            return {
              ...card,
              order: update.order,
              properties: update.properties ? { ...card.properties, ...update.properties } : card.properties,
            };
          }
          return card;
        }),
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  createView: async (view: Partial<View>) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      const { view: newView } = await viewApi.createView(currentBoard.id, view);
      set(state => ({ views: [...state.views, newView] }));
      return newView;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  updateView: async (viewId: string, updates: Partial<View>) => {
    const { currentBoard } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    
    try {
      await viewApi.updateView(currentBoard.id, viewId, updates);
      set(state => ({
        views: state.views.map(v => 
          v.id === viewId ? { ...v, ...updates } : v
        ),
        currentView: state.currentView?.id === viewId 
          ? { ...state.currentView, ...updates }
          : state.currentView,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  deleteView: async (viewId: string) => {
    const { currentBoard, views } = get();
    if (!currentBoard) throw new Error('ไม่พบบอร์ด');
    if (views.length <= 1) throw new Error('ไม่สามารถลบมุมมองสุดท้ายได้');
    
    try {
      await viewApi.deleteView(currentBoard.id, viewId);
      set(state => {
        const newViews = state.views.filter(v => v.id !== viewId);
        return {
          views: newViews,
          currentView: state.currentView?.id === viewId ? newViews[0] : state.currentView,
        };
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      set({ error: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
      throw error;
    }
  },
  
  setCurrentView: (view: View | null) => set({ currentView: view }),
  
  clearError: () => set({ error: null }),
  
  getCardsByStatus: (statusPropertyId: string) => {
    const { cards, currentBoard } = get();
    const cardsByStatus = new Map<string, Card[]>();
    
    // Get status property options
    const statusProperty = currentBoard?.properties.find(p => p.id === statusPropertyId);
    if (!statusProperty) return cardsByStatus;
    
    // Initialize with empty arrays for each option
    statusProperty.options.forEach(opt => {
      cardsByStatus.set(opt.id, []);
    });
    cardsByStatus.set('_none', []); // For cards without status
    
    // Group cards
    cards.forEach(card => {
      const statusValue = card.properties[statusPropertyId];
      const group = cardsByStatus.get(statusValue) || cardsByStatus.get('_none')!;
      group.push(card);
    });
    
    // Sort each group by order
    cardsByStatus.forEach(group => {
      group.sort((a, b) => a.order - b.order);
    });
    
    return cardsByStatus;
  },
}));
