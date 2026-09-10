import { PageHeader } from '@/components/common/PageHeader';
import { TimetableView } from '@/features/timetable/TimetableView';
import { useAuth } from '@/hooks/useAuth';

export function StaffTimetable() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="My Timetable" description="Your weekly teaching schedule" />
      {user?.staffId ? <TimetableView staffId={user.staffId} /> : <p className="text-sm text-slate-400">No timetable available.</p>}
    </div>
  );
}
