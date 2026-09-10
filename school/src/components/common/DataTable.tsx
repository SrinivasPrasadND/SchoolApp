import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { TableSkeleton } from '../feedback/Loading';
import { EmptyState } from '../feedback/States';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Optional card renderer used on small screens instead of the table. */
  mobileCard?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = 'No records found.',
  mobileCard,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="card p-4">
        <TableSkeleton rows={5} cols={columns.length} />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const alignClass = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <>
      {/* Mobile cards */}
      {mobileCard && (
        <div className="space-y-3 md:hidden">
          {rows.map((row) => (
            <div key={rowKey(row)}>{mobileCard(row)}</div>
          ))}
        </div>
      )}

      {/* Desktop / tablet table */}
      <div className={cn('card overflow-hidden', mobileCard && 'hidden md:block')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'whitespace-nowrap px-4 py-3 font-semibold text-slate-600',
                      alignClass(col.align),
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'transition-colors hover:bg-slate-50',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-slate-700', alignClass(col.align), col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
