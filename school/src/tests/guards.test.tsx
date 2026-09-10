import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireRole } from '@/components/routing/Guards';
import { renderWithProviders } from './testUtils';
import { makeStore } from '@/app/store';
import { setCredentials } from '@/features/auth/authSlice';
import type { User } from '@/types';

const admin: User = {
  id: 'user_admin',
  name: 'Admin',
  email: 'admin@school.edu',
  username: 'admin',
  role: 'admin',
  avatarColor: '#000',
};

function ProtectedTree() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allow={['admin']} />}>
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Route>
        <Route element={<RequireRole allow={['staff']} />}>
          <Route path="/staff/dashboard" element={<div>Staff Dashboard</div>} />
        </Route>
      </Route>
    </Routes>
  );
}

describe('route guards', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithProviders(<ProtectedTree />, { route: '/admin/dashboard' });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('allows an admin to view the admin dashboard', () => {
    const store = makeStore();
    store.dispatch(setCredentials({ token: 'mock-token.user_admin', user: admin }));
    renderWithProviders(<ProtectedTree />, { route: '/admin/dashboard', store });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('blocks an admin from a staff-only route', () => {
    const store = makeStore();
    store.dispatch(setCredentials({ token: 'mock-token.user_admin', user: admin }));
    renderWithProviders(<ProtectedTree />, { route: '/staff/dashboard', store });
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
