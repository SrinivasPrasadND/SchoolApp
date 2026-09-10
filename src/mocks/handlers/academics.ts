import { http } from 'msw';
import { database } from '../db/database';
import {
  badRequest,
  created,
  getAuthUser,
  networkDelay,
  noContent,
  notFound,
  ok,
  unauthorized,
} from './helpers';
import { todayIso, uid } from '@/utils';
import type { Announcement, Homework, Note } from '@/types';

export const academicsHandlers = [
  // --- Announcements ---------------------------------------------------------
  http.get('/api/announcements', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const items = database.data.announcements
      .filter((a) => a.audience.includes(user.role))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
    return ok(items);
  }),

  http.post('/api/announcements', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin' && user.role !== 'staff') {
      return badRequest('Only staff or administrators can post announcements.');
    }
    const body = (await request.json()) as Partial<Announcement>;
    if (!body.title?.trim() || !body.body?.trim()) {
      return badRequest('Title and message are required.', {
        title: !body.title?.trim() ? 'Title is required.' : '',
        body: !body.body?.trim() ? 'Message is required.' : '',
      });
    }
    const announcement = database.update((db) => {
      const created: Announcement = {
        id: uid('ann'),
        title: body.title!.trim(),
        body: body.body!.trim(),
        category: body.category ?? 'general',
        priority: body.priority ?? 'normal',
        pinned: body.pinned ?? false,
        publishedAt: todayIso(),
        author: user.name,
        audience: body.audience ?? ['admin', 'staff', 'parent', 'student'],
        attachments: body.attachments ?? [],
        readBy: [],
      };
      db.announcements.unshift(created);
      return created;
    });
    return created(announcement);
  }),

  http.post('/api/announcements/:id/read', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const updated = database.update((db) => {
      const ann = db.announcements.find((a) => a.id === params.id);
      if (!ann) return null;
      if (!ann.readBy.includes(user.id)) ann.readBy.push(user.id);
      return ann;
    });
    return updated ? ok(updated) : notFound('Announcement not found.');
  }),

  // --- Homework --------------------------------------------------------------
  http.get('/api/homework', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject');
    const studentId = url.searchParams.get('studentId');
    let items = database.data.homework;

    if (user.role === 'student' || user.role === 'parent') {
      const linkedIds = user.role === 'student' ? [user.studentId] : user.studentIds ?? [];
      // When a specific (linked) student is selected, scope to that child only.
      const targetIds = studentId && linkedIds.includes(studentId) ? [studentId] : linkedIds;
      const linked = database.data.students.filter((s) => targetIds.includes(s.id));
      items = items.filter((h) =>
        linked.some((s) => s.classId === h.classId && s.section === h.section),
      );
    } else if (user.role === 'staff') {
      const staff = database.data.staff.find((s) => s.id === user.staffId);
      items = items.filter((h) => staff?.assignedClassIds.includes(h.classId));
    }
    if (subject) items = items.filter((h) => h.subject === subject);
    return ok([...items].sort((a, b) => b.assignedDate.localeCompare(a.assignedDate)));
  }),

  http.post('/api/homework', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'staff' && user.role !== 'admin') {
      return badRequest('Only staff can create homework.');
    }
    const body = (await request.json()) as Partial<Homework>;
    if (!body.title?.trim() || !body.subject || !body.dueDate) {
      return badRequest('Title, subject and due date are required.');
    }
    const hw = database.update((db) => {
      const created: Homework = {
        id: uid('hw'),
        title: body.title!.trim(),
        subject: body.subject!,
        classId: body.classId ?? 'cls_5',
        section: body.section ?? 'A',
        instructions: body.instructions ?? '',
        assignedDate: body.assignedDate ?? todayIso(),
        dueDate: body.dueDate!,
        attachments: body.attachments ?? [],
        completedBy: [],
      };
      db.homework.unshift(created);
      return created;
    });
    return created(hw);
  }),

  http.post('/api/homework/:id/complete', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const studentId = user.studentId;
    if (!studentId) return badRequest('Only students can mark homework complete.');
    const updated = database.update((db) => {
      const hw = db.homework.find((h) => h.id === params.id);
      if (!hw) return null;
      if (hw.completedBy.includes(studentId)) {
        hw.completedBy = hw.completedBy.filter((id) => id !== studentId);
      } else {
        hw.completedBy.push(studentId);
      }
      return hw;
    });
    return updated ? ok(updated) : notFound('Homework not found.');
  }),

  // --- Notes -----------------------------------------------------------------
  http.get('/api/notes', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject');
    const search = url.searchParams.get('search')?.toLowerCase();
    const studentId = url.searchParams.get('studentId');
    let items = database.data.notes;

    if (user.role === 'student' || user.role === 'parent') {
      // Students/parents only see published notes for their class.
      const linkedIds = user.role === 'student' ? [user.studentId] : user.studentIds ?? [];
      const targetIds = studentId && linkedIds.includes(studentId) ? [studentId] : linkedIds;
      const linked = database.data.students.filter((s) => targetIds.includes(s.id));
      items = items.filter(
        (n) =>
          n.status === 'published' &&
          linked.some((s) => s.classId === n.classId && s.section === n.section),
      );
    } else if (user.role === 'staff') {
      items = items.filter((n) => n.authorId === user.staffId);
    }
    if (subject) items = items.filter((n) => n.subject === subject);
    if (search)
      items = items.filter(
        (n) => n.title.toLowerCase().includes(search) || n.description.toLowerCase().includes(search),
      );
    return ok([...items].sort((a, b) => b.date.localeCompare(a.date)));
  }),

  http.post('/api/notes', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'staff' && user.role !== 'admin') {
      return badRequest('Only staff can create notes.');
    }
    const body = (await request.json()) as Partial<Note>;
    if (!body.title?.trim() || !body.subject) {
      return badRequest('Title and subject are required.');
    }
    const note = database.update((db) => {
      const created: Note = {
        id: uid('note'),
        title: body.title!.trim(),
        subject: body.subject!,
        classId: body.classId ?? 'cls_5',
        section: body.section ?? 'A',
        description: body.description ?? '',
        objectives: body.objectives ?? '',
        date: body.date ?? todayIso(),
        status: body.status ?? 'draft',
        authorId: user.staffId ?? user.id,
        authorName: user.name,
        attachments: body.attachments ?? [],
        reviewedBy: [],
      };
      db.notes.unshift(created);
      return created;
    });
    return created(note);
  }),

  http.put('/api/notes/:id', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as Partial<Note>;
    const updated = database.update((db) => {
      const idx = db.notes.findIndex((n) => n.id === params.id);
      if (idx === -1) return null;
      db.notes[idx] = { ...db.notes[idx], ...body, id: db.notes[idx].id };
      return db.notes[idx];
    });
    return updated ? ok(updated) : notFound('Note not found.');
  }),

  http.delete('/api/notes/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const exists = database.data.notes.some((n) => n.id === params.id);
    if (!exists) return notFound('Note not found.');
    database.update((db) => {
      db.notes = db.notes.filter((n) => n.id !== params.id);
    });
    return noContent();
  }),

  http.post('/api/notes/:id/review', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const studentId = user.studentId;
    if (!studentId) return badRequest('Only students can mark notes reviewed.');
    const updated = database.update((db) => {
      const note = db.notes.find((n) => n.id === params.id);
      if (!note) return null;
      if (!note.reviewedBy.includes(studentId)) note.reviewedBy.push(studentId);
      return note;
    });
    return updated ? ok(updated) : notFound('Note not found.');
  }),

  // --- Activities ------------------------------------------------------------
  http.get('/api/activities', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    let items = database.data.activities;
    if (date) items = items.filter((a) => a.date === date);
    return ok([...items].sort((a, b) => a.date.localeCompare(b.date)));
  }),
];
