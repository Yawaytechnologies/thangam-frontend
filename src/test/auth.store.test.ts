import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth.store';
import type { User } from '../types';

const mockUser: User = {
  id: 'user-1',
  email: 'admin@srithangam.com',
  role: 'ADMIN',
  status: 'ACTIVE',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('starts with null user and null accessToken', () => {
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('setAuth stores user and accessToken', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token');
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(accessToken).toBe('test-token');
  });

  it('setAccessToken updates only the token', () => {
    useAuthStore.getState().setAuth(mockUser, 'old-token');
    useAuthStore.getState().setAccessToken('new-token');
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(accessToken).toBe('new-token');
  });

  it('logout clears both user and accessToken', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token');
    useAuthStore.getState().logout();
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });
});
