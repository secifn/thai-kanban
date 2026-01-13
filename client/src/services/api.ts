import axios from 'axios';
import type { User, Board, Card, View, AuthResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
    return data;
  },
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
  
  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/auth/profile');
    return data;
  },
  
  updateProfile: async (updates: Partial<User>): Promise<{ user: User }> => {
    const { data } = await api.put<{ user: User }>('/auth/profile', updates);
    return data;
  },
};

// Board API
export const boardApi = {
  getBoards: async (): Promise<{ boards: Board[] }> => {
    const { data } = await api.get<{ boards: Board[] }>('/boards');
    return data;
  },
  
  getBoard: async (boardId: string): Promise<{ board: Board }> => {
    const { data } = await api.get<{ board: Board }>(`/boards/${boardId}`);
    return data;
  },
  
  createBoard: async (board: Partial<Board>): Promise<{ board: Board }> => {
    const { data } = await api.post<{ board: Board }>('/boards', board);
    return data;
  },
  
  updateBoard: async (boardId: string, updates: Partial<Board>): Promise<{ board: Board }> => {
    const { data } = await api.put<{ board: Board }>(`/boards/${boardId}`, updates);
    return data;
  },
  
  deleteBoard: async (boardId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}`);
  },
  
  addMember: async (boardId: string, email: string, role: string): Promise<void> => {
    await api.post(`/boards/${boardId}/members`, { email, role });
  },
  
  removeMember: async (boardId: string, memberId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}/members/${memberId}`);
  },
  
  updateMemberRole: async (boardId: string, memberId: string, role: string): Promise<void> => {
    await api.put(`/boards/${boardId}/members/${memberId}`, { role });
  },
};

// Card API
export const cardApi = {
  getCards: async (boardId: string): Promise<{ cards: Card[] }> => {
    const { data } = await api.get<{ cards: Card[] }>(`/boards/${boardId}/cards`);
    return data;
  },
  
  createCard: async (boardId: string, card: Partial<Card>): Promise<{ card: Card }> => {
    const { data } = await api.post<{ card: Card }>(`/boards/${boardId}/cards`, card);
    return data;
  },
  
  updateCard: async (boardId: string, cardId: string, updates: Partial<Card>): Promise<{ card: Card }> => {
    const { data } = await api.put<{ card: Card }>(`/boards/${boardId}/cards/${cardId}`, updates);
    return data;
  },
  
  deleteCard: async (boardId: string, cardId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}/cards/${cardId}`);
  },
  
  reorderCards: async (boardId: string, cards: Array<{ id: string; order: number; properties?: Record<string, string> }>): Promise<void> => {
    await api.put(`/boards/${boardId}/cards-reorder`, { cards });
  },
};

// View API
export const viewApi = {
  getViews: async (boardId: string): Promise<{ views: View[] }> => {
    const { data } = await api.get<{ views: View[] }>(`/boards/${boardId}/views`);
    return data;
  },
  
  createView: async (boardId: string, view: Partial<View>): Promise<{ view: View }> => {
    const { data } = await api.post<{ view: View }>(`/boards/${boardId}/views`, view);
    return data;
  },
  
  updateView: async (boardId: string, viewId: string, updates: Partial<View>): Promise<{ view: View }> => {
    const { data } = await api.put<{ view: View }>(`/boards/${boardId}/views/${viewId}`, updates);
    return data;
  },
  
  deleteView: async (boardId: string, viewId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}/views/${viewId}`);
  },
};

// Import API
export const importApi = {
  importArchive: async (file: File): Promise<{ boardId: string; boardTitle: string; cardsImported: number; viewsImported: number; filesImported: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await api.post('/import/archive', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export default api;
