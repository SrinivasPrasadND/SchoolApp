import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Paperclip } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { TextField, TextAreaField, SelectField } from '@/components/forms/Fields';
import {
  useCreateHomeworkMutation,
  useGetClassesQuery,
  useGetHomeworkQuery,
  useGetStaffQuery,
} from '@/services/api/endpoints';
import { homeworkSchema, type HomeworkFormValues } from '@/schemas';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, todayIso } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';

export function StaffHomework() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: homework = [], isLoading } = useGetHomeworkQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: staffList = [] } = useGetStaffQuery();
  const [createHomework, { isLoading: creating }] = useCreateHomeworkMutation();
  const [open, setOpen] = useState(false);

  const staff = staffList.find((s) => s.id === user?.staffId);
  const subjects = staff?.subjects ?? [];
  const assignedClasses = classes.filter((c) => staff?.assignedClassIds.includes(c.id));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      assignedDate: todayIso(),
      dueDate: todayIso(),
      classId: assignedClasses[0]?.id ?? '',
      section: assignedClasses[0]?.sections[0] ?? 'A',
      subject: subjects[0] ?? '',
    },
  });

  const selectedClassId = watch('classId');
  const sectionOptions = classes.find((c) => c.id === selectedClassId)?.sections ?? [];

  const onSubmit = async (values: HomeworkFormValues) => {
    try {
      await createHomework(values).unwrap();
      toast('Homework assigned to students.', 'success');
      reset();
      setOpen(false);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Homework"
        description="Assign homework to your classes"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Assign Homework
          </Button>
        }
      />

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : homework.length === 0 ? (
        <EmptyState title="No homework" message="Assign your first homework." action={{ label: 'Assign Homework', onClick: () => setOpen(true) }} />
      ) : (
        <ul className="space-y-3">
          {homework.map((h) => (
            <li key={h.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{h.subject}</Badge>
                <Badge tone="neutral">{classes.find((c) => c.id === h.classId)?.name} · {h.section}</Badge>
                <span className="ml-auto text-xs text-slate-400">Due {formatDate(h.dueDate)}</span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{h.title}</p>
              <p className="mt-1 text-sm text-slate-600">{h.instructions}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>Assigned {formatDate(h.assignedDate)}</span>
                <span>{h.completedBy.length} completed</span>
                {h.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" aria-hidden /> {h.attachments.length}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Assign Homework"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="hw-form" loading={creating}>Assign</Button>
          </>
        }
      >
        <form id="hw-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField label="Title" required error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectField label="Subject" required error={errors.subject?.message} options={subjects.map((s) => ({ value: s, label: s }))} {...register('subject')} />
            <SelectField label="Class" required error={errors.classId?.message} options={assignedClasses.map((c) => ({ value: c.id, label: c.name }))} {...register('classId')} />
            <SelectField label="Section" required error={errors.section?.message} options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))} {...register('section')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Assigned Date" type="date" required error={errors.assignedDate?.message} {...register('assignedDate')} />
            <TextField label="Due Date" type="date" required error={errors.dueDate?.message} {...register('dueDate')} />
          </div>
          <TextAreaField label="Instructions" required error={errors.instructions?.message} {...register('instructions')} />
        </form>
      </Modal>
    </div>
  );
}
