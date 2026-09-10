import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/feedback/Loading';
import { useGetClassesQuery, useGetStaffQuery } from '@/services/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils';

export function StaffProfile() {
  const { user } = useAuth();
  const { data: staffList = [], isLoading } = useGetStaffQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const staff = staffList.find((s) => s.id === user?.staffId);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" description="Your staff details" />

      <div className="card mb-4 flex items-center gap-4 p-5">
        <Avatar name={staff?.name ?? user?.name ?? 'User'} color={staff?.avatarColor ?? user?.avatarColor} size="lg" />
        <div>
          <p className="font-semibold text-slate-900">{staff?.name ?? user?.name}</p>
          <p className="text-sm text-slate-500">{staff?.designation} · {staff?.department}</p>
          <p className="text-xs text-slate-400">{staff?.email ?? user?.email}</p>
        </div>
      </div>

      {staff && (
        <div className="card space-y-3 p-5">
          <Row label="Subjects" value={<div className="flex flex-wrap gap-1">{staff.subjects.map((s) => <Badge key={s} tone="info">{s}</Badge>)}</div>} />
          <Row
            label="Assigned Classes"
            value={
              <div className="flex flex-wrap gap-1">
                {staff.assignedClassIds.map((id) => (
                  <Badge key={id} tone="neutral">{classes.find((c) => c.id === id)?.name ?? id}</Badge>
                ))}
              </div>
            }
          />
          <Row label="Contact" value={staff.contactPhone} />
          <Row label="Joined" value={formatDate(staff.joiningDate)} />
          <Row label="Leave Balance" value={<Badge tone="success">{staff.leaveBalance} days</Badge>} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
