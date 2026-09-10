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
import type { Staff, Student, User } from '@/types';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

/** Guard that only allows administrators through. */
function ensureAdmin(request: Request) {
  const user = getAuthUser(request);
  if (!user) return { error: unauthorized() as ReturnType<typeof unauthorized> };
  if (user.role !== 'admin') return { error: badRequest('Only administrators can manage users.') };
  return { user };
}

function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    studentIds: u.studentIds ?? [],
  };
}

export const managementHandlers = [
  // --- Parents ---------------------------------------------------------------
  http.get('/api/parents', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    return ok(database.data.users.filter((u) => u.role === 'parent').map(publicUser));
  }),

  http.post('/api/parents', async ({ request }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<User> & { password?: string };
    const fieldErrors: Record<string, string> = {};
    if (!body.name?.trim()) fieldErrors.name = 'Name is required.';
    if (!body.email?.trim()) fieldErrors.email = 'Email is required.';
    if (body.email && database.data.users.some((u) => u.email.toLowerCase() === body.email!.toLowerCase())) {
      fieldErrors.email = 'A user with this email already exists.';
    }
    if (Object.keys(fieldErrors).length) return badRequest('Please fix the highlighted fields.', fieldErrors);

    const parent = database.update((db) => {
      const username = body.username?.trim() || body.email!.split('@')[0];
      const user: User = {
        id: uid('user'),
        name: body.name!.trim(),
        email: body.email!.trim(),
        username,
        role: 'parent',
        avatarColor: pickColor(),
        studentIds: [],
      };
      db.users.push(user);
      db.passwords[user.id] = body.password?.trim() || 'password123';
      return user;
    });
    return created(publicUser(parent));
  }),

  http.put('/api/parents/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<User>;
    const updated = database.update((db) => {
      const user = db.users.find((u) => u.id === params.id && u.role === 'parent');
      if (!user) return null;
      if (body.name?.trim()) user.name = body.name.trim();
      if (body.email?.trim()) user.email = body.email.trim();
      if (body.username?.trim()) user.username = body.username.trim();
      return user;
    });
    return updated ? ok(publicUser(updated)) : notFound('Parent account not found.');
  }),

  http.delete('/api/parents/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    // Prevent orphaning students; the admin must reassign or remove them first.
    const hasChildren = database.data.students.some((s) => s.parentId === params.id);
    if (hasChildren) {
      return badRequest('This parent still has linked students. Reassign or delete those students first.');
    }
    const exists = database.data.users.some((u) => u.id === params.id && u.role === 'parent');
    if (!exists) return notFound('Parent account not found.');
    database.update((db) => {
      db.users = db.users.filter((u) => u.id !== params.id);
      delete db.passwords[params.id as string];
    });
    return noContent();
  }),

  // --- Students --------------------------------------------------------------
  http.post('/api/students', async ({ request }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<Student>;
    const fieldErrors: Record<string, string> = {};
    if (!body.name?.trim()) fieldErrors.name = 'Name is required.';
    if (!body.classId) fieldErrors.classId = 'Class is required.';
    if (!body.section) fieldErrors.section = 'Section is required.';
    if (!body.parentId) fieldErrors.parentId = 'Parent is required.';
    if (Object.keys(fieldErrors).length) return badRequest('Please fix the highlighted fields.', fieldErrors);

    const student = database.update((db) => {
      const record: Student = {
        id: uid('stu'),
        name: body.name!.trim(),
        rollNumber: body.rollNumber?.trim() || `R-${db.students.length + 1}`,
        classId: body.classId!,
        section: body.section!,
        parentId: body.parentId!,
        gender: body.gender ?? 'other',
        dateOfBirth: body.dateOfBirth || '2014-01-01',
        avatarColor: pickColor(),
        guardianName: body.guardianName?.trim() || '',
        contactPhone: body.contactPhone?.trim() || '',
        admissionDate: body.admissionDate || todayIso(),
      };
      db.students.push(record);

      // Link the student to the parent account.
      const parent = db.users.find((u) => u.id === record.parentId);
      if (parent) parent.studentIds = [...(parent.studentIds ?? []), record.id];

      // Auto-assign active fee structures that apply to this student.
      db.feeStructures
        .filter(
          (f) =>
            f.status === 'active' &&
            (f.classId === 'all' || f.classId === record.classId) &&
            (f.section === 'all' || f.section === record.section),
        )
        .forEach((f) => {
          db.studentFees.push({
            id: uid('sf'),
            studentId: record.id,
            feeStructureId: f.id,
            amount: f.amount,
            amountPaid: 0,
            dueDate: f.dueDate,
            status: f.dueDate < todayIso() ? 'overdue' : 'unpaid',
            category: f.category,
            academicYear: f.academicYear,
          });
        });
      return record;
    });
    return created(student);
  }),

  http.put('/api/students/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<Student>;
    const updated = database.update((db) => {
      const idx = db.students.findIndex((s) => s.id === params.id);
      if (idx === -1) return null;
      const prev = db.students[idx];

      // If the parent changed, move the link between parent accounts.
      if (body.parentId && body.parentId !== prev.parentId) {
        const oldParent = db.users.find((u) => u.id === prev.parentId);
        if (oldParent) oldParent.studentIds = (oldParent.studentIds ?? []).filter((id) => id !== prev.id);
        const newParent = db.users.find((u) => u.id === body.parentId);
        if (newParent) newParent.studentIds = [...(newParent.studentIds ?? []), prev.id];
      }

      db.students[idx] = { ...prev, ...body, id: prev.id };
      return db.students[idx];
    });
    return updated ? ok(updated) : notFound('Student not found.');
  }),

  http.delete('/api/students/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const id = params.id as string;
    const exists = database.data.students.some((s) => s.id === id);
    if (!exists) return notFound('Student not found.');
    database.update((db) => {
      db.students = db.students.filter((s) => s.id !== id);
      db.studentFees = db.studentFees.filter((f) => f.studentId !== id);
      db.payments = db.payments.filter((p) => p.studentId !== id);
      db.attendance = db.attendance.filter((a) => a.studentId !== id);
      db.users.forEach((u) => {
        if (u.studentIds?.includes(id)) u.studentIds = u.studentIds.filter((sid) => sid !== id);
      });
    });
    return noContent();
  }),

  // --- Staff -----------------------------------------------------------------
  http.post('/api/staff', async ({ request }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<Staff> & { password?: string };
    const fieldErrors: Record<string, string> = {};
    if (!body.name?.trim()) fieldErrors.name = 'Name is required.';
    if (!body.email?.trim()) fieldErrors.email = 'Email is required.';
    if (body.email && database.data.users.some((u) => u.email.toLowerCase() === body.email!.toLowerCase())) {
      fieldErrors.email = 'A user with this email already exists.';
    }
    if (!body.department?.trim()) fieldErrors.department = 'Department is required.';
    if (Object.keys(fieldErrors).length) return badRequest('Please fix the highlighted fields.', fieldErrors);

    const staff = database.update((db) => {
      const color = pickColor();
      const record: Staff = {
        id: uid('staff'),
        name: body.name!.trim(),
        email: body.email!.trim(),
        department: body.department!.trim(),
        designation: body.designation?.trim() || 'Teacher',
        subjects: body.subjects ?? [],
        assignedClassIds: body.assignedClassIds ?? [],
        contactPhone: body.contactPhone?.trim() || '',
        joiningDate: body.joiningDate || todayIso(),
        avatarColor: color,
        leaveBalance: body.leaveBalance ?? 20,
      };
      db.staff.push(record);

      // Create a login account so the staff member can sign in.
      const user: User = {
        id: uid('user'),
        name: record.name,
        email: record.email,
        username: record.email.split('@')[0],
        role: 'staff',
        avatarColor: color,
        staffId: record.id,
        department: record.department,
      };
      db.users.push(user);
      db.passwords[user.id] = body.password?.trim() || 'password123';
      return record;
    });
    return created(staff);
  }),

  http.put('/api/staff/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const body = (await request.json()) as Partial<Staff>;
    const updated = database.update((db) => {
      const idx = db.staff.findIndex((s) => s.id === params.id);
      if (idx === -1) return null;
      db.staff[idx] = { ...db.staff[idx], ...body, id: db.staff[idx].id };
      // Keep the linked user account in sync.
      const user = db.users.find((u) => u.staffId === params.id);
      if (user) {
        if (body.name) user.name = body.name;
        if (body.email) user.email = body.email;
        if (body.department) user.department = body.department;
      }
      return db.staff[idx];
    });
    return updated ? ok(updated) : notFound('Staff member not found.');
  }),

  http.delete('/api/staff/:id', async ({ request, params }) => {
    await networkDelay();
    const guard = ensureAdmin(request);
    if ('error' in guard) return guard.error;

    const id = params.id as string;
    const exists = database.data.staff.some((s) => s.id === id);
    if (!exists) return notFound('Staff member not found.');
    database.update((db) => {
      db.staff = db.staff.filter((s) => s.id !== id);
      const user = db.users.find((u) => u.staffId === id);
      if (user) {
        db.users = db.users.filter((u) => u.id !== user.id);
        delete db.passwords[user.id];
      }
    });
    return noContent();
  }),
];
