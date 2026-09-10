import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSelectedChild } from '@/features/ui/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import { useGetStudentsQuery } from '@/services/api/endpoints';
import { Users } from 'lucide-react';

/** Lets a parent with multiple linked children switch the active student. */
export function ChildSelector() {
  const dispatch = useAppDispatch();
  const { user, isParent } = useAuth();
  const selectedChildId = useAppSelector((s) => s.ui.selectedChildId);
  const { data: students = [] } = useGetStudentsQuery(undefined, { skip: !isParent });

  if (!isParent || (user?.studentIds?.length ?? 0) < 2) return null;

  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
      <Users className="h-4 w-4 text-slate-400" aria-hidden />
      <span className="sr-only">Select child</span>
      <select
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
        value={selectedChildId ?? ''}
        onChange={(e) => dispatch(setSelectedChild(e.target.value))}
        aria-label="Select child"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
