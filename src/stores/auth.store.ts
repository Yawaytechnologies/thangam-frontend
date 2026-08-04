import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

export const AUTH_STORAGE_KEY = 'sth-auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken: refreshToken ?? null }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });

        // Remove persisted credentials entirely so a reload cannot rehydrate them.
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
