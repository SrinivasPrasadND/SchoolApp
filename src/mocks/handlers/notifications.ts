import { http } from 'msw';
import { database } from '../db/database';
import { getAuthUser, networkDelay, notFound, ok, unauthorized } from './helpers';

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const items = database.data.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok(items);
  }),

  http.post('/api/notifications/:id/read', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const updated = database.update((db) => {
      const n = db.notifications.find((x) => x.id === params.id && x.userId === user.id);
      if (!n) return null;
      n.read = true;
      return n;
    });
    return updated ? ok(updated) : notFound('Notification not found.');
  }),

  http.post('/api/notifications/read-all', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    database.update((db) => {
      db.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
    });
    return ok({ success: true });
  }),
];
