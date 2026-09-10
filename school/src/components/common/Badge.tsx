import type { ReactNode } from 'react';
import { cn } from '@/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-success-50 text-success-700 ring-success-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-100',
  danger: 'bg-danger-50 text-danger-700 ring-danger-100',
  info: 'bg-brand-50 text-brand-700 ring-brand-100',
  purple: 'bg-purple-50 text-purple-700 ring-purple-100',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
