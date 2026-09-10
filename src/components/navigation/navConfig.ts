import {
  LayoutDashboard,
  Wallet,
  CalendarCheck,
  CalendarDays,
  Users,
  GraduationCap,
  Megaphone,
  Settings,
  BookOpen,
  ClipboardList,
  FileText,
  Plane,
  User,
  UserCog,
  CalendarClock,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Fees', to: '/admin/fees', icon: Wallet },
  { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
  { label: 'Staff Leaves', to: '/admin/staff-leaves', icon: Plane },
  { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
  { label: 'Students', to: '/admin/students', icon: GraduationCap },
  { label: 'Staff', to: '/admin/staff', icon: Users },
  { label: 'User Management', to: '/admin/users', icon: UserCog },
  { label: 'Calendar', to: '/admin/calendar', icon: CalendarDays },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export const PORTAL_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Announcements', to: '/portal/announcements', icon: Megaphone },
  { label: 'Homework', to: '/portal/homework', icon: ClipboardList },
  { label: 'Activities', to: '/portal/activities', icon: Activity },
  { label: 'Notes', to: '/portal/notes', icon: BookOpen },
  { label: 'Attendance', to: '/portal/attendance', icon: CalendarCheck },
  { label: 'Fees', to: '/portal/fees', icon: Wallet },
  { label: 'Timetable', to: '/portal/timetable', icon: CalendarClock },
  { label: 'Profile', to: '/portal/profile', icon: User },
];

export const STAFF_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', to: '/staff/attendance', icon: CalendarCheck },
  { label: 'Notes', to: '/staff/notes', icon: BookOpen },
  { label: 'Homework', to: '/staff/homework', icon: ClipboardList },
  { label: 'Leaves', to: '/staff/leaves', icon: Plane },
  { label: 'Timetable', to: '/staff/timetable', icon: CalendarClock },
  { label: 'Students', to: '/staff/students', icon: GraduationCap },
  { label: 'Profile', to: '/staff/profile', icon: FileText },
];

/** Items shown in the compact mobile bottom bar (first four + more). */
export function mobileNavFor(role: UserRole): NavItem[] {
  if (role === 'admin') return ADMIN_NAV.slice(0, 5);
  if (role === 'staff') return STAFF_NAV.slice(0, 5);
  return PORTAL_NAV.slice(0, 5);
}
