import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pin, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { TextField, TextAreaField, SelectField } from '@/components/forms/Fields';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { useCreateAnnouncementMutation, useGetAnnouncementsQuery } from '@/services/api/endpoints';
import { announcementSchema, type AnnouncementFormValues } from '@/schemas';
import { ANNOUNCEMENT_CATEGORY_LABELS } from '@/constants';
import { formatDate } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';

export function AdminAnnouncements() {
  const toast = useToast();
  const { data: announcements = [], isLoading } = useGetAnnouncementsQuery();
  const [create, { isLoading: creating }] = useCreateAnnouncementMutation();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { category: 'general', priority: 'normal', pinned: false },
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    try {
      await create(values).unwrap();
      toast('Announcement published.', 'success');
      reset();
      setOpen(false);
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Post updates for staff, parents, and students"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New Announcement
          </Button>
        }
      />

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No announcements yet"
          message="Create your first announcement to notify the school."
          action={{ label: 'New Announcement', onClick: () => setOpen(true) }}
        />
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <Badge tone="warning" icon={<Pin className="h-3 w-3" aria-hidden />}>Pinned</Badge>
                )}
                <Badge tone="info">{ANNOUNCEMENT_CATEGORY_LABELS[a.category]}</Badge>
                {a.priority === 'high' && <Badge tone="danger">High priority</Badge>}
                <span className="ml-auto text-xs text-slate-400">{formatDate(a.publishedAt)}</span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900">{a.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{a.body}</p>
              <p className="mt-2 text-xs text-slate-400">By {a.author} · to {a.audience.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Announcement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="ann-form" loading={creating}>Publish</Button>
          </>
        }
      >
        <form id="ann-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField label="Title" required error={errors.title?.message} {...register('title')} />
          <TextAreaField label="Message" required error={errors.body?.message} {...register('body')} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Category"
              error={errors.category?.message}
              options={Object.entries(ANNOUNCEMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
              {...register('category')}
            />
            <SelectField
              label="Priority"
              error={errors.priority?.message}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
              ]}
              {...register('priority')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('pinned')} />
            Pin this announcement to the top
          </label>
        </form>
      </Modal>
    </div>
  );
}
