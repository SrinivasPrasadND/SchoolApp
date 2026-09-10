import { baseApi } from './baseApi';
import type {
  Activity,
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  DashboardMetrics,
  FeeStructure,
  Homework,
  LeaveRequest,
  LeaveStatus,
  LoginRequest,
  LoginResponse,
  Note,
  AppNotification,
  Payment,
  SchoolClass,
  Staff,
  Student,
  StudentFee,
  TimetableEntry,
  User,
} from '@/types';

interface AttendanceSubmission {
  classId: string;
  section: string;
  date: string;
  submitted: boolean;
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}

export interface ParentAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'parent';
  studentIds: string[];
}

export const api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Auth ----------------------------------------------------------------
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    resetDemoData: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/system/reset', method: 'POST' }),
      invalidatesTags: [
        'Student', 'Staff', 'Class', 'Attendance', 'FeeStructure', 'StudentFee',
        'Payment', 'Announcement', 'Homework', 'Note', 'Activity', 'Timetable',
        'Leave', 'Notification', 'Dashboard',
      ],
    }),

    // --- Catalog -------------------------------------------------------------
    getClasses: builder.query<SchoolClass[], void>({
      query: () => '/classes',
      providesTags: ['Class'],
    }),
    getStudents: builder.query<Student[], { classId?: string; section?: string; search?: string } | void>({
      query: (params) => ({ url: '/students', params: params ?? undefined }),
      providesTags: ['Student'],
    }),
    getStudent: builder.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: ['Student'],
    }),
    getParent: builder.query<{ id: string; name: string; email: string; username: string }, string>({
      query: (id) => `/parents/${id}`,
      providesTags: ['Student'],
    }),
    getParents: builder.query<ParentAccount[], void>({
      query: () => '/parents',
      providesTags: ['Parent'],
    }),
    createStudent: builder.mutation<Student, Partial<Student>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student', 'Parent', 'StudentFee', 'Dashboard'],
    }),
    updateStudent: builder.mutation<Student, { id: string; body: Partial<Student> }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Student', 'Parent'],
    }),
    deleteStudent: builder.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Student', 'Parent', 'StudentFee', 'Payment', 'Attendance', 'Dashboard'],
    }),
    createParent: builder.mutation<ParentAccount, { name: string; email: string; username?: string }>({
      query: (body) => ({ url: '/parents', method: 'POST', body }),
      invalidatesTags: ['Parent'],
    }),
    updateParent: builder.mutation<ParentAccount, { id: string; body: Partial<ParentAccount> }>({
      query: ({ id, body }) => ({ url: `/parents/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Parent'],
    }),
    deleteParent: builder.mutation<void, string>({
      query: (id) => ({ url: `/parents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Parent'],
    }),
    createStaff: builder.mutation<Staff, Partial<Staff>>({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      invalidatesTags: ['Staff', 'Dashboard'],
    }),
    updateStaff: builder.mutation<Staff, { id: string; body: Partial<Staff> }>({
      query: ({ id, body }) => ({ url: `/staff/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Staff'],
    }),
    deleteStaff: builder.mutation<void, string>({
      query: (id) => ({ url: `/staff/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff', 'Dashboard'],
    }),
    getStaff: builder.query<Staff[], void>({
      query: () => '/staff',
      providesTags: ['Staff'],
    }),    getTimetable: builder.query<TimetableEntry[], { classId?: string; staffId?: string } | void>({
      query: (params) => ({ url: '/timetable', params: params ?? undefined }),
      providesTags: ['Timetable'],
    }),

    // --- Attendance ----------------------------------------------------------
    getAttendance: builder.query<
      AttendanceRecord[],
      { classId?: string; section?: string; date?: string; studentId?: string } | void
    >({
      query: (params) => ({ url: '/attendance', params: params ?? undefined }),
      providesTags: ['Attendance'],
    }),
    submitAttendance: builder.mutation<AttendanceRecord[], AttendanceSubmission>({
      query: (body) => ({ url: '/attendance', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),

    // --- Fees ----------------------------------------------------------------
    getFeeStructures: builder.query<FeeStructure[], void>({
      query: () => '/fee-structures',
      providesTags: ['FeeStructure'],
    }),
    getFeeStructure: builder.query<FeeStructure, string>({
      query: (id) => `/fee-structures/${id}`,
      providesTags: ['FeeStructure'],
    }),
    createFeeStructure: builder.mutation<FeeStructure, Partial<FeeStructure>>({
      query: (body) => ({ url: '/fee-structures', method: 'POST', body }),
      invalidatesTags: ['FeeStructure', 'StudentFee', 'Dashboard'],
    }),
    updateFeeStructure: builder.mutation<FeeStructure, { id: string; body: Partial<FeeStructure> }>({
      query: ({ id, body }) => ({ url: `/fee-structures/${id}`, method: 'PUT', body }),
      invalidatesTags: ['FeeStructure', 'Dashboard'],
    }),
    archiveFeeStructure: builder.mutation<void, string>({
      query: (id) => ({ url: `/fee-structures/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FeeStructure', 'Dashboard'],
    }),
    getStudentFees: builder.query<
      StudentFee[],
      { studentId?: string; status?: string; category?: string } | void
    >({
      query: (params) => ({ url: '/student-fees', params: params ?? undefined }),
      providesTags: ['StudentFee'],
    }),
    getPayments: builder.query<Payment[], { studentId?: string } | void>({
      query: (params) => ({ url: '/payments', params: params ?? undefined }),
      providesTags: ['Payment'],
    }),
    recordPayment: builder.mutation<
      { payment: Payment; fee: StudentFee },
      { studentFeeId: string; amount: number; method?: Payment['method'] }
    >({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payment', 'StudentFee', 'Dashboard'],
    }),

    // --- Announcements -------------------------------------------------------
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => '/announcements',
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation<Announcement, Partial<Announcement>>({
      query: (body) => ({ url: '/announcements', method: 'POST', body }),
      invalidatesTags: ['Announcement'],
    }),
    markAnnouncementRead: builder.mutation<Announcement, string>({
      query: (id) => ({ url: `/announcements/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Announcement'],
    }),

    // --- Homework ------------------------------------------------------------
    getHomework: builder.query<Homework[], { subject?: string; studentId?: string } | void>({
      query: (params) => ({ url: '/homework', params: params ?? undefined }),
      providesTags: ['Homework'],
    }),
    createHomework: builder.mutation<Homework, Partial<Homework>>({
      query: (body) => ({ url: '/homework', method: 'POST', body }),
      invalidatesTags: ['Homework'],
    }),
    toggleHomeworkComplete: builder.mutation<Homework, string>({
      query: (id) => ({ url: `/homework/${id}/complete`, method: 'POST' }),
      invalidatesTags: ['Homework'],
    }),

    // --- Notes ---------------------------------------------------------------
    getNotes: builder.query<Note[], { subject?: string; search?: string; studentId?: string } | void>({
      query: (params) => ({ url: '/notes', params: params ?? undefined }),
      providesTags: ['Note'],
    }),
    createNote: builder.mutation<Note, Partial<Note>>({
      query: (body) => ({ url: '/notes', method: 'POST', body }),
      invalidatesTags: ['Note'],
    }),
    updateNote: builder.mutation<Note, { id: string; body: Partial<Note> }>({
      query: ({ id, body }) => ({ url: `/notes/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Note'],
    }),
    deleteNote: builder.mutation<void, string>({
      query: (id) => ({ url: `/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Note'],
    }),
    markNoteReviewed: builder.mutation<Note, string>({
      query: (id) => ({ url: `/notes/${id}/review`, method: 'POST' }),
      invalidatesTags: ['Note'],
    }),

    // --- Activities ----------------------------------------------------------
    getActivities: builder.query<Activity[], { date?: string } | void>({
      query: (params) => ({ url: '/activities', params: params ?? undefined }),
      providesTags: ['Activity'],
    }),

    // --- Leaves --------------------------------------------------------------
    getLeaves: builder.query<
      LeaveRequest[],
      { status?: string; type?: string; staffId?: string } | void
    >({
      query: (params) => ({ url: '/leaves', params: params ?? undefined }),
      providesTags: ['Leave'],
    }),
    applyLeave: builder.mutation<LeaveRequest, Partial<LeaveRequest>>({
      query: (body) => ({ url: '/leaves', method: 'POST', body }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
    updateLeaveStatus: builder.mutation<
      LeaveRequest,
      { id: string; status: LeaveStatus; reviewComment?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/leaves/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Leave', 'Staff', 'Dashboard'],
    }),

    // --- Notifications -------------------------------------------------------
    getNotifications: builder.query<AppNotification[], void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    // --- Dashboard -----------------------------------------------------------
    getAdminDashboard: builder.query<DashboardMetrics, void>({
      query: () => '/dashboard/admin',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useResetDemoDataMutation,
  useGetClassesQuery,
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetParentQuery,
  useGetParentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetStaffQuery,
  useGetTimetableQuery,
  useGetAttendanceQuery,
  useSubmitAttendanceMutation,
  useGetFeeStructuresQuery,
  useGetFeeStructureQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useArchiveFeeStructureMutation,
  useGetStudentFeesQuery,
  useGetPaymentsQuery,
  useRecordPaymentMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useGetHomeworkQuery,
  useCreateHomeworkMutation,
  useToggleHomeworkCompleteMutation,
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useMarkNoteReviewedMutation,
  useGetActivitiesQuery,
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAdminDashboardQuery,
} = api;
