import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AttachmentList } from '@/components/common/AttachmentList';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { useGetNotesQuery, useMarkNoteReviewedMutation } from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils';
import type { Note } from '@/types';

export function PortalNotes() {
  const { isStudent } = useAuth();
  const studentId = useSelectedStudentId();
  const { data: notes = [], isLoading } = useGetNotesQuery(studentId ? { studentId } : undefined);
  const [markReviewed] = useMarkNoteReviewedMutation();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [active, setActive] = useState<Note | null>(null);

  const subjects = useMemo(() => Array.from(new Set(notes.map((n) => n.subject))), [notes]);

  const filtered = useMemo(
    () =>
      notes.filter(
        (n) =>
          (subject === 'all' || n.subject === subject) &&
          (!search || n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase())),
      ),
    [notes, subject, search],
  );

  const reviewed = (n: Note) => !!studentId && n.reviewedBy.includes(studentId);

  const open = (n: Note) => {
    setActive(n);
    if (isStudent && studentId && !n.reviewedBy.includes(studentId)) markReviewed(n.id);
  };

  return (
    <div>
      <PageHeader title="Notes & Classwork" description="Teacher-uploaded notes and daily summaries" />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search notes…" />
        <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Filter by subject">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No notes" message="No notes match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                className="flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-300"
              >
                <div className="flex items-center gap-2">
                  <Badge tone="info">{n.subject}</Badge>
                  {reviewed(n) && <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Reviewed</Badge>}
                  <span className="ml-auto text-xs text-slate-400">{formatDate(n.date)}</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{n.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.description}</p>
                <p className="mt-2 text-xs text-slate-400">By {n.authorName}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title ?? ''}
        description={active ? `${active.subject} · ${formatDate(active.date)}` : undefined}
        footer={<Button onClick={() => setActive(null)}>Done</Button>}
      >
        {active && (
          <div className="space-y-4">
            {active.objectives && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Learning Objectives</p>
                <p className="text-sm text-slate-700">{active.objectives}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <p className="text-sm leading-relaxed text-slate-700">{active.description}</p>
            </div>
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
