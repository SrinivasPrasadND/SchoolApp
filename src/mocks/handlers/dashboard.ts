import { http } from 'msw';
import { database } from '../db/database';
import { getAuthUser, networkDelay, ok, unauthorized } from './helpers';
import { FEE_CATEGORY_LABELS } from '@/constants';
import { percentage, todayIso } from '@/utils';
import type { DashboardMetrics } from '@/types';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

export const dashboardHandlers = [
  http.get('/api/dashboard/admin', async ({ request }) => {
    await networkDelay();
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const { studentFees, students, staff, classes, attendance, leaves, payments } = database.data;

    const expected = studentFees.reduce((sum, f) => sum + f.amount, 0);
    const collected = studentFees.reduce((sum, f) => sum + f.amountPaid, 0);
    const outstanding = expected - collected;
    const overdue = studentFees
      .filter((f) => f.status === 'overdue')
      .reduce((sum, f) => sum + (f.amount - f.amountPaid), 0);

    // Per-student aggregate payment status.
    const byStudent = new Map<string, { amount: number; paid: number }>();
    studentFees.forEach((f) => {
      const cur = byStudent.get(f.studentId) ?? { amount: 0, paid: 0 };
      cur.amount += f.amount;
      cur.paid += f.amountPaid;
      byStudent.set(f.studentId, cur);
    });
    let fullyPaid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;
    byStudent.forEach(({ amount, paid }) => {
      if (paid >= amount && amount > 0) fullyPaid++;
      else if (paid > 0) partiallyPaid++;
      else unpaid++;
    });

    const today = todayIso();
    const todaysAttendance = attendance.filter((a) => a.date === today);
    const presentToday = todaysAttendance.filter(
      (a) => a.status === 'present' || a.status === 'late',
    ).length;
    const attendancePct = percentage(presentToday, todaysAttendance.length || students.length);

    const collectionByClass = classes.map((c) => {
      const classStudentIds = new Set(students.filter((s) => s.classId === c.id).map((s) => s.id));
      const fees = studentFees.filter((f) => classStudentIds.has(f.studentId));
      return {
        className: c.name,
        collected: fees.reduce((s, f) => s + f.amountPaid, 0),
        outstanding: fees.reduce((s, f) => s + (f.amount - f.amountPaid), 0),
      };
    });

    const categoryTotals = new Map<string, number>();
    studentFees.forEach((f) => {
      categoryTotals.set(f.category, (categoryTotals.get(f.category) ?? 0) + f.amountPaid);
    });
    const collectionByCategory = Array.from(categoryTotals.entries()).map(([category, amount]) => ({
      category: FEE_CATEGORY_LABELS[category as keyof typeof FEE_CATEGORY_LABELS] ?? category,
      amount,
    }));

    // Deterministic pseudo-monthly trend derived from totals.
    const monthlyCollection = MONTHS.map((month, i) => {
      const base = collected / MONTHS.length;
      const wobble = 0.7 + ((i * 7) % 6) / 10;
      return {
        month,
        collected: Math.round(base * wobble),
        expected: Math.round((expected / MONTHS.length) * 1.05),
      };
    });

    const metrics: DashboardMetrics = {
      totalStudents: students.length,
      totalStaff: staff.length,
      totalClasses: classes.length,
      studentAttendanceToday: attendancePct,
      staffOnLeaveToday: leaves.filter(
        (l) => l.status === 'approved' && l.startDate <= today && l.endDate >= today,
      ).length,
      pendingApprovals: leaves.filter((l) => l.status === 'pending').length,
      fees: {
        expected,
        collected,
        outstanding,
        overdue,
        collectionPercentage: percentage(collected, expected),
        fullyPaidStudents: fullyPaid,
        partiallyPaidStudents: partiallyPaid,
        unpaidStudents: unpaid,
      },
      monthlyCollection,
      collectionByClass,
      collectionByCategory,
      paidVsPending: [
        { name: 'Collected', value: collected },
        { name: 'Pending', value: Math.max(0, outstanding) },
      ],
      upcomingDueDates: database.data.feeStructures
        .filter((f) => f.status === 'active' && f.dueDate >= today)
        .slice(0, 5)
        .map((f) => ({ name: f.name, dueDate: f.dueDate, amount: f.amount })),
      recentPayments: [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    };

    return ok(metrics);
  }),
];
