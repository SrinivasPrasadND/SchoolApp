import { http } from 'msw';
import { database } from '../db/database';
import {
  badRequest,
  created,
  getAuthUser,
  networkDelay,
  notFound,
  ok,
  unauthorized,
} from './helpers';
import { rangesOverlap, todayIso, uid } from '@/utils';
import type { LeaveRequest } from '@/types';

export const leaveHandlers = [
  http.get('/api/leaves', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const staffId = url.searchParams.get('staffId');

    let items = database.data.leaves;
    // Staff only see their own; admin sees all.
    if (user.role === 'staff') items = items.filter((l) => l.staffId === user.staffId);
    if (status) items = items.filter((l) => l.status === status);
    if (type) items = items.filter((l) => l.type === type);
    if (staffId) items = items.filter((l) => l.staffId === staffId);

    return ok([...items].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)));
  }),

  http.post('/api/leaves', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'staff') return badRequest('Only staff can apply for leave.');

    const body = (await request.json()) as Partial<LeaveRequest>;
    const fieldErrors: Record<string, string> = {};
    if (!body.type) fieldErrors.type = 'Leave type is required.';
    if (!body.startDate) fieldErrors.startDate = 'Start date is required.';
    if (!body.endDate) fieldErrors.endDate = 'End date is required.';
    if (body.startDate && body.endDate && body.endDate < body.startDate) {
      fieldErrors.endDate = 'End date cannot be before start date.';
    }
    if (!body.reason?.trim() || body.reason.trim().length < 10) {
      fieldErrors.reason = 'Please provide a reason of at least 10 characters.';
    }
    if (Object.keys(fieldErrors).length) {
      return badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    // Prevent overlapping active leave requests for the same staff member.
    const overlap = database.data.leaves.some(
      (l) =>
        l.staffId === user.staffId &&
        ['pending', 'approved'].includes(l.status) &&
        rangesOverlap(l.startDate, l.endDate, body.startDate!, body.endDate!),
    );
    if (overlap) {
      return badRequest('You already have a leave request overlapping these dates.', {
        startDate: 'Overlapping leave request exists.',
      });
    }

    const staff = database.data.staff.find((s) => s.id === user.staffId);
    const leave = database.update((db) => {
      const record: LeaveRequest = {
        id: uid('lv'),
        staffId: user.staffId!,
        staffName: user.name,
        department: staff?.department ?? user.department ?? 'General',
        type: body.type!,
        startDate: body.startDate!,
        endDate: body.endDate!,
        reason: body.reason!.trim(),
        status: body.status === 'draft' ? 'draft' : 'pending',
        appliedAt: todayIso(),
        attachments: body.attachments ?? [],
      };
      db.leaves.unshift(record);
      return record;
    });
    return created(leave);
  }),

  http.patch('/api/leaves/:id', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = (await request.json()) as { status: LeaveRequest['status']; reviewComment?: string };

    // Rejection requires a reason.
    if (body.status === 'rejected' && !body.reviewComment?.trim()) {
      return badRequest('A reason is required to reject a leave request.', {
        reviewComment: 'Rejection reason is required.',
      });
    }

    const updated = database.update((db) => {
      const leave = db.leaves.find((l) => l.id === params.id);
      if (!leave) return null;

      // Staff can only cancel/submit their own requests; admin can approve/reject.
      if (user.role === 'staff' && leave.staffId !== user.staffId) return 'forbidden';

      leave.status = body.status;
      if (body.status === 'approved' || body.status === 'rejected') {
        leave.reviewedBy = user.name;
        leave.reviewComment = body.reviewComment;
        // Deduct leave balance on approval.
        if (body.status === 'approved') {
          const staff = db.staff.find((s) => s.id === leave.staffId);
          if (staff) staff.leaveBalance = Math.max(0, staff.leaveBalance - 1);
        }
      }
      return leave;
    });

    if (updated === 'forbidden') return badRequest('You cannot modify this request.');
    return updated ? ok(updated) : notFound('Leave request not found.');
  }),
];
