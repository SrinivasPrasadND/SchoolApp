import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { LeaveStatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { TextField, TextAreaField, SelectField } from '@/components/forms/Fields';
import {
  useApplyLeaveMutation,
  useGetLeavesQuery,
  useGetStaffQuery,
  useUpdateLeaveStatusMutation,
} from '@/services/api/endpoints';
import { leaveSchema, type LeaveFormValues } from '@/schemas';
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { daysBetween, formatDate, todayIso } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';

export function StaffLeaves() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: leaves = [], isLoading } = useGetLeavesQuery();
  const { data: staffList = [] } = useGetStaffQuery();
  const [applyLeave, { isLoading: applying }] = useApplyLeaveMutation();
  const [updateStatus] = useUpdateLeaveStatusMutation();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');

  const staff = staffList.find((s) => s.id === user?.staffId);

  const filtered = useMemo(
    () =>
      leaves.filter(
        (l) => (status === 'all' || l.status === status) && (type === 'all' || l.type === type),
      ),
    [leaves, status, type],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: 'casual', startDate: todayIso(), endDate: todayIso(), reason: '' },
  });

  const onSubmit = async (values: LeaveFormValues) => {
    try {
      await applyLeave(values).unwrap();
      toast('Leave request submitted.', 'success');
      reset();
      setOpen(false);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      toast(message, 'error');
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([f, m]) => setError(f as keyof LeaveFormValues, { message: m }));
      }
    }
  };

  const cancel = async (id: string) => {
    try {
      await updateStatus({ id, status: 'cancelled' }).unwrap();
      toast('Leave request cancelled.', 'info');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Apply for and track your leave requests"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Apply for Leave
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Leave Balance" value={`${staff?.leaveBalance ?? 0} days`} tone="success" />
        <StatCard label="Pending" value={leaves.filter((l) => l.status === 'pending').length} tone="warning" />
        <StatCard label="Approved" value={leaves.filter((l) => l.status === 'approved').length} tone="brand" />
        <StatCard label="Total" value={leaves.length} tone="brand" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All Statuses</option>
          {Object.entries(LEAVE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          <option value="all">All Types</option>
          {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No leave requests" message="Apply for leave to see it here." action={{ label: 'Apply for Leave', onClick: () => setOpen(true) }} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((l) => (
            <li key={l.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{LEAVE_TYPE_LABELS[l.type]}</Badge>
                <LeaveStatusBadge status={l.status} />
                <span className="ml-auto text-xs text-slate-400">Applied {formatDate(l.appliedAt)}</span>
              </div>
              <p className="mt-2 font-medium text-slate-900">
                {formatDate(l.startDate)} – {formatDate(l.endDate)} · {daysBetween(l.startDate, l.endDate)} day(s)
              </p>
              <p className="mt-1 text-sm text-slate-600">{l.reason}</p>
              {l.reviewComment && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <strong>{l.reviewedBy}:</strong> {l.reviewComment}
                </p>
              )}
              {l.status === 'pending' && (
                <div className="mt-3">
                  <Button variant="ghost" className="text-danger-600" onClick={() => cancel(l.id)}>
                    <XCircle className="h-4 w-4" aria-hidden /> Cancel Request
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="leave-form" loading={applying}>Submit Request</Button>
          </>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <SelectField
            label="Leave Type"
            required
            error={errors.type?.message}
            options={Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            {...register('type')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Start Date" type="date" required error={errors.startDate?.message} {...register('startDate')} />
            <TextField label="End Date" type="date" required error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <TextAreaField label="Reason" required error={errors.reason?.message} placeholder="Provide a reason for your leave (min 10 characters)…" {...register('reason')} />
        </form>
      </Modal>
    </div>
  );
}
