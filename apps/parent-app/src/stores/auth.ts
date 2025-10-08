import { create } from 'zustand';
import api from '@kids/utils/api';

// The User interface should match the payload from the backend
export interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing session
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ access_token: string }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      await get().fetchProfile();
    } catch (error: any) {
      set({ error: 'Login failed. Please check your credentials.', isLoading: false, isAuthenticated: false });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    const token = localStorage.getItem('access_token');
    if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
    }
    try {
      const response = await api.get<User>('/auth/profile');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false, error: 'Session expired. Please log in again.' });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));