import { PageHeader } from '@/components/common/PageHeader';
import { ActivityAgenda } from '@/features/activities/ActivityAgenda';

export function AdminCalendar() {
  return (
    <div>
      <PageHeader title="Academic Calendar" description="School events, tests, holidays, and activities" />
      <ActivityAgenda />
    </div>
  );
}
