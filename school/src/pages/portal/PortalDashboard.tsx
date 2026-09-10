import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ClipboardList,
  Wallet,
  BookOpen,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import { CardsSkeleton } from '@/components/feedback/Loading';
import {
  useGetActivitiesQuery,
  useGetAnnouncementsQuery,
  useGetAttendanceQuery,
  useGetClassesQuery,
  useGetHomeworkQuery,
  useGetStudentFeesQuery,
  useGetStudentsQuery,
} from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, percentage, todayIso } from '@/utils';

export function PortalDashboard() {
  const { user } = useAuth();
  const studentId = useSelectedStudentId();
  const { data: students = [], isLoading: loadingStudents } = useGetStudentsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: attendance = [] } = useGetAttendanceQuery(studentId ? { studentId } : undefined, { skip: !studentId });
  const { data: homework = [] } = useGetHomeworkQuery(studentId ? { studentId } : undefined, { skip: !studentId });
  const { data: fees = [] } = useGetStudentFeesQuery(studentId ? { studentId } : undefined, { skip: !studentId });
  const { data: activities = [] } = useGetActivitiesQuery();
  const { data: announcements = [] } = useGetAnnouncementsQuery();

  const student = students.find((s) => s.id === studentId);
  const className = student ? classes.find((c) => c.id === student.classId)?.name ?? '' : '';

  const attendancePct = percentage(
    attendance.filter((a) => a.status === 'present' || a.status === 'late').length,
    attendance.length,
  );
  const todayStatus = attendance.find((a) => a.date === todayIso())?.status;

  const pendingHw = homework.filter((h) => studentId && !h.completedBy.includes(studentId));
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const paidFees = fees.reduce((s, f) => s + f.amountPaid, 0);
  const overdueFees = fees.filter((f) => f.status === 'overdue').reduce((s, f) => s + (f.amount - f.amountPaid), 0);

  const upcomingActivities = activities.filter((a) => a.date >= todayIso()).slice(0, 4);
  const todaysTimetableActivities = activities.filter((a) => a.date === todayIso());

  if (loadingStudents) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <CardsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}`} description="Here's what's happening today" />

      {/* Student profile summary */}
      {student && (
        <div className="card mb-4 flex items-center gap-4 p-4 sm:p-5">
          <Avatar name={student.name} color={student.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-sm text-slate-500">{className} · Section {student.section} · Roll {student.rollNumber}</p>
          </div>
          {todayStatus ? (
            <AttendanceStatusBadge status={todayStatus} />
          ) : (
            <Badge tone="neutral">Not marked today</Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${attendancePct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="success" />
        <StatCard label="Pending Homework" value={pendingHw.length} icon={<ClipboardList className="h-5 w-5" />} tone="warning" />
        <StatCard label="Fees Paid" value={formatCurrency(paidFees)} hint={`of ${formatCurrency(totalFees)}`} icon={<Wallet className="h-5 w-5" />} tone="brand" />
        <StatCard label="Overdue Fees" value={formatCurrency(overdueFees)} icon={<Wallet className="h-5 w-5" />} tone="danger" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pending homework */}
        <section className="card p-4 sm:p-5" aria-label="Pending homework">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Pending Homework</h3>
            <Link to="/portal/homework" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {pendingHw.length === 0 ? (
            <p className="text-sm text-slate-400">All caught up! No pending homework.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingHw.slice(0, 4).map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{h.title}</p>
                    <p className="text-xs text-slate-400">{h.subject}</p>
                  </div>
                  <Badge tone={h.dueDate < todayIso() ? 'danger' : 'warning'}>Due {formatDate(h.dueDate)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming activities */}
        <section className="card p-4 sm:p-5" aria-label="Upcoming activities">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming Activities</h3>
            <Link to="/portal/activities" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.description}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(a.date, { month: 'short', day: 'numeric' })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Latest announcements */}
        <section className="card p-4 sm:p-5" aria-label="Latest announcements">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Megaphone className="h-4 w-4" aria-hidden /> Announcements</h3>
            <Link to="/portal/announcements" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="text-sm font-medium text-slate-800">{a.title}</p>
                <p className="line-clamp-1 text-xs text-slate-400">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Today's schedule */}
        <section className="card p-4 sm:p-5" aria-label="Today's schedule">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><BookOpen className="h-4 w-4" aria-hidden /> Today</h3>
            <Link to="/portal/timetable" className="text-xs font-medium text-brand-600 hover:text-brand-700">Timetable</Link>
          </div>
          {todaysTimetableActivities.length === 0 ? (
            <p className="text-sm text-slate-400">No special activities today.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todaysTimetableActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  {a.startTime && <span className="text-xs text-slate-400">{a.startTime}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: '/portal/fees', label: 'Pay Fees', icon: Wallet },
          { to: '/portal/homework', label: 'Homework', icon: ClipboardList },
          { to: '/portal/notes', label: 'Notes', icon: BookOpen },
          { to: '/portal/attendance', label: 'Attendance', icon: CalendarCheck },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="card flex items-center justify-between p-4 transition hover:border-brand-300">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <q.icon className="h-5 w-5 text-brand-600" aria-hidden /> {q.label}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
