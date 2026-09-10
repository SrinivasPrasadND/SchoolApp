import { AppShell } from '@/components/layout/AppShell';
import { PORTAL_NAV } from '@/components/navigation/navConfig';

export function PortalLayout() {
  return <AppShell nav={PORTAL_NAV} sectionLabel="Parent / Student" />;
}
