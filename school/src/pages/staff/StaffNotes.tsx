import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Send, FileEdit } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { TextField, TextAreaField, SelectField } from '@/components/forms/Fields';
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetClassesQuery,
  useGetNotesQuery,
  useGetStaffQuery,
  useUpdateNoteMutation,
} from '@/services/api/endpoints';
import { noteSchema, type NoteFormValues } from '@/schemas';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, todayIso } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { Note } from '@/types';

export function StaffNotes() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: notes = [], isLoading } = useGetNotesQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: staffList = [] } = useGetStaffQuery();
  const [createNote, { isLoading: creating }] = useCreateNoteMutation();
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: deleting }] = useDeleteNoteMutation();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<Note | null>(null);
  const [publishAsDraft, setPublishAsDraft] = useState(false);

  const staff = staffList.find((s) => s.id === user?.staffId);
  const subjects = staff?.subjects ?? [];
  const assignedClasses = classes.filter((c) => staff?.assignedClassIds.includes(c.id));

  const filtered = useMemo(
    () => notes.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase())),
    [notes, search],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      date: todayIso(),
      classId: assignedClasses[0]?.id ?? '',
      section: assignedClasses[0]?.sections[0] ?? 'A',
      subject: subjects[0] ?? '',
      objectives: '',
    },
  });

  const selectedClassId = watch('classId');
  const sectionOptions = classes.find((c) => c.id === selectedClassId)?.sections ?? [];

  const onSubmit = async (values: NoteFormValues) => {
    try {
      await createNote({ ...values, status: publishAsDraft ? 'draft' : 'published' }).unwrap();
      toast(publishAsDraft ? 'Note saved as draft.' : 'Note published to students.', 'success');
      reset();
      setOpen(false);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  const publishDraft = async (n: Note) => {
    try {
      await updateNote({ id: n.id, body: { status: 'published' } }).unwrap();
      toast('Note published.', 'success');
    } catch {
      toast('Could not publish note.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteNote(toDelete.id).unwrap();
      toast('Note deleted.', 'info');
    } catch {
      toast('Could not delete note.', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notes & Classwork"
        description="Create and publish notes for students and parents"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New Note
          </Button>
        }
      />

      <div className="mb-4 sm:max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Search notes…" />
      </div>

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Create your first note or classwork summary."
          action={{ label: 'New Note', onClick: () => setOpen(true) }}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((n) => (
            <li key={n.id} className="card p-4">
              <div className="flex items-center gap-2">
                <Badge tone="info">{n.subject}</Badge>
                <Badge tone={n.status === 'published' ? 'success' : 'neutral'}>{n.status}</Badge>
                <span className="ml-auto text-xs text-slate-400">{formatDate(n.date)}</span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{n.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.description}</p>
              <div className="mt-3 flex items-center gap-1">
                {n.status === 'draft' && (
                  <Button variant="ghost" onClick={() => publishDraft(n)}>
                    <Send className="h-4 w-4" aria-hidden /> Publish
                  </Button>
                )}
                <Button variant="ghost" className="ml-auto text-danger-600" onClick={() => setToDelete(n)} aria-label="Delete note">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Note / Classwork"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPublishAsDraft(true); handleSubmit(onSubmit)(); }} loading={creating}>
              <FileEdit className="h-4 w-4" aria-hidden /> Save Draft
            </Button>
            <Button onClick={() => { setPublishAsDraft(false); handleSubmit(onSubmit)(); }} loading={creating}>
              <Send className="h-4 w-4" aria-hidden /> Publish
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField label="Title" required error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField
              label="Subject"
              required
              error={errors.subject?.message}
              options={subjects.map((s) => ({ value: s, label: s }))}
              {...register('subject')}
            />
            <SelectField
              label="Class"
              required
              error={errors.classId?.message}
              options={assignedClasses.map((c) => ({ value: c.id, label: c.name }))}
              {...register('classId')}
            />
            <SelectField
              label="Section"
              required
              error={errors.section?.message}
              options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))}
              {...register('section')}
            />
          </div>
          <TextField label="Date" type="date" required error={errors.date?.message} {...register('date')} />
          <TextAreaField label="Learning Objectives" hint="Optional" error={errors.objectives?.message} {...register('objectives')} />
          <TextAreaField label="Summary / Description" required error={errors.description?.message} {...register('description')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete note?"
        message={`"${toDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
