import { PageHeader } from '@/components/common/PageHeader';
import { AnnouncementsFeed } from '@/features/announcements/AnnouncementsFeed';

export function PortalAnnouncements() {
  return (
    <div>
      <PageHeader title="Announcements" description="School updates and notices" />
      <AnnouncementsFeed />
    </div>
  );
}
