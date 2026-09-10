import type {
  ActivityType,
  AnnouncementCategory,
  AttendanceStatus,
  FeeCategory,
  LeaveStatus,
  LeaveType,
  PaymentStatus,
  UserRole,
} from '@/types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'School Management App';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const STORAGE_KEYS = {
  session: 'sm.session',
  db: 'sm.db',
  uiPrefs: 'sm.ui',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  staff: 'Staff / Faculty',
  parent: 'Parent',
  student: 'Student',
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  staff: '/staff/dashboard',
  parent: '/portal/dashboard',
  student: '/portal/dashboard',
};

export const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
  tuition: 'Tuition Fee',
  transportation: 'Transportation Fee',
  examination: 'Examination Fee',
  library: 'Library Fee',
  laboratory: 'Laboratory Fee',
  activity: 'Activity Fee',
  admission: 'Admission Fee',
  miscellaneous: 'Miscellaneous Fee',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partially Paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
  waived: 'Waived',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  leave: 'On Leave',
};

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  general: 'General',
  academic: 'Academic',
  examination: 'Examination',
  holiday: 'Holiday',
  event: 'Event',
  emergency: 'Emergency',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  class: 'Classroom Activity',
  event: 'School Event',
  test: 'Test',
  assignment: 'Assignment',
  sports: 'Sports',
  club: 'Club Activity',
  holiday: 'Holiday',
  special: 'Special Event',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  earned: 'Earned Leave',
  maternity: 'Maternity Leave',
  unpaid: 'Unpaid Leave',
};

export const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
export const CURRENT_ACADEMIC_YEAR = '2026-2027';
export const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export const DEMO_CREDENTIALS = [
  { role: 'Administrator', identifier: 'admin@school.edu', password: 'password123' },
  { role: 'Staff / Faculty', identifier: 'staff@school.edu', password: 'password123' },
  { role: 'Parent', identifier: 'parent@school.edu', password: 'password123' },
  { role: 'Student', identifier: 'student@school.edu', password: 'password123' },
];
