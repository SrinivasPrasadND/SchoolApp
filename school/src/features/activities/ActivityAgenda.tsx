import { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  PartyPopper,
  Trophy,
  Users,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { useGetActivitiesQuery } from '@/services/api/endpoints';
import { ACTIVITY_TYPE_LABELS } from '@/constants';
import { formatDate } from '@/utils';
import type { Activity, ActivityType } from '@/types';

const icons: Record<ActivityType, LucideIcon> = {
  class: BookOpen,
  event: CalendarDays,
  test: ClipboardList,
  assignment: ClipboardList,
  sports: Trophy,
  club: Users,
  holiday: PartyPopper,
  special: Sparkles,
};

const tone: Record<ActivityType, 'info' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral'> = {
  class: 'info',
  event: 'purple',
  test: 'danger',
  assignment: 'warning',
  sports: 'success',
  club: 'info',
  holiday: 'neutral',
  special: 'purple',
};

/** Reusable agenda / calendar list of school activities. */
export function ActivityAgenda() {
  const { data: activities = [], isLoading } = useGetActivitiesQuery();
  const [type, setType] = useState<'all' | ActivityType>('all');

  const grouped = useMemo(() => {
    const filtered = activities.filter((a) => type === 'all' || a.type === type);
    const map = new Map<string, Activity[]>();
    filtered.forEach((a) => {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activities, type]);

  if (isLoading) {
    return <div className="card p-4"><TableSkeleton rows={5} cols={1} /></div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={type === 'all'} onClick={() => setType('all')}>All</FilterChip>
        {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
          <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
            {ACTIVITY_TYPE_LABELS[t]}
          </FilterChip>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No activities" message="Nothing scheduled for this filter." />
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
              <ul className="space-y-2">
                {items.map((a) => {
                  const Icon = icons[a.type];
                  return (
                    <li key={a.id} className="card flex items-start gap-3 p-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{a.title}</p>
                          <Badge tone={tone[a.type]}>{ACTIVITY_TYPE_LABELS[a.type]}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>
                        {a.startTime && (
                          <p className="mt-1 text-xs text-slate-400">
                            {a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white'
          : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50'
      }
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
