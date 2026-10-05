import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken, refreshToken }) => {
      if (user.role === 'SUPER_ADMIN') {
        setAuth(user, accessToken, refreshToken);
        navigate('/super-admin/dashboard');
      } else if (user.role === 'ADMIN') {
        setAuth(user, accessToken, refreshToken);
        navigate('/admin/dashboard');
      } else {
        toast.error('Only Super Admin and Admin users can access this portal.');
        navigate('/login', { replace: true });
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: () => {
      logout();
      navigate('/login');
    },
  });
}
