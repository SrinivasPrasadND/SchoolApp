import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  CalendarCheck,
  Wallet,
  ClipboardList,
  Mail,
  Phone,
  User as UserIcon,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/common/DataTable';
import { PaymentStatusBadge, AttendanceStatusBadge } from '@/components/common/StatusBadge';
import { PageSpinner } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/States';
import { TimetableView } from '@/features/timetable/TimetableView';
import {
  useGetAttendanceQuery,
  useGetClassesQuery,
  useGetHomeworkQuery,
  useGetNotesQuery,
  useGetParentQuery,
  useGetPaymentsQuery,
  useGetStudentFeesQuery,
  useGetStudentQuery,
} from '@/services/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { FEE_CATEGORY_LABELS } from '@/constants';
import { formatCurrency, formatDate, percentage, todayIso } from '@/utils';
import type { AttendanceStatus, StudentFee } from '@/types';

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const listPath = role === 'staff' ? '/staff/students' : '/admin/students';

  const { data: student, isLoading, isError, refetch } = useGetStudentQuery(studentId!, {
    skip: !studentId,
  });
  const { data: classes = [] } = useGetClassesQuery();
  const { data: parent } = useGetParentQuery(student?.parentId ?? '', { skip: !student?.parentId });
  const { data: attendance = [] } = useGetAttendanceQuery(
    studentId ? { studentId } : undefined,
    { skip: !studentId },
  );
  const { data: fees = [] } = useGetStudentFeesQuery(studentId ? { studentId } : undefined, {
    skip: !studentId,
  });
  const { data: payments = [] } = useGetPaymentsQuery(studentId ? { studentId } : undefined, {
    skip: !studentId,
  });
  const { data: homework = [] } = useGetHomeworkQuery();
  const { data: notes = [] } = useGetNotesQuery();

  const cls = classes.find((c) => c.id === student?.classId);

  const attendanceCounts = useMemo(() => {
    const base: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    attendance.forEach((a) => (base[a.status] += 1));
    return base;
  }, [attendance]);
  const attendancePct = percentage(
    attendanceCounts.present + attendanceCounts.late,
    attendance.length,
  );

  const feeTotals = useMemo(() => {
    const total = fees.reduce((s, f) => s + f.amount, 0);
    const paid = fees.reduce((s, f) => s + f.amountPaid, 0);
    return { total, paid, outstanding: total - paid };
  }, [fees]);

  const studentHomework = useMemo(
    () =>
      homework.filter(
        (h) => h.classId === student?.classId && h.section === student?.section,
      ),
    [homework, student],
  );
  const pendingHomework = studentHomework.filter(
    (h) => !studentId || !h.completedBy.includes(studentId),
  ).length;

  const studentNotes = useMemo(
    () => notes.filter((n) => n.classId === student?.classId && n.section === student?.section),
    [notes, student],
  );

  const recentAttendance = useMemo(
    () => [...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [attendance],
  );

  if (isLoading) return <PageSpinner />;
  if (isError || !student) {
    return (
      <div>
        <BackBar onBack={() => navigate(listPath)} />
        <ErrorState title="Student not found" onRetry={refetch} />
      </div>
    );
  }

  const feeColumns: Column<StudentFee>[] = [
    { key: 'category', header: 'Category', render: (f) => FEE_CATEGORY_LABELS[f.category] },
    { key: 'amount', header: 'Amount', align: 'right', render: (f) => formatCurrency(f.amount) },
    { key: 'paid', header: 'Paid', align: 'right', render: (f) => formatCurrency(f.amountPaid) },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (f) => formatCurrency(f.amount - f.amountPaid),
    },
    { key: 'due', header: 'Due', render: (f) => formatDate(f.dueDate) },
    { key: 'status', header: 'Status', render: (f) => <PaymentStatusBadge status={f.status} /> },
  ];

  return (
    <div>
      <BackBar onBack={() => navigate(listPath)} onClose={() => navigate(listPath)} />

      <PageHeader
        title={student.name}
        description={`${cls?.name ?? ''} · Section ${student.section} · Roll ${student.rollNumber}`}
      />

      {/* Profile + parent/guardian */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-label="Student profile">
          <div className="mb-4 flex items-center gap-4">
            <Avatar name={student.name} color={student.avatarColor} size="lg" />
            <div>
              <p className="font-semibold text-slate-900">{student.name}</p>
              <p className="text-sm text-slate-500">{cls?.name} · Section {student.section}</p>
              <Badge tone="info">Roll {student.rollNumber}</Badge>
            </div>
          </div>
          <dl className="divide-y divide-slate-100">
            <DetailRow label="Gender" value={<span className="capitalize">{student.gender}</span>} />
            <DetailRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <DetailRow label="Admission Date" value={formatDate(student.admissionDate)} />
            <DetailRow label="Class Teacher" value={cls?.classTeacherId ? 'Assigned' : '—'} />
          </dl>
        </section>

        <section className="card p-5" aria-label="Parent and guardian details">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserIcon className="h-4 w-4" aria-hidden /> Parent &amp; Guardian
          </h2>
          <dl className="divide-y divide-slate-100">
            <DetailRow label="Guardian Name" value={student.guardianName} />
            <DetailRow
              label="Contact"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden /> {student.contactPhone}
                </span>
              }
            />
            <DetailRow label="Parent Account" value={parent?.name ?? '—'} />
            <DetailRow
              label="Parent Email"
              value={
                parent?.email ? (
                  <a
                    href={`mailto:${parent.email}`}
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden /> {parent.email}
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </dl>
        </section>
      </div>

      {/* Academic summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${attendancePct}%`}
          hint={`${attendance.length} days recorded`}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Fees Paid"
          value={formatCurrency(feeTotals.paid)}
          hint={`of ${formatCurrency(feeTotals.total)}`}
          icon={<Wallet className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(feeTotals.outstanding)}
          icon={<Wallet className="h-5 w-5" />}
          tone={feeTotals.outstanding > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Pending Homework"
          value={pendingHomework}
          icon={<ClipboardList className="h-5 w-5" />}
          tone={pendingHomework > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Fees */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Fee Details</h2>
      <DataTable
        columns={feeColumns}
        rows={fees}
        rowKey={(f) => f.id}
        emptyMessage="No fees assigned to this student."
        mobileCard={(f) => (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{FEE_CATEGORY_LABELS[f.category]}</p>
              <PaymentStatusBadge status={f.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {formatCurrency(f.amountPaid)} / {formatCurrency(f.amount)} · Due {formatDate(f.dueDate)}
            </p>
          </div>
        )}
      />

      {/* Attendance + payment history */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5" aria-label="Recent attendance">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent Attendance</h2>
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentAttendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-700">
                    {formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <AttendanceStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-5" aria-label="Payment history">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.reference}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.date)} · {p.method}</p>
                  </div>
                  <span className="text-sm font-semibold text-success-600">
                    {formatCurrency(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Homework */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Homework</h2>
      {studentHomework.length === 0 ? (
        <p className="text-sm text-slate-400">No homework for this class.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {studentHomework.map((h) => {
            const done = studentId ? h.completedBy.includes(studentId) : false;
            const overdue = !done && h.dueDate < todayIso();
            return (
              <li key={h.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <Badge tone="info">{h.subject}</Badge>
                  {done ? (
                    <Badge tone="success">Completed</Badge>
                  ) : overdue ? (
                    <Badge tone="danger">Overdue</Badge>
                  ) : (
                    <Badge tone="warning">Pending</Badge>
                  )}
                  <span className="ml-auto text-xs text-slate-400">Due {formatDate(h.dueDate)}</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{h.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{h.instructions}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Notes */}
      <h2 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <BookOpen className="h-4 w-4" aria-hidden /> Notes &amp; Classwork
      </h2>
      {studentNotes.length === 0 ? (
        <p className="text-sm text-slate-400">No notes available for this class.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {studentNotes.map((n) => (
            <li key={n.id} className="card p-4">
              <div className="flex items-center gap-2">
                <Badge tone="info">{n.subject}</Badge>
                <Badge tone={n.status === 'published' ? 'success' : 'neutral'}>{n.status}</Badge>
                <span className="ml-auto text-xs text-slate-400">{formatDate(n.date)}</span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{n.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.description}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Timetable */}
      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Class Timetable</h2>
      <TimetableView classId={student.classId} />
    </div>
  );
}

function BackBar({ onBack, onClose }: { onBack: () => void; onClose?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to students
      </button>
      {onClose && (
        <Button variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" aria-hidden /> Close
        </Button>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
