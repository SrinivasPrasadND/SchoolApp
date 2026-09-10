import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Accessible text/table alternative for screen readers. */
  summary?: string;
  actions?: ReactNode;
  className?: string;
  height?: number;
}

export function ChartCard({
  title,
  description,
  children,
  summary,
  actions,
  className,
  height = 280,
}: ChartCardProps) {
  return (
    <section className={cn('card p-4 sm:p-5', className)} aria-label={title}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div style={{ height }} aria-hidden={!!summary}>
        {children}
      </div>
      {summary && <p className="sr-only">{summary}</p>}
    </section>
  );
}
