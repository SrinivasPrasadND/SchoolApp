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
import type { FeeStructure, Payment, StudentFee } from '@/types';

function recomputeStatus(fee: StudentFee): StudentFee['status'] {
  if (fee.amountPaid >= fee.amount) return 'paid';
  if (fee.amountPaid > 0) return 'partial';
  return fee.dueDate < todayIso() ? 'overdue' : 'unpaid';
}

export const feeHandlers = [
  // --- Fee structures --------------------------------------------------------
  http.get('/api/fee-structures', async ({ request }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    return ok(database.data.feeStructures);
  }),

  http.get('/api/fee-structures/:id', async ({ request, params }) => {
    await networkDelay();
    if (!getAuthUser(request)) return unauthorized();
    const fee = database.data.feeStructures.find((f) => f.id === params.id);
    return fee ? ok(fee) : notFound('Fee structure not found.');
  }),

  http.post('/api/fee-structures', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return badRequest('Only administrators can create fees.');

    const body = (await request.json()) as Partial<FeeStructure>;
    const fieldErrors: Record<string, string> = {};
    if (!body.name?.trim()) fieldErrors.name = 'Fee name is required.';
    if (!body.amount || body.amount <= 0) fieldErrors.amount = 'Amount must be greater than zero.';
    if (!body.dueDate) fieldErrors.dueDate = 'Due date is required.';
    if (Object.keys(fieldErrors).length) {
      return badRequest('Please fix the highlighted fields.', fieldErrors);
    }

    // Prevent duplicate fee structures (same name + year + class).
    const duplicate = database.data.feeStructures.some(
      (f) =>
        f.name.toLowerCase() === body.name!.toLowerCase() &&
        f.academicYear === body.academicYear &&
        f.classId === body.classId &&
        f.status === 'active',
    );
    if (duplicate) {
      return badRequest('A fee structure with this name already exists for the selected class and year.', {
        name: 'Duplicate fee structure.',
      });
    }

    const structure = database.update((db) => {
      const fee: FeeStructure = {
        id: uid('fee'),
        name: body.name!.trim(),
        description: body.description ?? '',
        category: body.category ?? 'miscellaneous',
        amount: body.amount!,
        dueDate: body.dueDate!,
        academicYear: body.academicYear ?? '2026-2027',
        term: body.term ?? 'Term 1',
        classId: body.classId ?? 'all',
        section: body.section ?? 'all',
        lateFeePerDay: body.lateFeePerDay,
        status: 'active',
        createdAt: todayIso(),
      };
      db.feeStructures.push(fee);

      // Auto-assign to matching students as unpaid student fees.
      const applicable = db.students.filter(
        (s) =>
          (fee.classId === 'all' || fee.classId === s.classId) &&
          (fee.section === 'all' || fee.section === s.section),
      );
      applicable.forEach((s) => {
        db.studentFees.push({
          id: uid('sf'),
          studentId: s.id,
          feeStructureId: fee.id,
          amount: fee.amount,
          amountPaid: 0,
          dueDate: fee.dueDate,
          status: fee.dueDate < todayIso() ? 'overdue' : 'unpaid',
          category: fee.category,
          academicYear: fee.academicYear,
        });
      });
      return fee;
    });

    return created(structure);
  }),

  http.put('/api/fee-structures/:id', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return badRequest('Only administrators can update fees.');

    const body = (await request.json()) as Partial<FeeStructure>;
    const updated = database.update((db) => {
      const idx = db.feeStructures.findIndex((f) => f.id === params.id);
      if (idx === -1) return null;
      db.feeStructures[idx] = { ...db.feeStructures[idx], ...body, id: db.feeStructures[idx].id };
      return db.feeStructures[idx];
    });
    return updated ? ok(updated) : notFound('Fee structure not found.');
  }),

  http.delete('/api/fee-structures/:id', async ({ request, params }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return badRequest('Only administrators can archive fees.');
    const updated = database.update((db) => {
      const fee = db.feeStructures.find((f) => f.id === params.id);
      if (!fee) return null;
      fee.status = 'archived';
      return fee;
    });
    return updated ? noContent() : notFound('Fee structure not found.');
  }),

  // --- Student fees ----------------------------------------------------------
  http.get('/api/student-fees', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    let items = database.data.studentFees;
    if (user.role === 'student') {
      items = items.filter((f) => f.studentId === user.studentId);
    } else if (user.role === 'parent') {
      items = items.filter((f) => user.studentIds?.includes(f.studentId));
    }
    if (studentId) items = items.filter((f) => f.studentId === studentId);
    if (status) items = items.filter((f) => f.status === status);
    if (category) items = items.filter((f) => f.category === category);

    return ok(items);
  }),

  // --- Payments --------------------------------------------------------------
  http.get('/api/payments', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    let items = database.data.payments;
    if (user.role === 'student') items = items.filter((p) => p.studentId === user.studentId);
    else if (user.role === 'parent') items = items.filter((p) => user.studentIds?.includes(p.studentId));
    if (studentId) items = items.filter((p) => p.studentId === studentId);
    return ok([...items].sort((a, b) => b.date.localeCompare(a.date)));
  }),

  http.post('/api/payments', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const body = (await request.json()) as Partial<Payment>;
    if (!body.studentFeeId || !body.amount || body.amount <= 0) {
      return badRequest('A valid fee and payment amount are required.', {
        amount: 'Amount must be greater than zero.',
      });
    }

    const result = database.update((db) => {
      const fee = db.studentFees.find((f) => f.id === body.studentFeeId);
      if (!fee) return null;
      const remaining = fee.amount - fee.amountPaid;
      const applied = Math.min(body.amount!, remaining);
      fee.amountPaid += applied;
      fee.status = recomputeStatus(fee);

      const payment: Payment = {
        id: uid('pay'),
        studentFeeId: fee.id,
        studentId: fee.studentId,
        amount: applied,
        method: body.method ?? 'online',
        date: todayIso(),
        reference: `RCPT-${2000 + db.payments.length}`,
        recordedBy: user.id,
      };
      db.payments.push(payment);
      return { payment, fee };
    });

    return result ? created(result) : notFound('Student fee not found.');
  }),
];
