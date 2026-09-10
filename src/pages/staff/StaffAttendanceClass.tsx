import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Save, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageSpinner } from '@/components/feedback/Loading';
import { EmptyState } from '@/components/feedback/States';
import {
  useGetAttendanceQuery,
  useGetClassesQuery,
  useGetStudentsQuery,
  useSubmitAttendanceMutation,
} from '@/services/api/endpoints';
import { ATTENDANCE_STATUS_LABELS } from '@/constants';
import { cn, todayIso } from '@/utils';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';
import type { AttendanceStatus } from '@/types';

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
const statusStyle: Record<AttendanceStatus, string> = {
  present: 'bg-success-600 text-white border-success-600',
  absent: 'bg-danger-600 text-white border-danger-600',
  late: 'bg-warning-500 text-white border-warning-500',
  leave: 'bg-brand-600 text-white border-brand-600',
};

export function StaffAttendanceClass() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') ?? 'A';
  const navigate = useNavigate();
  const toast = useToast();

  const [date, setDate] = useState(todayIso());
  const { data: classes = [] } = useGetClassesQuery();
  const { data: students = [], isLoading } = useGetStudentsQuery({ classId, section });
  const { data: existing = [] } = useGetAttendanceQuery({ classId, section, date });
  const [submit, { isLoading: submitting }] = useSubmitAttendanceMutation();

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const cls = classes.find((c) => c.id === classId);

  // Seed local marks from any existing submitted attendance for this date.
  useEffect(() => {
    const seeded: Record<string, AttendanceStatus> = {};
    const seededRemarks: Record<string, string> = {};
    existing.forEach((a) => {
      seeded[a.studentId] = a.status;
      if (a.remarks) seededRemarks[a.studentId] = a.remarks;
    });
    setMarks(seeded);
    setRemarks(seededRemarks);
  }, [existing, date]);

  const allMarked = students.length > 0 && students.every((s) => marks[s.id]);
  const markedCount = students.filter((s) => marks[s.id]).length;

  const summary = useMemo(() => {
    const base: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    students.forEach((s) => {
      const st = marks[s.id];
      if (st) base[st] += 1;
    });
    return base;
  }, [students, marks]);

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setMarks((prev) => ({ ...prev, [studentId]: status }));

  const markAllPresent = () => {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (next[s.id] = 'present'));
    setMarks(next);
  };

  const persist = async (asDraft: boolean) => {
    if (!classId) return;
    try {
      await submit({
        classId,
        section,
        date,
        submitted: !asDraft,
        records: students.map((s) => ({
          studentId: s.id,
          status: marks[s.id] ?? 'present',
          remarks: remarks[s.id],
        })),
      }).unwrap();
      toast(asDraft ? 'Attendance saved as draft.' : 'Attendance submitted.', 'success');
      if (!asDraft) navigate('/staff/attendance');
    } catch (err) {
      toast(parseApiError(err).message, 'error');
    } finally {
      setConfirmSubmit(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="pb-20">
      <button
        onClick={() => navigate('/staff/attendance')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>
      <PageHeader
        title={`${cls?.name ?? 'Class'} · Section ${section}`}
        description={`${markedCount}/${students.length} marked`}
        actions={
          <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Attendance date" />
        }
      />

      {students.length === 0 ? (
        <EmptyState title="No students" message="There are no students in this class and section." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={markAllPresent}>
              <CheckCheck className="h-4 w-4" aria-hidden /> Mark all present
            </Button>
            <div className="flex flex-wrap gap-2 text-xs">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                  {ATTENDANCE_STATUS_LABELS[s]}: <strong>{summary[s]}</strong>
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {students.map((s) => (
              <li key={s.id} className="card p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} color={s.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.rollNumber}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {STATUS_ORDER.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatus(s.id, status)}
                      className={cn(
                        'rounded-lg border py-2 text-xs font-semibold transition',
                        marks[s.id] === status
                          ? statusStyle[status]
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                      aria-pressed={marks[s.id] === status}
                      aria-label={`Mark ${s.name} ${ATTENDANCE_STATUS_LABELS[status]}`}
                    >
                      {ATTENDANCE_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          {/* Sticky action bar */}
          <div className="fixed inset-x-0 bottom-16 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:bottom-0 lg:pl-64">
            <div className="mx-auto flex max-w-7xl items-center gap-2 px-1 sm:px-6">
              <p className="mr-auto text-sm text-slate-500">{markedCount}/{students.length} marked</p>
              <Button variant="secondary" onClick={() => persist(true)} loading={submitting}>
                <Save className="h-4 w-4" aria-hidden /> Draft
              </Button>
              <Button onClick={() => setConfirmSubmit(true)} disabled={!allMarked || submitting}>
                <Send className="h-4 w-4" aria-hidden /> Submit
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit attendance?"
        message={`You are about to submit attendance for ${students.length} students in ${cls?.name} Section ${section} on ${date}. You can edit it later before the cutoff.`}
        confirmLabel="Submit"
        loading={submitting}
        onConfirm={() => persist(false)}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}
