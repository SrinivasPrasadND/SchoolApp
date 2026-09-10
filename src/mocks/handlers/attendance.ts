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
import { uid } from '@/utils';
import type { AttendanceRecord } from '@/types';

interface AttendanceSubmission {
  classId: string;
  section: string;
  date: string;
  submitted: boolean;
  records: { studentId: string; status: AttendanceRecord['status']; remarks?: string }[];
}

export const attendanceHandlers = [
  http.get('/api/attendance', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const section = url.searchParams.get('section');
    const date = url.searchParams.get('date');
    const studentId = url.searchParams.get('studentId');

    let items = database.data.attendance;

    if (user.role === 'student') {
      items = items.filter((a) => a.studentId === user.studentId);
    } else if (user.role === 'parent') {
      items = items.filter((a) => user.studentIds?.includes(a.studentId));
    }

    if (classId) items = items.filter((a) => a.classId === classId);
    if (section) items = items.filter((a) => a.section === section);
    if (date) items = items.filter((a) => a.date === date);
    if (studentId) items = items.filter((a) => a.studentId === studentId);

    return ok(items);
  }),

  http.post('/api/attendance', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'staff' && user.role !== 'admin') {
      return badRequest('Only staff can submit attendance.');
    }

    const body = (await request.json()) as AttendanceSubmission;
    if (!body.date || !body.classId || !body.records?.length) {
      return badRequest('Attendance date, class and records are required.');
    }

    const saved = database.update((db) => {
      // Remove any existing records for this class/section/date, then insert new ones.
      db.attendance = db.attendance.filter(
        (a) => !(a.classId === body.classId && a.section === body.section && a.date === body.date),
      );
      const newRecords: AttendanceRecord[] = body.records.map((r) => ({
        id: uid('att'),
        studentId: r.studentId,
        classId: body.classId,
        section: body.section,
        date: body.date,
        status: r.status,
        remarks: r.remarks,
        submitted: body.submitted,
        markedBy: user.staffId ?? user.id,
      }));
      db.attendance.push(...newRecords);
      return newRecords;
    });

    return created(saved);
  }),

  http.delete('/api/attendance/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const exists = database.data.attendance.some((a) => a.id === params.id);
    if (!exists) return notFound('Attendance record not found.');
    database.update((db) => {
      db.attendance = db.attendance.filter((a) => a.id !== params.id);
    });
    return noContent();
  }),
];
