import { useMemo, useState } from 'react';
import { Pin, Megaphone, Check } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AttachmentList } from '@/components/common/AttachmentList';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import {
  useGetAnnouncementsQuery,
  useMarkAnnouncementReadMutation,
} from '@/services/api/endpoints';
import { ANNOUNCEMENT_CATEGORY_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils';
import type { Announcement, AnnouncementCategory } from '@/types';

/** Read-only announcement feed with category filter, mark-as-read, and details. */
export function AnnouncementsFeed() {
  const { user } = useAuth();
  const { data: announcements = [], isLoading } = useGetAnnouncementsQuery();
  const [markRead] = useMarkAnnouncementReadMutation();
  const [category, setCategory] = useState<'all' | AnnouncementCategory>('all');
  const [active, setActive] = useState<Announcement | null>(null);

  const filtered = useMemo(
    () => announcements.filter((a) => category === 'all' || a.category === category),
    [announcements, category],
  );

  const isRead = (a: Announcement) => !!user && a.readBy.includes(user.id);

  const open = (a: Announcement) => {
    setActive(a);
    if (user && !a.readBy.includes(user.id)) markRead(a.id);
  };

  if (isLoading) return <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>;

  return (
    <div>
      <div className="mb-4">
        <select
          className="input sm:max-w-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {Object.entries(ANNOUNCEMENT_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No announcements" message="You're all caught up." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => open(a)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-300 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned && <Badge tone="warning" icon={<Pin className="h-3 w-3" aria-hidden />}>Pinned</Badge>}
                  <Badge tone="info">{ANNOUNCEMENT_CATEGORY_LABELS[a.category]}</Badge>
                  {a.priority === 'high' && <Badge tone="danger">High priority</Badge>}
                  {!isRead(a) && <Badge tone="success">New</Badge>}
                  <span className="ml-auto text-xs text-slate-400">{formatDate(a.publishedAt)}</span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title ?? ''}
        description={active ? `By ${active.author} · ${formatDate(active.publishedAt)}` : undefined}
        footer={<Button onClick={() => setActive(null)}><Check className="h-4 w-4" aria-hidden /> Done</Button>}
      >
        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{ANNOUNCEMENT_CATEGORY_LABELS[active.category]}</Badge>
              {active.priority === 'high' && <Badge tone="danger">High priority</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{active.body}</p>
            {active.attachments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments</p>
                <AttachmentList attachments={active.attachments} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
