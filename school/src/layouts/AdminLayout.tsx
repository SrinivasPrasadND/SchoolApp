import { AppShell } from '@/components/layout/AppShell';
import { ADMIN_NAV } from '@/components/navigation/navConfig';

export function AdminLayout() {
  return <AppShell nav={ADMIN_NAV} sectionLabel="Administrator" />;
}
