import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { TextField, SelectField } from '@/components/forms/Fields';
import { PageSpinner } from '@/components/feedback/Loading';
import { ErrorState } from '@/components/feedback/States';
import {
  useGetFeeStructureQuery,
  useGetStudentFeesQuery,
  useGetStudentsQuery,
  useRecordPaymentMutation,
} from '@/services/api/endpoints';
import { paymentSchema, type PaymentFormValues } from '@/schemas';
import { FEE_CATEGORY_LABELS } from '@/constants';
import { formatCurrency, formatDate } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { StudentFee } from '@/types';

export function FeeDetail() {
  const { feeId } = useParams<{ feeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: fee, isLoading, isError, refetch } = useGetFeeStructureQuery(feeId!, { skip: !feeId });
  const { data: studentFees = [] } = useGetStudentFeesQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const [recordPayment, { isLoading: paying }] = useRecordPaymentMutation();

  const [payTarget, setPayTarget] = useState<StudentFee | null>(null);
  const [receipt, setReceipt] = useState<{ reference: string; amount: number; student: string } | null>(null);

  const rows = useMemo(
    () => studentFees.filter((sf) => sf.feeStructureId === feeId),
    [studentFees, feeId],
  );

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'online' },
  });

  const openPay = (sf: StudentFee) => {
    reset({ amount: sf.amount - sf.amountPaid, method: 'online' });
    setPayTarget(sf);
  };

  const onPay = async (values: PaymentFormValues) => {
    if (!payTarget) return;
    try {
      const res = await recordPayment({
        studentFeeId: payTarget.id,
        amount: values.amount,
        method: values.method,
      }).unwrap();
      toast('Payment recorded (simulated).', 'success');
      setReceipt({
        reference: res.payment.reference,
        amount: res.payment.amount,
        student: studentName(payTarget.studentId),
      });
      setPayTarget(null);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  if (isLoading) return <PageSpinner />;
  if (isError || !fee) return <ErrorState onRetry={refetch} />;

  const columns: Column<StudentFee>[] = [
    { key: 'student', header: 'Student', render: (sf) => studentName(sf.studentId) },
    { key: 'amount', header: 'Amount', align: 'right', render: (sf) => formatCurrency(sf.amount) },
    { key: 'paid', header: 'Paid', align: 'right', render: (sf) => formatCurrency(sf.amountPaid) },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (sf) => formatCurrency(sf.amount - sf.amountPaid),
    },
    { key: 'status', header: 'Status', render: (sf) => <PaymentStatusBadge status={sf.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (sf) =>
        sf.amountPaid < sf.amount ? (
          <Button variant="ghost" onClick={() => openPay(sf)}>
            Record Payment
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Cleared</span>
        ),
    },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/admin/fees')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to fees
      </button>
      <PageHeader title={fee.name} description={fee.description || 'Fee structure details'} />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Category</p>
          <p className="mt-1 font-semibold text-slate-900">{FEE_CATEGORY_LABELS[fee.category]}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Amount</p>
          <p className="mt-1 font-semibold text-slate-900">{formatCurrency(fee.amount)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Due Date</p>
          <p className="mt-1 font-semibold text-slate-900">{formatDate(fee.dueDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Term</p>
          <p className="mt-1 font-semibold text-slate-900">{fee.term}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Assigned Students ({rows.length})</h2>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(sf) => sf.id}
        emptyMessage="No students assigned to this fee."
        mobileCard={(sf) => (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{studentName(sf.studentId)}</p>
              <PaymentStatusBadge status={sf.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {formatCurrency(sf.amountPaid)} / {formatCurrency(sf.amount)}
              </span>
              {sf.amountPaid < sf.amount && (
                <Button variant="ghost" onClick={() => openPay(sf)}>
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      />

      {/* Record payment modal */}
      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Record Payment"
        description={payTarget ? `For ${studentName(payTarget.studentId)}` : undefined}
      >
        <form id="pay-form" onSubmit={handleSubmit(onPay)} noValidate className="space-y-4">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            Payments are simulated. No real transaction is processed.
          </p>
          <TextField label="Amount" type="number" min={0} required error={errors.amount?.message} {...register('amount')} />
          <SelectField
            label="Method"
            error={errors.method?.message}
            options={[
              { value: 'online', label: 'Online' },
              { value: 'card', label: 'Card' },
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
            ]}
            {...register('method')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={paying}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt" size="sm">
        {receipt && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
              <Receipt className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm text-slate-500">Receipt Reference</p>
            <p className="text-lg font-semibold text-slate-900">{receipt.reference}</p>
            <div className="mt-4 space-y-2 rounded-lg border border-dashed border-slate-300 p-4 text-left text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-medium">{receipt.student}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="font-medium">{fee.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-semibold text-success-600">{formatCurrency(receipt.amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{formatDate(new Date().toISOString())}</span></div>
            </div>
            <Button className="mt-4" fullWidth onClick={() => setReceipt(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
