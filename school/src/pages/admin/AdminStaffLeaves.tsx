import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { LeaveStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextAreaField } from '@/components/forms/Fields';
import { useGetLeavesQuery, useGetStaffQuery, useUpdateLeaveStatusMutation } from '@/services/api/endpoints';
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/constants';
import { formatDate, daysBetween } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { LeaveRequest } from '@/types';

export function AdminStaffLeaves() {
  const toast = useToast();
  const { data: leaves = [], isLoading } = useGetLeavesQuery();
  const { data: staff = [] } = useGetStaffQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateLeaveStatusMutation();

  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      leaves.filter(
        (l) => (status === 'all' || l.status === status) && (type === 'all' || l.type === type),
      ),
    [leaves, status, type],
  );

  const pending = leaves.filter((l) => l.status === 'pending').length;
  const approved = leaves.filter((l) => l.status === 'approved').length;

  const approve = async (l: LeaveRequest) => {
    try {
      await updateStatus({ id: l.id, status: 'approved' }).unwrap();
      toast(`Approved leave for ${l.staffName}.`, 'success');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (reason.trim().length < 5) {
      setReasonError('Please provide a reason (at least 5 characters).');
      return;
    }
    try {
      await updateStatus({ id: rejectTarget.id, status: 'rejected', reviewComment: reason }).unwrap();
      toast(`Rejected leave for ${rejectTarget.staffName}.`, 'info');
      setRejectTarget(null);
      setReason('');
      setReasonError(null);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'staff',
      header: 'Employee',
      render: (l) => (
        <div>
          <p className="font-medium text-slate-900">{l.staffName}</p>
          <p className="text-xs text-slate-400">{l.department}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (l) => LEAVE_TYPE_LABELS[l.type] },
    {
      key: 'dates',
      header: 'Dates',
      render: (l) => (
        <div>
          <p>{formatDate(l.startDate)} – {formatDate(l.endDate)}</p>
          <p className="text-xs text-slate-400">{daysBetween(l.startDate, l.endDate)} day(s)</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (l) => <LeaveStatusBadge status={l.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (l) =>
        l.status === 'pending' ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" className="text-success-600" onClick={() => approve(l)} aria-label="Approve">
              <Check className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="ghost" className="text-danger-600" onClick={() => setRejectTarget(l)} aria-label="Reject">
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">{l.reviewedBy ? `by ${l.reviewedBy}` : '—'}</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Faculty Leave Management" description="Review and act on staff leave requests" />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={pending} tone="warning" />
        <StatCard label="Approved" value={approved} tone="success" />
        <StatCard label="Total Requests" value={leaves.length} tone="brand" />
        <StatCard label="Staff Members" value={staff.length} tone="brand" />
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

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(l) => l.id}
        loading={isLoading}
        emptyMessage="No leave requests match your filters."
        mobileCard={(l) => (
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{l.staffName}</p>
                <p className="text-xs text-slate-400">{LEAVE_TYPE_LABELS[l.type]} · {l.department}</p>
              </div>
              <LeaveStatusBadge status={l.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(l.startDate)} – {formatDate(l.endDate)}
            </p>
            <p className="mt-1 text-sm text-slate-500">{l.reason}</p>
            {l.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => approve(l)}>
                  <Check className="h-4 w-4" aria-hidden /> Approve
                </Button>
                <Button variant="danger" fullWidth onClick={() => setRejectTarget(l)}>
                  <X className="h-4 w-4" aria-hidden /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      />

      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setReason(''); setReasonError(null); }}
        title="Reject leave request"
        description={rejectTarget ? `${rejectTarget.staffName} · ${LEAVE_TYPE_LABELS[rejectTarget.type]}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectTarget(null); setReason(''); }}>
              Cancel
            </Button>
            <Button variant="danger" loading={updating} onClick={submitReject}>
              Reject Request
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Reason for rejection"
          required
          value={reason}
          error={reasonError ?? undefined}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this request is being rejected…"
        />
      </Modal>
    </div>
  );
}
