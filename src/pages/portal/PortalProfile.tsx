import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { PageSpinner } from '@/components/feedback/Loading';
import { useGetClassesQuery, useGetStudentsQuery } from '@/services/api/endpoints';
import { useSelectedStudentId } from '@/hooks/useSelectedStudent';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils';

export function PortalProfile() {
  const { user } = useAuth();
  const studentId = useSelectedStudentId();
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const student = students.find((s) => s.id === studentId);
  const className = student ? classes.find((c) => c.id === student.classId)?.name ?? '' : '';

  if (isLoading) return <PageSpinner />;

  const rows = student
    ? [
        { label: 'Roll Number', value: student.rollNumber },
        { label: 'Class', value: `${className} · Section ${student.section}` },
        { label: 'Date of Birth', value: formatDate(student.dateOfBirth) },
        { label: 'Guardian', value: student.guardianName },
        { label: 'Contact', value: student.contactPhone },
        { label: 'Admission Date', value: formatDate(student.admissionDate) },
      ]
    : [];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" description="Student and account details" />

      <div className="card mb-4 flex items-center gap-4 p-5">
        <Avatar name={student?.name ?? user?.name ?? 'User'} color={student?.avatarColor ?? user?.avatarColor} size="lg" />
        <div>
          <p className="font-semibold text-slate-900">{student?.name ?? user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      {student && (
        <div className="card divide-y divide-slate-100 p-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-3 py-3">
              <span className="text-sm text-slate-500">{r.label}</span>
              <span className="text-sm font-medium text-slate-900">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
