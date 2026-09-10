import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Receipt, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextField, SelectField } from '@/components/forms/Fields';
import {
  useGetFeeStructuresQuery,
  useGetPaymentsQuery,
  useGetStudentFeesQuery,
  useRecordPaymentMutation,
} from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { paymentSchema, type PaymentFormValues } from '@/schemas';
import { FEE_CATEGORY_LABELS } from '@/constants';
import { formatCurrency, formatDate } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { StudentFee } from '@/types';

export function PortalFees() {
  const toast = useToast();
  const studentId = useSelectedStudentId();
  const { data: fees = [], isLoading } = useGetStudentFeesQuery(studentId ? { studentId } : undefined, { skip: !studentId });
  const { data: structures = [] } = useGetFeeStructuresQuery();
  const { data: payments = [] } = useGetPaymentsQuery(studentId ? { studentId } : undefined, { skip: !studentId });
  const [recordPayment, { isLoading: paying }] = useRecordPaymentMutation();

  const [payTarget, setPayTarget] = useState<StudentFee | null>(null);
  const [receipt, setReceipt] = useState<{ reference: string; amount: number } | null>(null);

  const totals = useMemo(() => {
    const total = fees.reduce((s, f) => s + f.amount, 0);
    const paid = fees.reduce((s, f) => s + f.amountPaid, 0);
    const overdue = fees.filter((f) => f.status === 'overdue').reduce((s, f) => s + (f.amount - f.amountPaid), 0);
    return { total, paid, outstanding: total - paid, overdue };
  }, [fees]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    fees.forEach((f) => map.set(f.category, (map.get(f.category) ?? 0) + f.amount));
    return Array.from(map.entries());
  }, [fees]);

  const feeName = (fee: StudentFee) => structures.find((s) => s.id === fee.feeStructureId)?.name ?? FEE_CATEGORY_LABELS[fee.category];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema), defaultValues: { method: 'online' } });

  const openPay = (f: StudentFee) => {
    reset({ amount: f.amount - f.amountPaid, method: 'online' });
    setPayTarget(f);
  };

  const onPay = async (values: PaymentFormValues) => {
    if (!payTarget) return;
    try {
      const res = await recordPayment({ studentFeeId: payTarget.id, amount: values.amount, method: values.method }).unwrap();
      toast('Payment successful (simulated).', 'success');
      setReceipt({ reference: res.payment.reference, amount: res.payment.amount });
      setPayTarget(null);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  const feeColumns: Column<StudentFee>[] = [
    { key: 'name', header: 'Fee', render: (f) => feeName(f) },
    { key: 'category', header: 'Category', render: (f) => FEE_CATEGORY_LABELS[f.category] },
    { key: 'amount', header: 'Amount', align: 'right', render: (f) => formatCurrency(f.amount) },
    { key: 'balance', header: 'Balance', align: 'right', render: (f) => formatCurrency(f.amount - f.amountPaid) },
    { key: 'due', header: 'Due', render: (f) => formatDate(f.dueDate) },
    { key: 'status', header: 'Status', render: (f) => <PaymentStatusBadge status={f.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (f) =>
        f.amountPaid < f.amount ? (
          <Button variant="ghost" onClick={() => openPay(f)}><CreditCard className="h-4 w-4" aria-hidden /> Pay</Button>
        ) : (
          <span className="text-xs text-slate-400">Paid</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Fees" description="View and pay fees (payments are simulated)" />

      <div className="mb-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-xs text-brand-700">
        This is a prototype. All payments are simulated — no real transaction occurs.
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Fees" value={formatCurrency(totals.total)} icon={<Wallet className="h-5 w-5" />} tone="brand" />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} tone="success" />
        <StatCard label="Outstanding" value={formatCurrency(totals.outstanding)} tone="warning" />
        <StatCard label="Overdue" value={formatCurrency(totals.overdue)} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Fee Breakdown</h2>
          <DataTable
            columns={feeColumns}
            rows={fees}
            rowKey={(f) => f.id}
            loading={isLoading}
            emptyMessage="No fees assigned."
            mobileCard={(f) => (
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{feeName(f)}</p>
                  <PaymentStatusBadge status={f.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Bal {formatCurrency(f.amount - f.amountPaid)} · Due {formatDate(f.dueDate)}</span>
                  {f.amountPaid < f.amount && (
                    <Button variant="ghost" onClick={() => openPay(f)}>Pay</Button>
                  )}
                </div>
              </div>
            )}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">By Category</h2>
          <div className="card mb-4 divide-y divide-slate-100 p-4">
            {byCategory.map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-600">{FEE_CATEGORY_LABELS[cat as keyof typeof FEE_CATEGORY_LABELS]}</span>
                <span className="font-medium text-slate-900">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>

          <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment History</h2>
          <div className="card divide-y divide-slate-100 p-4">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-400">No payments yet.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{p.reference}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.date)} · {p.method}</p>
                  </div>
                  <span className="font-semibold text-success-600">{formatCurrency(p.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay now modal */}
      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Pay Fee"
        description={payTarget ? feeName(payTarget) : undefined}
      >
        <form onSubmit={handleSubmit(onPay)} noValidate className="space-y-4">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">Simulated payment — no real charge.</p>
          <TextField label="Amount" type="number" min={0} required error={errors.amount?.message} {...register('amount')} />
          <SelectField
            label="Payment Method"
            error={errors.method?.message}
            options={[
              { value: 'online', label: 'Online Banking' },
              { value: 'card', label: 'Card' },
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
            ]}
            {...register('method')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button type="submit" loading={paying}>Pay Now</Button>
          </div>
        </form>
      </Modal>

      {/* Receipt */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt" size="sm">
        {receipt && (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
              <Receipt className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm text-slate-500">Reference</p>
            <p className="text-lg font-semibold text-slate-900">{receipt.reference}</p>
            <p className="mt-2 text-2xl font-bold text-success-600">{formatCurrency(receipt.amount)}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDate(new Date().toISOString())}</p>
            <Button className="mt-4" fullWidth onClick={() => setReceipt(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
