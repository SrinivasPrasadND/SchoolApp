import { PageHeader } from '@/components/common/PageHeader';
import { TimetableView } from '@/features/timetable/TimetableView';
import { useGetStudentsQuery } from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { PageSpinner } from '@/components/feedback/Loading';

export function PortalTimetable() {
  const studentId = useSelectedStudentId();
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const student = students.find((s) => s.id === studentId);

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Timetable" description="Weekly class schedule" />
      {student ? (
        <TimetableView classId={student.classId} />
      ) : (
        <p className="text-sm text-slate-400">No timetable available.</p>
      )}
    </div>
  );
}
