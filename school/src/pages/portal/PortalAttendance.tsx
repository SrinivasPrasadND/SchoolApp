import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import { useGetAttendanceQuery } from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { formatDate, percentage } from '@/utils';
import type { AttendanceRecord } from '@/types';

export function PortalAttendance() {
  const studentId = useSelectedStudentId();
  const { data: attendance = [], isLoading } = useGetAttendanceQuery(
    studentId ? { studentId } : undefined,
    { skip: !studentId },
  );

  const sorted = useMemo(
    () => [...attendance].sort((a, b) => b.date.localeCompare(a.date)),
    [attendance],
  );

  const counts = useMemo(() => {
    return {
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      leave: attendance.filter((a) => a.status === 'leave').length,
    };
  }, [attendance]);

  const pct = percentage(counts.present + counts.late, attendance.length);

  const columns: Column<AttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (a) => formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' }) },
    { key: 'status', header: 'Status', render: (a) => <AttendanceStatusBadge status={a.status} /> },
    { key: 'remarks', header: 'Remarks', render: (a) => a.remarks || <span className="text-slate-300">—</span> },
  ];

  return (
    <div>
      <PageHeader title="Attendance History" description="Daily attendance record" />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Overall" value={`${pct}%`} tone="success" />
        <StatCard label="Present" value={counts.present} tone="success" />
        <StatCard label="Absent" value={counts.absent} tone="danger" />
        <StatCard label="Late" value={counts.late} tone="warning" />
        <StatCard label="On Leave" value={counts.leave} tone="brand" />
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        rowKey={(a) => a.id}
        loading={isLoading}
        emptyMessage="No attendance records yet."
        mobileCard={(a) => (
          <div className="card flex items-center justify-between p-4">
            <span className="text-sm font-medium text-slate-800">{formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <AttendanceStatusBadge status={a.status} />
          </div>
        )}
      />
    </div>
  );
}
