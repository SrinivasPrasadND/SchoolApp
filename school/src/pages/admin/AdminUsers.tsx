import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, GraduationCap, Users, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TextField, SelectField } from '@/components/forms/Fields';
import {
  useGetClassesQuery,
  useGetParentsQuery,
  useGetStaffQuery,
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  type ParentAccount,
} from '@/services/api/endpoints';
import {
  studentSchema,
  parentSchema,
  staffSchema,
  type StudentFormValues,
  type ParentFormValues,
  type StaffFormValues,
} from '@/schemas';
import { cn, todayIso } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { Staff, Student } from '@/types';

type Tab = 'students' | 'parents' | 'staff';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'parents', label: 'Parents', icon: Users },
  { id: 'staff', label: 'Staff', icon: UserCog },
];

export function AdminUsers() {
  const [tab, setTab] = useState<Tab>('students');

  return (
    <div>
      <PageHeader title="User Management" description="Add, update, and remove students, parents, and staff" />

      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="User types">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
              tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && <StudentsTab />}
      {tab === 'parents' && <ParentsTab />}
      {tab === 'staff' && <StaffTab />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Students                                                                    */
/* -------------------------------------------------------------------------- */

function StudentsTab() {
  const toast = useToast();
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: parents = [] } = useGetParentsQuery();
  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: deleting }] = useDeleteStudentMutation();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
  const parentName = (id: string) => parents.find((p) => p.id === id)?.name ?? '—';

  const filtered = useMemo(
    () => students.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())),
    [students, search],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema) });

  const selectedClassId = watch('classId');
  const sectionOptions = classes.find((c) => c.id === selectedClassId)?.sections ?? [];

  const openCreate = () => {
    setEditing(null);
    reset({
      name: '',
      rollNumber: '',
      classId: classes[0]?.id ?? '',
      section: classes[0]?.sections[0] ?? 'A',
      parentId: parents[0]?.id ?? '',
      gender: 'male',
      dateOfBirth: '2014-01-01',
      guardianName: '',
      contactPhone: '',
      admissionDate: todayIso(),
    });
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    reset({
      name: s.name,
      rollNumber: s.rollNumber,
      classId: s.classId,
      section: s.section,
      parentId: s.parentId,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      guardianName: s.guardianName,
      contactPhone: s.contactPhone,
      admissionDate: s.admissionDate,
    });
    setOpen(true);
  };

  const onSubmit = async (values: StudentFormValues) => {
    try {
      if (editing) {
        await updateStudent({ id: editing.id, body: values }).unwrap();
        toast('Student updated.', 'success');
      } else {
        await createStudent(values).unwrap();
        toast('Student added.', 'success');
      }
      setOpen(false);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      toast(message, 'error');
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([f, m]) => setError(f as keyof StudentFormValues, { message: m }));
      }
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteStudent(toDelete.id).unwrap();
      toast('Student removed.', 'info');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    } finally {
      setToDelete(null);
    }
  };

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
    { key: 'parent', header: 'Parent', render: (s) => parentName(s.parentId) },
    { key: 'contact', header: 'Contact', render: (s) => s.contactPhone },
    { key: 'actions', header: '', align: 'right', render: (s) => <RowActions onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} /> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search students…" className="sm:max-w-xs" />
        <Button onClick={openCreate} disabled={parents.length === 0}>
          <Plus className="h-4 w-4" aria-hidden /> Add Student
        </Button>
      </div>
      {parents.length === 0 && (
        <p className="mb-3 rounded-lg border border-warning-100 bg-warning-50 px-3 py-2 text-sm text-warning-700">
          Add a parent first — every student must be linked to a parent account.
        </p>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        loading={isLoading}
        emptyMessage="No students yet."
        mobileCard={(s) => (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={s.name} color={s.avatarColor} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400">{className(s.classId)} · {s.section} · {parentName(s.parentId)}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <RowActions onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} />
            </div>
          </div>
        )}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Student' : 'Add Student'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="student-form" loading={creating || updating}>
              {editing ? 'Save Changes' : 'Add Student'}
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Full Name" required error={errors.name?.message} {...register('name')} />
            <TextField label="Roll Number" required error={errors.rollNumber?.message} {...register('rollNumber')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField
              label="Class"
              required
              error={errors.classId?.message}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              {...register('classId')}
            />
            <SelectField
              label="Section"
              required
              error={errors.section?.message}
              options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))}
              {...register('section')}
            />
            <SelectField
              label="Gender"
              error={errors.gender?.message}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              {...register('gender')}
            />
          </div>
          <SelectField
            label="Parent Account"
            required
            error={errors.parentId?.message}
            options={parents.map((p) => ({ value: p.id, label: `${p.name} (${p.email})` }))}
            {...register('parentId')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Guardian Name" required error={errors.guardianName?.message} {...register('guardianName')} />
            <TextField label="Contact Phone" required error={errors.contactPhone?.message} {...register('contactPhone')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Date of Birth" type="date" required error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
            <TextField label="Admission Date" type="date" required error={errors.admissionDate?.message} {...register('admissionDate')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete student?"
        message={`"${toDelete?.name}" and their fees, payments, and attendance records will be permanently removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parents                                                                     */
/* -------------------------------------------------------------------------- */

function ParentsTab() {
  const toast = useToast();
  const { data: parents = [], isLoading } = useGetParentsQuery();
  const [createParent, { isLoading: creating }] = useCreateParentMutation();
  const [updateParent, { isLoading: updating }] = useUpdateParentMutation();
  const [deleteParent, { isLoading: deleting }] = useDeleteParentMutation();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParentAccount | null>(null);
  const [toDelete, setToDelete] = useState<ParentAccount | null>(null);

  const filtered = useMemo(
    () =>
      parents.filter(
        (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [parents, search],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ParentFormValues>({ resolver: zodResolver(parentSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', username: '' });
    setOpen(true);
  };
  const openEdit = (p: ParentAccount) => {
    setEditing(p);
    reset({ name: p.name, email: p.email, username: p.username });
    setOpen(true);
  };

  const onSubmit = async (values: ParentFormValues) => {
    try {
      if (editing) {
        await updateParent({ id: editing.id, body: values }).unwrap();
        toast('Parent updated.', 'success');
      } else {
        await createParent(values).unwrap();
        toast('Parent account created (password: password123).', 'success');
      }
      setOpen(false);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      toast(message, 'error');
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([f, m]) => setError(f as keyof ParentFormValues, { message: m }));
      }
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteParent(toDelete.id).unwrap();
      toast('Parent removed.', 'info');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    } finally {
      setToDelete(null);
    }
  };

  const columns: Column<ParentAccount>[] = [
    {
      key: 'name',
      header: 'Parent',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-400">{p.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'username', header: 'Username', render: (p) => p.username },
    { key: 'children', header: 'Linked Children', render: (p) => <Badge tone="info">{p.studentIds.length}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => <RowActions onEdit={() => openEdit(p)} onDelete={() => setToDelete(p)} /> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search parents…" className="sm:max-w-xs" />
        <Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> Add Parent</Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        loading={isLoading}
        emptyMessage="No parent accounts yet."
        mobileCard={(p) => (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-400">{p.email} · {p.studentIds.length} child(ren)</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <RowActions onEdit={() => openEdit(p)} onDelete={() => setToDelete(p)} />
            </div>
          </div>
        )}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Parent' : 'Add Parent'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="parent-form" loading={creating || updating}>
              {editing ? 'Save Changes' : 'Add Parent'}
            </Button>
          </>
        }
      >
        <form id="parent-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {!editing && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              A login account is created with the default password <strong>password123</strong>.
            </p>
          )}
          <TextField label="Full Name" required error={errors.name?.message} {...register('name')} />
          <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <TextField label="Username" hint="Optional — defaults to the email prefix" error={errors.username?.message} {...register('username')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete parent?"
        message={`"${toDelete?.name}" will be removed. Parents with linked students cannot be deleted until those students are reassigned or removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

function StaffTab() {
  const toast = useToast();
  const { data: staff = [], isLoading } = useGetStaffQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: deleting }] = useDeleteStaffMutation();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [toDelete, setToDelete] = useState<Staff | null>(null);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);

  const filtered = useMemo(
    () => staff.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())),
    [staff, search],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema) });

  const openCreate = () => {
    setEditing(null);
    setAssignedClassIds([]);
    reset({
      name: '',
      email: '',
      department: '',
      designation: 'Teacher',
      subjects: '',
      contactPhone: '',
      joiningDate: todayIso(),
      leaveBalance: 20,
    });
    setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setAssignedClassIds(s.assignedClassIds);
    reset({
      name: s.name,
      email: s.email,
      department: s.department,
      designation: s.designation,
      subjects: s.subjects.join(', '),
      contactPhone: s.contactPhone,
      joiningDate: s.joiningDate,
      leaveBalance: s.leaveBalance,
    });
    setOpen(true);
  };

  const toggleClass = (id: string) =>
    setAssignedClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const onSubmit = async (values: StaffFormValues) => {
    const body = {
      ...values,
      subjects: values.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      assignedClassIds,
    };
    try {
      if (editing) {
        await updateStaff({ id: editing.id, body }).unwrap();
        toast('Staff member updated.', 'success');
      } else {
        await createStaff(body).unwrap();
        toast('Staff member added (password: password123).', 'success');
      }
      setOpen(false);
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      toast(message, 'error');
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([f, m]) => setError(f as keyof StaffFormValues, { message: m }));
      }
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteStaff(toDelete.id).unwrap();
      toast('Staff member removed.', 'info');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    } finally {
      setToDelete(null);
    }
  };

  const columns: Column<Staff>[] = [
    {
      key: 'name',
      header: 'Staff',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} color={s.avatarColor} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-400">{s.designation}</p>
          </div>
        </div>
      ),
    },
    { key: 'dept', header: 'Department', render: (s) => s.department },
    { key: 'subjects', header: 'Subjects', render: (s) => s.subjects.join(', ') || '—' },
    { key: 'leave', header: 'Leave', align: 'right', render: (s) => <Badge tone="info">{s.leaveBalance}d</Badge> },
    { key: 'actions', header: '', align: 'right', render: (s) => <RowActions onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} /> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search staff…" className="sm:max-w-xs" />
        <Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden /> Add Staff</Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        loading={isLoading}
        emptyMessage="No staff members yet."
        mobileCard={(s) => (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={s.name} color={s.avatarColor} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400">{s.designation} · {s.department}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <RowActions onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} />
            </div>
          </div>
        )}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Staff' : 'Add Staff'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="staff-form" loading={creating || updating}>
              {editing ? 'Save Changes' : 'Add Staff'}
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {!editing && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              A login account is created with the default password <strong>password123</strong>.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Full Name" required error={errors.name?.message} {...register('name')} />
            <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Department" required error={errors.department?.message} {...register('department')} />
            <TextField label="Designation" required error={errors.designation?.message} {...register('designation')} />
          </div>
          <TextField label="Subjects" hint="Comma separated, e.g. Mathematics, Science" required error={errors.subjects?.message} {...register('subjects')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Contact Phone" required error={errors.contactPhone?.message} {...register('contactPhone')} />
            <TextField label="Joining Date" type="date" required error={errors.joiningDate?.message} {...register('joiningDate')} />
          </div>
          <TextField label="Leave Balance (days)" type="number" min={0} required error={errors.leaveBalance?.message} {...register('leaveBalance')} />
          <div>
            <p className="label">Assigned Classes</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
                    assignedClassIds.includes(c.id)
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={assignedClassIds.includes(c.id)}
                    onChange={() => toggleClass(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete staff member?"
        message={`"${toDelete?.name}" and their login account will be permanently removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-4 w-4" aria-hidden />
      </Button>
      <Button variant="ghost" className="text-danger-600" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
