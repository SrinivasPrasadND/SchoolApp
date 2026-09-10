import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Avatar } from '@/components/common/Avatar';
import { useGetClassesQuery, useGetStudentsQuery } from '@/services/api/endpoints';
import type { Student } from '@/types';

export function StaffStudents() {
  const { data: classes = [] } = useGetClassesQuery();
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('all');
  const navigate = useNavigate();

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          (classId === 'all' || s.classId === classId) &&
          (!search || s.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [students, classId, search],
  );

  const assignedClasses = useMemo(
    () => classes.filter((c) => students.some((s) => s.classId === c.id)),
    [classes, students],
  );

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
    { key: 'contact', header: 'Contact', render: (s) => s.contactPhone },
  ];

  return (
    <div>
      <PageHeader title="My Students" description="Students in your assigned classes" />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search students…" />
        <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Filter by class">
          <option value="all">All Classes</option>
          {assignedClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        loading={isLoading}
        emptyMessage="No students found."
        onRowClick={(s) => navigate(`/staff/students/${s.id}`)}
        mobileCard={(s) => (
          <div className="card flex items-center gap-3 p-4" onClick={() => navigate(`/staff/students/${s.id}`)}>
            <Avatar name={s.name} color={s.avatarColor} />
            <div>
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-400">{className(s.classId)} · {s.section}</p>
              <p className="text-xs text-slate-400">{s.guardianName} · {s.contactPhone}</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
