import { AppShell } from '@/components/layout/AppShell';
import { STAFF_NAV } from '@/components/navigation/navConfig';

export function StaffLayout() {
  return <AppShell nav={STAFF_NAV} sectionLabel="Staff / Faculty" />;
}
