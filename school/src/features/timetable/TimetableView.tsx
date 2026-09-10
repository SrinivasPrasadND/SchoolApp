import { useMemo } from 'react';
import { TableSkeleton } from '@/components/feedback/Loading';
import { EmptyState } from '@/components/feedback/States';
import { useGetStaffQuery, useGetTimetableQuery } from '@/services/api/endpoints';
import type { TimetableEntry } from '@/types';

const DAYS: { key: TimetableEntry['day']; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
];

interface TimetableViewProps {
  classId?: string;
  staffId?: string;
}

export function TimetableView({ classId, staffId }: TimetableViewProps) {
  const { data: entries = [], isLoading } = useGetTimetableQuery(
    classId ? { classId } : staffId ? { staffId } : undefined,
  );
  const { data: staff = [] } = useGetStaffQuery();

  const periods = useMemo(() => {
    const set = new Map<number, { start: string; end: string }>();
    entries.forEach((e) => set.set(e.period, { start: e.startTime, end: e.endTime }));
    return Array.from(set.entries()).sort(([a], [b]) => a - b);
  }, [entries]);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? '';

  const cell = (day: TimetableEntry['day'], period: number) =>
    entries.find((e) => e.day === day && e.period === period);

  if (isLoading) return <div className="card p-4"><TableSkeleton rows={5} cols={5} /></div>;
  if (entries.length === 0) return <EmptyState title="No timetable" message="No scheduled periods found." />;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th scope="col" className="px-3 py-3 text-left font-semibold text-slate-600">Period</th>
              {DAYS.map((d) => (
                <th key={d.key} scope="col" className="px-3 py-3 text-left font-semibold text-slate-600">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map(([period, time]) => (
              <tr key={period}>
                <td className="whitespace-nowrap px-3 py-3">
                  <p className="font-medium text-slate-700">P{period}</p>
                  <p className="text-xs text-slate-400">{time.start}</p>
                </td>
                {DAYS.map((d) => {
                  const entry = cell(d.key, period);
                  return (
                    <td key={d.key} className="px-3 py-3">
                      {entry ? (
                        <div className="rounded-lg bg-brand-50 px-2 py-1.5">
                          <p className="font-medium text-brand-800">{entry.subject}</p>
                          <p className="text-xs text-brand-600">{staffName(entry.staffId)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
