import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  trend?: { value: number; positive: boolean };
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneRing: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
};

export function StatCard({ label, value, icon, hint, trend, tone = 'brand', className }: StatCardProps) {
  return (
    <div className={cn('card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn('flex h-10 w-10 items-center justify-center rounded-lg', toneRing[tone])}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      {trend && (
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-xs font-medium',
            trend.positive ? 'text-success-600' : 'text-danger-600',
          )}
        >
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          )}
          {trend.value}% vs last term
        </p>
      )}
    </div>
  );
}
