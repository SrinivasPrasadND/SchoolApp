import { http } from 'msw';
import { database } from '../db/database';
import { badRequest, getAuthUser, networkDelay, ok, unauthorized } from './helpers';
import type { LoginRequest } from '@/types';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as LoginRequest;
    const { identifier, password } = body ?? {};

    const fieldErrors: Record<string, string> = {};
    if (!identifier) fieldErrors.identifier = 'Email or username is required.';
    if (!password) fieldErrors.password = 'Password is required.';
    if (Object.keys(fieldErrors).length) {
      return badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    const user = database.data.users.find(
      (u) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.username.toLowerCase() === identifier.toLowerCase(),
    );

    if (!user || database.data.passwords[user.id] !== password) {
      return badRequest('Invalid credentials. Please check your email/username and password.');
    }

    return ok({ token: `mock-token.${user.id}`, user });
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    return ok(user);
  }),

  http.post('/api/auth/logout', async () => {
    await networkDelay();
    return ok({ success: true });
  }),

  // Restores the seeded demo dataset.
  http.post('/api/system/reset', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    database.reset();
    return ok({ success: true });
  }),
];
