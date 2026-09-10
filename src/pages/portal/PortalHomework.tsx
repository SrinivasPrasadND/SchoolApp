import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Paperclip } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/feedback/States';
import { TableSkeleton } from '@/components/feedback/Loading';
import { useGetHomeworkQuery, useToggleHomeworkCompleteMutation } from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, todayIso } from '@/utils';
import { useToast } from '@/hooks/useToast';

export function PortalHomework() {
  const { isStudent } = useAuth();
  const toast = useToast();
  const studentId = useSelectedStudentId();
  const { data: homework = [], isLoading } = useGetHomeworkQuery(
    studentId ? { studentId } : undefined,
  );
  const [toggle, { isLoading: toggling }] = useToggleHomeworkCompleteMutation();

  const [subject, setSubject] = useState('all');
  const [status, setStatus] = useState('all');

  const subjects = useMemo(() => Array.from(new Set(homework.map((h) => h.subject))), [homework]);

  const isDone = (hwCompletedBy: string[]) => !!studentId && hwCompletedBy.includes(studentId);

  const filtered = useMemo(
    () =>
      homework.filter((h) => {
        const done = !!studentId && h.completedBy.includes(studentId);
        if (subject !== 'all' && h.subject !== subject) return false;
        if (status === 'completed' && !done) return false;
        if (status === 'pending' && done) return false;
        return true;
      }),
    [homework, subject, status, studentId],
  );

  const handleToggle = async (id: string) => {
    if (!isStudent) {
      toast('Only students can mark homework complete.', 'info');
      return;
    }
    try {
      await toggle(id).unwrap();
    } catch {
      toast('Could not update homework.', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Homework" description="Track assignments and due dates" />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-2/3">
        <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Filter by subject">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card p-4"><TableSkeleton rows={4} cols={1} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No homework" message="No assignments match your filters." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((h) => {
            const done = isDone(h.completedBy);
            const overdue = !done && h.dueDate < todayIso();
            return (
              <li key={h.id} className="card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(h.id)}
                    disabled={toggling}
                    className="mt-0.5 shrink-0"
                    aria-label={done ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-success-600" aria-hidden />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300" aria-hidden />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{h.title}</p>
                      <Badge tone="info">{h.subject}</Badge>
                      {overdue && <Badge tone="danger">Overdue</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{h.instructions}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Assigned {formatDate(h.assignedDate)}</span>
                      <span>Due {formatDate(h.dueDate)}</span>
                      {h.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" aria-hidden /> {h.attachments.length} file(s)</span>
                      )}
                    </div>
                  </div>
                  {isStudent && (
                    <Button variant="ghost" onClick={() => handleToggle(h.id)} disabled={toggling}>
                      {done ? 'Undo' : 'Mark done'}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
