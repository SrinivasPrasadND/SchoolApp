// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { makeStore } from '@/app/store';
import { api } from '@/services/api/endpoints';

describe('auth API workflow (MSW-backed)', () => {
  it('logs in with valid demo credentials', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      api.endpoints.login.initiate({ identifier: 'admin@school.edu', password: 'password123' }),
    );
    expect('data' in result).toBe(true);
    if ('data' in result && result.data) {
      expect(result.data.user.role).toBe('admin');
      expect(result.data.token).toContain('mock-token');
    }
  });

  it('rejects invalid credentials with a 400', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      api.endpoints.login.initiate({ identifier: 'admin@school.edu', password: 'wrong' }),
    );
    expect('error' in result).toBe(true);
  });

  it('loads dashboard metrics after authenticating', async () => {
    const store = makeStore();
    const login = await store.dispatch(
      api.endpoints.login.initiate({ identifier: 'admin@school.edu', password: 'password123' }),
    );
    // Seed the auth slice so the base query attaches the token.
    if ('data' in login && login.data) {
      const { setCredentials } = await import('@/features/auth/authSlice');
      store.dispatch(setCredentials(login.data));
    }
    const metrics = await store.dispatch(api.endpoints.getAdminDashboard.initiate());
    expect('data' in metrics).toBe(true);
    if ('data' in metrics && metrics.data) {
      expect(metrics.data.totalStudents).toBeGreaterThan(0);
      expect(metrics.data.fees.expected).toBeGreaterThan(0);
    }
  });
});
