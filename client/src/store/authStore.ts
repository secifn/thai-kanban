import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          localStorage.setItem('token', response.token);
          set({ user: response.user, token: response.token, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string } } };
          set({ 
            error: err.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(email, password, name);
          localStorage.setItem('token', response.token);
          set({ user: response.user, token: response.token, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string } } };
          set({ 
            error: err.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
      },
      
      loadUser: async () => {
        const token = get().token || localStorage.getItem('token');
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          set({ user: response.user, token, isLoading: false });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null, isLoading: false });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
