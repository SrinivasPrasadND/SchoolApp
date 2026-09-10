import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { Pagination } from '@/components/common/Pagination';
import { useGetClassesQuery, useGetStudentsQuery } from '@/services/api/endpoints';
import { formatDate, paginate } from '@/utils';
import type { Student } from '@/types';

const PAGE_SIZE = 10;

export function AdminStudents() {
  const { data: classes = [] } = useGetClassesQuery();
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          (classId === 'all' || s.classId === classId) &&
          (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.toLowerCase().includes(search.toLowerCase())),
      ),
    [students, classId, search],
  );

  const pageItems = paginate(filtered, page, PAGE_SIZE);

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} color={s.avatarColor} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-400">{s.rollNumber}</p>
          </div>
        </div>
      ),
    },
    { key: 'class', header: 'Class', render: (s) => `${className(s.classId)} · ${s.section}` },
    { key: 'guardian', header: 'Guardian', render: (s) => s.guardianName },
    { key: 'phone', header: 'Contact', render: (s) => s.contactPhone },
    { key: 'admission', header: 'Admitted', render: (s) => formatDate(s.admissionDate) },
  ];

  return (
    <div>
      <PageHeader title="Student Directory" description={`${students.length} students enrolled`} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or roll no…" />
        <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }} aria-label="Filter by class">
          <option value="all">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(s) => s.id}
        loading={isLoading}
        emptyMessage="No students found."
        onRowClick={(s) => navigate(`/admin/students/${s.id}`)}
        mobileCard={(s) => (
          <div className="card flex items-center gap-3 p-4" onClick={() => navigate(`/admin/students/${s.id}`)}>
            <Avatar name={s.name} color={s.avatarColor} />
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-400">{className(s.classId)} · {s.section} · {s.rollNumber}</p>
              <p className="text-xs text-slate-400">{s.guardianName} · {s.contactPhone}</p>
            </div>
          </div>
        )}
      />

      {filtered.length > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}
    </div>
  );
}
