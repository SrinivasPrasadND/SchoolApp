import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Archive } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/common/Pagination';
import {
  useArchiveFeeStructureMutation,
  useGetClassesQuery,
  useGetFeeStructuresQuery,
} from '@/services/api/endpoints';
import { FEE_CATEGORY_LABELS } from '@/constants';
import { downloadFile, formatCurrency, formatDate, paginate, toCsv } from '@/utils';
import { useToast } from '@/hooks/useToast';
import type { FeeStructure } from '@/types';

const PAGE_SIZE = 8;

export function AdminFees() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: fees = [], isLoading } = useGetFeeStructuresQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const [archive, { isLoading: archiving }] = useArchiveFeeStructureMutation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<FeeStructure | null>(null);

  const className = (id: string) =>
    id === 'all' ? 'All Classes' : classes.find((c) => c.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    return fees.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'all' && f.category !== category) return false;
      if (status !== 'all' && f.status !== status) return false;
      return true;
    });
  }, [fees, search, category, status]);

  const pageItems = paginate(filtered, page, PAGE_SIZE);

  const handleArchive = async () => {
    if (!toArchive) return;
    try {
      await archive(toArchive.id).unwrap();
      toast(`"${toArchive.name}" archived.`, 'success');
    } catch {
      toast('Failed to archive fee structure.', 'error');
    } finally {
      setToArchive(null);
    }
  };

  const exportCsv = () => {
    const csv = toCsv(
      filtered.map((f) => ({
        name: f.name,
        category: FEE_CATEGORY_LABELS[f.category],
        amount: f.amount,
        dueDate: f.dueDate,
        class: className(f.classId),
        status: f.status,
      })),
      ['name', 'category', 'amount', 'dueDate', 'class', 'status'],
    );
    downloadFile('fee-structures.csv', csv);
    toast('Fee data exported as CSV.', 'success');
  };

  const columns: Column<FeeStructure>[] = [
    {
      key: 'name',
      header: 'Fee Name',
      render: (f) => (
        <div>
          <p className="font-medium text-slate-900">{f.name}</p>
          <p className="text-xs text-slate-400">{f.academicYear} · {f.term}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (f) => FEE_CATEGORY_LABELS[f.category] },
    { key: 'class', header: 'Applies To', render: (f) => className(f.classId) },
    { key: 'amount', header: 'Amount', align: 'right', render: (f) => formatCurrency(f.amount) },
    { key: 'due', header: 'Due Date', render: (f) => formatDate(f.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (f) => (
        <Badge tone={f.status === 'active' ? 'success' : 'neutral'}>{f.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/fees/${f.id}`); }}>
            View
          </Button>
          {f.status === 'active' && (
            <Button
              variant="ghost"
              className="text-danger-600"
              onClick={(e) => {
                e.stopPropagation();
                setToArchive(f);
              }}
            >
              <Archive className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fee Management"
        description="Create and manage fee structures across the school"
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </Button>
            <Button onClick={() => navigate('/admin/fees/create')}>
              <Plus className="h-4 w-4" aria-hidden /> Create Fee
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search fees…" />
        <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category">
          <option value="all">All Categories</option>
          {Object.entries(FEE_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(f) => f.id}
        loading={isLoading}
        emptyMessage="No fee structures match your filters."
        onRowClick={(f) => navigate(`/admin/fees/${f.id}`)}
        mobileCard={(f) => (
          <div className="card p-4" onClick={() => navigate(`/admin/fees/${f.id}`)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{f.name}</p>
                <p className="text-xs text-slate-400">{FEE_CATEGORY_LABELS[f.category]}</p>
              </div>
              <Badge tone={f.status === 'active' ? 'success' : 'neutral'}>{f.status}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">{className(f.classId)}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(f.amount)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Due {formatDate(f.dueDate)}</p>
          </div>
        )}
      />

      {filtered.length > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!toArchive}
        title="Archive fee structure?"
        message={`"${toArchive?.name}" will be marked as archived and hidden from active lists. This can be reversed by an administrator.`}
        confirmLabel="Archive"
        tone="danger"
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setToArchive(null)}
      />
    </div>
  );
}
