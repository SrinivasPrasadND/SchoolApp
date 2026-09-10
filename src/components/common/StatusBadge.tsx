import { Badge } from './Badge';
import {
  ATTENDANCE_STATUS_LABELS,
  LEAVE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/constants';
import type { AttendanceStatus, LeaveStatus, PaymentStatus } from '@/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const paymentTone: Record<PaymentStatus, Tone> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'neutral',
  overdue: 'danger',
  waived: 'info',
};

const attendanceTone: Record<AttendanceStatus, Tone> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  leave: 'info',
};

const leaveTone: Record<LeaveStatus, Tone> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

// A leading dot + text ensures status is not conveyed by color alone.
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={paymentTone[status]}>
      <span aria-hidden>●</span> {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge tone={attendanceTone[status]}>
      <span aria-hidden>●</span> {ATTENDANCE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge tone={leaveTone[status]}>
      <span aria-hidden>●</span> {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}
