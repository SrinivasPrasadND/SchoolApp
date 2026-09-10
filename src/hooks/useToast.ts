import { useCallback } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { addToast, type Toast } from '@/features/ui/uiSlice';

/** Convenience hook to dispatch toast notifications from anywhere. */
export function useToast() {
  const dispatch = useAppDispatch();
  return useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      dispatch(addToast({ message, type }));
    },
    [dispatch],
  );
}
