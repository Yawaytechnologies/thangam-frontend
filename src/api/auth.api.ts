import api from '../lib/axios';
import type { User } from '../types';

export const authApi = {
  login: async (credentials: { email?: string; phone?: string; password: string }) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', credentials);
    return data.data;
  },
  logout: (accessToken?: string | null) =>
    api.post('/auth/logout', undefined, {
      skipAuthRedirect: true,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),
  getMe: async () => {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data.data;
  },
};
