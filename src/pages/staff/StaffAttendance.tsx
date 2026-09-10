import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/States';
import { CardsSkeleton } from '@/components/feedback/Loading';
import { useGetClassesQuery, useGetStaffQuery } from '@/services/api/endpoints';
import { useAuth } from '@/hooks/useAuth';

export function StaffAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: classes = [], isLoading } = useGetClassesQuery();
  const { data: staffList = [] } = useGetStaffQuery();

  const staff = staffList.find((s) => s.id === user?.staffId);
  const assigned = classes.filter((c) => staff?.assignedClassIds.includes(c.id));

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <CardsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Attendance" description="Select a class and section to mark attendance" />

      {assigned.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title="No assigned classes" message="You have no classes assigned for attendance." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assigned.flatMap((c) =>
            c.sections.map((section) => (
              <button
                key={`${c.id}-${section}`}
                onClick={() => navigate(`/staff/attendance/${c.id}?section=${section}`)}
                className="card flex items-center justify-between p-4 text-left transition hover:border-brand-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <CalendarCheck className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">Section {section}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden />
              </button>
            )),
          )}
        </div>
      )}
    </div>
  );
}
