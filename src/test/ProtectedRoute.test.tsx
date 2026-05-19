import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { useAuthStore } from '../stores/auth.store';
import type { Role } from '../types';
import type { User } from '../types';

const superAdmin: User = { id: '1', email: 'sa@test.com', role: 'SUPER_ADMIN', status: 'ACTIVE' };
const admin: User = { id: '2', email: 'a@test.com', role: 'ADMIN', status: 'ACTIVE' };

function renderWithRouter(user: User | null, allowedRoles: string[]) {
  useAuthStore.setState({ user, accessToken: user ? 'tok' : null });

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles as Role[]} />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('redirects unauthenticated users to /login', () => {
    renderWithRouter(null, ['ADMIN']);
    expect(screen.getByText('Login Page')).toBeTruthy();
  });

  it('redirects users without the required role to /login', () => {
    renderWithRouter(admin, ['SUPER_ADMIN']);
    expect(screen.getByText('Login Page')).toBeTruthy();
  });

  it('renders children for a user with the correct role', () => {
    renderWithRouter(admin, ['ADMIN']);
    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('renders children when user has one of several allowed roles', () => {
    renderWithRouter(superAdmin, ['ADMIN', 'SUPER_ADMIN']);
    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('blocks a SUPER_ADMIN from an ADMIN-only route', () => {
    renderWithRouter(superAdmin, ['ADMIN']);
    expect(screen.getByText('Login Page')).toBeTruthy();
  });
});
