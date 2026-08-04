import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { cancelPendingAuthRefresh } from '../lib/axios';
import { useAuthStore } from '../stores/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken, refreshToken);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => {
      const accessToken = useAuthStore.getState().accessToken;

      // Client logout is deliberately synchronous and never waits for the server.
      cancelPendingAuthRefresh();
      logout();
      void queryClient.cancelQueries();
      queryClient.clear();
      toast.dismiss();
      navigate('/login', { replace: true });

      void authApi.logout(accessToken).catch(() => undefined);
      return Promise.resolve();
    },
  });
}
