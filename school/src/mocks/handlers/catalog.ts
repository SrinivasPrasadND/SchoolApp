import { http } from 'msw';
import { database } from '../db/database';
import { getAuthUser, networkDelay, notFound, ok, unauthorized } from './helpers';

export const catalogHandlers = [
  http.get('/api/classes', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    return ok(database.data.classes);
  }),

  http.get('/api/students', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const section = url.searchParams.get('section');
    const search = url.searchParams.get('search')?.toLowerCase();

    let items = database.data.students;

    // Parents/students only see their own linked students.
    if (user.role === 'parent') {
      items = items.filter((s) => user.studentIds?.includes(s.id));
    } else if (user.role === 'student') {
      items = items.filter((s) => s.id === user.studentId);
    } else if (user.role === 'staff') {
      const staff = database.data.staff.find((s) => s.id === user.staffId);
      items = items.filter((s) => staff?.assignedClassIds.includes(s.classId));
    }

    if (classId) items = items.filter((s) => s.classId === classId);
    if (section) items = items.filter((s) => s.section === section);
    if (search) items = items.filter((s) => s.name.toLowerCase().includes(search));

    return ok(items);
  }),

  http.get('/api/students/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const student = database.data.students.find((s) => s.id === params.id);
    return student ? ok(student) : notFound('Student not found.');
  }),

  http.get('/api/staff', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    return ok(database.data.staff);
  }),

  http.get('/api/staff/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const staff = database.data.staff.find((s) => s.id === params.id);
    return staff ? ok(staff) : notFound('Staff member not found.');
  }),

  http.get('/api/parents/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const parent = database.data.users.find((u) => u.id === params.id && u.role === 'parent');
    return parent
      ? ok({
          id: parent.id,
          name: parent.name,
          email: parent.email,
          username: parent.username,
        })
      : notFound('Parent account not found.');
  }),

  http.get('/api/timetable', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const staffId = url.searchParams.get('staffId');
    let items = database.data.timetable;
    if (classId) items = items.filter((t) => t.classId === classId);
    if (staffId) items = items.filter((t) => t.staffId === staffId);
    return ok(items);
  }),
];
