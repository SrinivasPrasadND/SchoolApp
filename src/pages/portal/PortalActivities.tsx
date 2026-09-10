import { PageHeader } from '@/components/common/PageHeader';
import { ActivityAgenda } from '@/features/activities/ActivityAgenda';

export function PortalActivities() {
  return (
    <div>
      <PageHeader title="Daily Activities" description="Classroom activities, events, tests, and more" />
      <ActivityAgenda />
    </div>
  );
}
