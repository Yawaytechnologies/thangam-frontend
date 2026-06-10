import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipAuthRedirect?: boolean;
    _retry?: boolean;
  }
}

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

const REFRESH_PATH = '/auth/refresh';
const REFRESH_URL = joinUrl(BASE_URL, REFRESH_PATH);

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let hasRedirectedToLogin = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

function redirectToLoginOnce() {
  const alreadyOnLogin = window.location.pathname === '/login';
  if (hasRedirectedToLogin && alreadyOnLogin) return;
  hasRedirectedToLogin = true;
  useAuthStore.getState().logout();
  if (!alreadyOnLogin) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original?.skipAuthRedirect) {
      return Promise.reject(error);
    }

    if (status === 401 && original && !original._retry) {
      const authState = useAuthStore.getState();
      const refreshToken = authState.refreshToken;
      if (!refreshToken) {
        const sessionError = new Error('Session expired. Please login again.');
        redirectToLoginOnce();
        return Promise.reject(sessionError);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(REFRESH_URL, { refreshToken }, { withCredentials: true });
        const newToken = data?.data?.accessToken ?? data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;
        if (!newToken) throw new Error('Refresh response did not include an access token');
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, newToken, newRefreshToken ?? refreshToken);
        } else {
          useAuthStore.getState().setAccessToken(newToken);
        }
        hasRedirectedToLogin = false;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        const refreshStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (refreshStatus === 401 || refreshStatus === 403) {
          const sessionError = new Error('Session expired. Please login again.');
          redirectToLoginOnce();
          return Promise.reject(sessionError);
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
