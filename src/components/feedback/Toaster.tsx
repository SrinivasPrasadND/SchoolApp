import { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissToast, type Toast } from '@/features/ui/uiSlice';
import { cn } from '@/utils';

const config: Record<Toast['type'], { icon: typeof Info; class: string }> = {
  success: { icon: CheckCircle2, class: 'border-success-100 bg-success-50 text-success-700' },
  error: { icon: XCircle, class: 'border-danger-100 bg-danger-50 text-danger-700' },
  warning: { icon: AlertTriangle, class: 'border-warning-100 bg-warning-50 text-warning-700' },
  info: { icon: Info, class: 'border-brand-100 bg-brand-50 text-brand-700' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const { icon: Icon, class: cls } = config[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div
      role="status"
      className={cn(
        'flex animate-fade-in items-start gap-3 rounded-lg border px-4 py-3 shadow-card',
        cls,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded p-0.5 hover:bg-black/5"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
