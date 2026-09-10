import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, BookOpen, Plane, ArrowRight, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { LeaveStatusBadge } from '@/components/common/StatusBadge';
import { CardsSkeleton } from '@/components/feedback/Loading';
import {
  useGetAnnouncementsQuery,
  useGetClassesQuery,
  useGetLeavesQuery,
  useGetStaffQuery,
  useGetTimetableQuery,
} from '@/services/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function StaffDashboard() {
  const { user } = useAuth();
  const { data: staffList = [], isLoading } = useGetStaffQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: leaves = [] } = useGetLeavesQuery();
  const { data: timetable = [] } = useGetTimetableQuery(user?.staffId ? { staffId: user.staffId } : undefined, { skip: !user?.staffId });
  const { data: announcements = [] } = useGetAnnouncementsQuery();

  const staff = staffList.find((s) => s.id === user?.staffId);
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaysClasses = timetable.filter((t) => t.day === todayKey).sort((a, b) => a.period - b.period);
  const myLeaves = leaves.slice(0, 3);
  const assignedClasses = classes.filter((c) => staff?.assignedClassIds.includes(c.id));

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <CardsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Hello, ${user?.name?.split(' ')[0] ?? 'there'}`} description="Your teaching overview for today" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Classes" value={todaysClasses.length} icon={<CalendarCheck className="h-5 w-5" />} tone="brand" />
        <StatCard label="Assigned Classes" value={assignedClasses.length} icon={<Users className="h-5 w-5" />} tone="success" />
        <StatCard label="Subjects" value={staff?.subjects.length ?? 0} icon={<BookOpen className="h-5 w-5" />} tone="brand" />
        <StatCard label="Leave Balance" value={`${staff?.leaveBalance ?? 0} days`} icon={<Plane className="h-5 w-5" />} tone="warning" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5" aria-label="Today's classes">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Today's Classes</h3>
            <Link to="/staff/timetable" className="text-xs font-medium text-brand-600 hover:text-brand-700">Timetable</Link>
          </div>
          {todaysClasses.length === 0 ? (
            <p className="text-sm text-slate-400">No classes scheduled today.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todaysClasses.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.subject}</p>
                    <p className="text-xs text-slate-400">
                      {classes.find((c) => c.id === t.classId)?.name} · {t.section}
                    </p>
                  </div>
                  <Badge tone="info">P{t.period} · {t.startTime}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-5" aria-label="Leave status">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Leave Requests</h3>
            <Link to="/staff/leaves" className="text-xs font-medium text-brand-600 hover:text-brand-700">Manage</Link>
          </div>
          {myLeaves.length === 0 ? (
            <p className="text-sm text-slate-400">No leave requests.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myLeaves.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatDate(l.startDate)} – {formatDate(l.endDate)}</p>
                    <p className="text-xs text-slate-400">{l.reason}</p>
                  </div>
                  <LeaveStatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-5 lg:col-span-2" aria-label="Announcements">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Announcements</h3>
          <ul className="divide-y divide-slate-100">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="text-sm font-medium text-slate-800">{a.title}</p>
                <p className="line-clamp-1 text-xs text-slate-400">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: '/staff/attendance', label: 'Attendance', icon: CalendarCheck },
          { to: '/staff/notes', label: 'Notes', icon: BookOpen },
          { to: '/staff/homework', label: 'Homework', icon: ClipboardList },
          { to: '/staff/leaves', label: 'Apply Leave', icon: Plane },
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
