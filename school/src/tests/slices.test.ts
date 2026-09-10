import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from '@/features/auth/authSlice';
import uiReducer, { addToast, dismissToast, setSelectedChild } from '@/features/ui/uiSlice';
import type { User } from '@/types';

const user: User = {
  id: 'user_admin',
  name: 'Priya Menon',
  email: 'admin@school.edu',
  username: 'admin',
  role: 'admin',
  avatarColor: '#000',
};

describe('authSlice', () => {
  it('stores a session on setCredentials', () => {
    const state = authReducer(undefined, setCredentials({ token: 'mock-token.user_admin', user }));
    expect(state.session?.user.email).toBe('admin@school.edu');
    expect(state.session?.token).toBe('mock-token.user_admin');
  });

  it('clears the session on logout', () => {
    const loggedIn = authReducer(undefined, setCredentials({ token: 't', user }));
    const state = authReducer(loggedIn, logout());
    expect(state.session).toBeNull();
  });
});

describe('uiSlice', () => {
  it('adds and dismisses toasts', () => {
    const withToast = uiReducer(undefined, addToast({ message: 'Saved', type: 'success' }));
    expect(withToast.toasts).toHaveLength(1);
    const id = withToast.toasts[0].id;
    const cleared = uiReducer(withToast, dismissToast(id));
    expect(cleared.toasts).toHaveLength(0);
  });

  it('sets the selected child', () => {
    const state = uiReducer(undefined, setSelectedChild('stu_2'));
    expect(state.selectedChildId).toBe('stu_2');
  });
});
