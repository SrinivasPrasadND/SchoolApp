import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { useGetStaffQuery } from '@/services/api/endpoints';
import { formatDate } from '@/utils';
import type { Staff } from '@/types';

export function AdminStaff() {
  const { data: staff = [], isLoading } = useGetStaffQuery();

  const columns: Column<Staff>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} color={s.avatarColor} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-400">{s.designation}</p>
          </div>
        </div>
      ),
    },
    { key: 'dept', header: 'Department', render: (s) => s.department },
    { key: 'subjects', header: 'Subjects', render: (s) => s.subjects.join(', ') },
    { key: 'contact', header: 'Contact', render: (s) => s.contactPhone },
    { key: 'joined', header: 'Joined', render: (s) => formatDate(s.joiningDate) },
    { key: 'leave', header: 'Leave Balance', align: 'right', render: (s) => <Badge tone="info">{s.leaveBalance} days</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Staff Directory" description={`${staff.length} staff members`} />
      <DataTable
        columns={columns}
        rows={staff}
        rowKey={(s) => s.id}
        loading={isLoading}
        emptyMessage="No staff members found."
        mobileCard={(s) => (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={s.name} color={s.avatarColor} />
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400">{s.designation} · {s.department}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">{s.subjects.join(', ')}</span>
              <Badge tone="info">{s.leaveBalance} days</Badge>
            </div>
          </div>
        )}
      />
    </div>
  );
}
