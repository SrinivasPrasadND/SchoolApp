import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSelectedChild } from '@/features/ui/uiSlice';
import { useAuth } from './useAuth';

/**
 * Resolves the "active" student for parent/student portal views.
 * Parents may have multiple linked children; the selection persists in UI state.
 */
export function useSelectedStudentId(): string | null {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const selectedChildId = useAppSelector((s) => s.ui.selectedChildId);

  const linkedIds = useMemo(() => {
    if (user?.role === 'student') return user.studentId ? [user.studentId] : [];
    return user?.studentIds ?? [];
  }, [user]);

  // Ensure a valid default selection exists.
  useEffect(() => {
    if (!linkedIds.length) return;
    if (!selectedChildId || !linkedIds.includes(selectedChildId)) {
      dispatch(setSelectedChild(linkedIds[0]));
    }
  }, [dispatch, linkedIds, selectedChildId]);

  if (user?.role === 'student') return user.studentId ?? null;
  return selectedChildId && linkedIds.includes(selectedChildId) ? selectedChildId : linkedIds[0] ?? null;
}
