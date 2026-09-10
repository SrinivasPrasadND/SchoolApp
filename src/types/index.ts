// Shared domain types for the School Management Application.
// These interfaces model both API request/response contracts and client state.

export type UserRole = 'admin' | 'staff' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatarColor: string;
  // For parents: linked student ids. For students: their own studentId.
  studentIds?: string[];
  studentId?: string;
  // For staff members
  staffId?: string;
  department?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  issuedAt: number;
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Grade 5"
  sections: string[]; // e.g. ["A", "B"]
  classTeacherId?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  section: string;
  parentId: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  avatarColor: string;
  guardianName: string;
  contactPhone: string;
  admissionDate: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  subjects: string[];
  assignedClassIds: string[];
  contactPhone: string;
  joiningDate: string;
  avatarColor: string;
  leaveBalance: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  section: string;
  date: string; // ISO date (yyyy-mm-dd)
  status: AttendanceStatus;
  remarks?: string;
  submitted: boolean;
  markedBy: string;
}

export type FeeCategory =
  | 'tuition'
  | 'transportation'
  | 'examination'
  | 'library'
  | 'laboratory'
  | 'activity'
  | 'admission'
  | 'miscellaneous';

export type FeeStructureStatus = 'active' | 'archived';

export interface FeeStructure {
  id: string;
  name: string;
  description: string;
  category: FeeCategory;
  amount: number;
  dueDate: string;
  academicYear: string;
  term: string;
  classId: string | 'all';
  section: string | 'all';
  lateFeePerDay?: number;
  status: FeeStructureStatus;
  createdAt: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'waived';

export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: PaymentStatus;
  category: FeeCategory;
  academicYear: string;
}

export interface Payment {
  id: string;
  studentFeeId: string;
  studentId: string;
  amount: number;
  method: 'cash' | 'card' | 'online' | 'cheque';
  date: string;
  reference: string;
  recordedBy: string;
}

export type AnnouncementCategory =
  | 'general'
  | 'academic'
  | 'examination'
  | 'holiday'
  | 'event'
  | 'emergency';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: 'low' | 'normal' | 'high';
  pinned: boolean;
  publishedAt: string;
  author: string;
  audience: UserRole[];
  attachments: MockAttachment[];
  readBy: string[];
}

export interface MockAttachment {
  id: string;
  name: string;
  sizeKb: number;
  type: string;
}

export type HomeworkStatus = 'pending' | 'completed';

export interface Homework {
  id: string;
  title: string;
  subject: string;
  classId: string;
  section: string;
  instructions: string;
  assignedDate: string;
  dueDate: string;
  attachments: MockAttachment[];
  completedBy: string[]; // student ids
}

export type NoteStatus = 'draft' | 'published';

export interface Note {
  id: string;
  title: string;
  subject: string;
  classId: string;
  section: string;
  description: string;
  objectives: string;
  date: string;
  status: NoteStatus;
  authorId: string;
  authorName: string;
  attachments: MockAttachment[];
  reviewedBy: string[]; // student ids
}

export type ActivityType =
  | 'class'
  | 'event'
  | 'test'
  | 'assignment'
  | 'sports'
  | 'club'
  | 'holiday'
  | 'special';

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  date: string;
  startTime?: string;
  endTime?: string;
  description: string;
  classId?: string;
  section?: string;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  section: string;
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  staffId: string;
}

export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type LeaveType = 'sick' | 'casual' | 'earned' | 'maternity' | 'unpaid';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewComment?: string;
  attachments: MockAttachment[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  studentAttendanceToday: number;
  staffOnLeaveToday: number;
  pendingApprovals: number;
  fees: {
    expected: number;
    collected: number;
    outstanding: number;
    overdue: number;
    collectionPercentage: number;
    fullyPaidStudents: number;
    partiallyPaidStudents: number;
    unpaidStudents: number;
  };
  monthlyCollection: { month: string; collected: number; expected: number }[];
  collectionByClass: { className: string; collected: number; outstanding: number }[];
  collectionByCategory: { category: string; amount: number }[];
  paidVsPending: { name: string; value: number }[];
  upcomingDueDates: { name: string; dueDate: string; amount: number }[];
  recentPayments: Payment[];
}

// Generic API error contract used across mock endpoints.
export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
