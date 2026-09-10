import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestOnlyRoute, RequireAuth, RequireRole } from '@/components/routing/Guards';
import { LoginPage } from '@/pages/auth/LoginPage';
import { UnauthorizedPage, NotFoundPage } from '@/pages/shared/ErrorPages';

import { AdminLayout } from '@/layouts/AdminLayout';
import { PortalLayout } from '@/layouts/PortalLayout';
import { StaffLayout } from '@/layouts/StaffLayout';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminFees } from '@/pages/admin/AdminFees';
import { FeeCreate } from '@/pages/admin/FeeCreate';
import { FeeDetail } from '@/pages/admin/FeeDetail';
import { AdminAttendance } from '@/pages/admin/AdminAttendance';
import { AdminStaffLeaves } from '@/pages/admin/AdminStaffLeaves';
import { AdminAnnouncements } from '@/pages/admin/AdminAnnouncements';
import { AdminStudents } from '@/pages/admin/AdminStudents';
import { AdminStaff } from '@/pages/admin/AdminStaff';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminCalendar } from '@/pages/admin/AdminCalendar';

// Portal pages
import { PortalDashboard } from '@/pages/portal/PortalDashboard';
import { PortalAnnouncements } from '@/pages/portal/PortalAnnouncements';
import { PortalHomework } from '@/pages/portal/PortalHomework';
import { PortalActivities } from '@/pages/portal/PortalActivities';
import { PortalNotes } from '@/pages/portal/PortalNotes';
import { PortalAttendance } from '@/pages/portal/PortalAttendance';
import { PortalFees } from '@/pages/portal/PortalFees';
import { PortalTimetable } from '@/pages/portal/PortalTimetable';
import { PortalProfile } from '@/pages/portal/PortalProfile';

// Staff pages
import { StaffDashboard } from '@/pages/staff/StaffDashboard';
import { StaffAttendance } from '@/pages/staff/StaffAttendance';
import { StaffAttendanceClass } from '@/pages/staff/StaffAttendanceClass';
import { StaffNotes } from '@/pages/staff/StaffNotes';
import { StaffHomework } from '@/pages/staff/StaffHomework';
import { StaffLeaves } from '@/pages/staff/StaffLeaves';
import { StaffTimetable } from '@/pages/staff/StaffTimetable';
import { StaffStudents } from '@/pages/staff/StaffStudents';
import { StaffProfile } from '@/pages/staff/StaffProfile';

// Shared
import { SettingsPage } from '@/pages/shared/SettingsPage';
import { StudentDetail } from '@/pages/shared/StudentDetail';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  {
    element: <GuestOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Admin
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allow={['admin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboard /> },
              { path: 'fees', element: <AdminFees /> },
              { path: 'fees/create', element: <FeeCreate /> },
              { path: 'fees/:feeId', element: <FeeDetail /> },
              { path: 'attendance', element: <AdminAttendance /> },
              { path: 'staff-leaves', element: <AdminStaffLeaves /> },
              { path: 'announcements', element: <AdminAnnouncements /> },
              { path: 'students', element: <AdminStudents /> },
              { path: 'students/:studentId', element: <StudentDetail /> },
              { path: 'staff', element: <AdminStaff /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'calendar', element: <AdminCalendar /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },

      // Parent / Student portal
      {
        element: <RequireRole allow={['parent', 'student']} />,
        children: [
          {
            path: '/portal',
            element: <PortalLayout />,
            children: [
              { index: true, element: <Navigate to="/portal/dashboard" replace /> },
              { path: 'dashboard', element: <PortalDashboard /> },
              { path: 'announcements', element: <PortalAnnouncements /> },
              { path: 'homework', element: <PortalHomework /> },
              { path: 'activities', element: <PortalActivities /> },
              { path: 'notes', element: <PortalNotes /> },
              { path: 'attendance', element: <PortalAttendance /> },
              { path: 'fees', element: <PortalFees /> },
              { path: 'timetable', element: <PortalTimetable /> },
              { path: 'profile', element: <PortalProfile /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },

      // Staff
      {
        element: <RequireRole allow={['staff']} />,
        children: [
          {
            path: '/staff',
            element: <StaffLayout />,
            children: [
              { index: true, element: <Navigate to="/staff/dashboard" replace /> },
              { path: 'dashboard', element: <StaffDashboard /> },
              { path: 'attendance', element: <StaffAttendance /> },
              { path: 'attendance/:classId', element: <StaffAttendanceClass /> },
              { path: 'notes', element: <StaffNotes /> },
              { path: 'homework', element: <StaffHomework /> },
              { path: 'leaves', element: <StaffLeaves /> },
              { path: 'timetable', element: <StaffTimetable /> },
              { path: 'students', element: <StaffStudents /> },
              { path: 'students/:studentId', element: <StudentDetail /> },
              { path: 'profile', element: <StaffProfile /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
