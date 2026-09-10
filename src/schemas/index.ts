import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().optional(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const feeStructureSchema = z
  .object({
    name: z.string().min(3, 'Fee name must be at least 3 characters.'),
    description: z.string().max(300, 'Description is too long.').optional().default(''),
    category: z.enum([
      'tuition',
      'transportation',
      'examination',
      'library',
      'laboratory',
      'activity',
      'admission',
      'miscellaneous',
    ]),
    amount: z.coerce.number().positive('Amount must be greater than zero.'),
    dueDate: z.string().min(1, 'Due date is required.'),
    academicYear: z.string().min(1, 'Academic year is required.'),
    term: z.string().min(1, 'Term is required.'),
    classId: z.string().min(1, 'Class is required.'),
    section: z.string().min(1, 'Section is required.'),
    lateFeePerDay: z.coerce.number().min(0, 'Late fee cannot be negative.').optional(),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(new Date().toDateString()), {
    message: 'Due date cannot be in the past.',
    path: ['dueDate'],
  });
export type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

export const leaveSchema = z
  .object({
    type: z.enum(['sick', 'casual', 'earned', 'maternity', 'unpaid']),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    reason: z.string().min(10, 'Reason must be at least 10 characters.').max(500, 'Reason is too long.'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date.',
    path: ['endDate'],
  });
export type LeaveFormValues = z.infer<typeof leaveSchema>;

export const noteSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  subject: z.string().min(1, 'Subject is required.'),
  classId: z.string().min(1, 'Class is required.'),
  section: z.string().min(1, 'Section is required.'),
  date: z.string().min(1, 'Date is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  objectives: z.string().max(300, 'Objectives are too long.').optional().default(''),
});
export type NoteFormValues = z.infer<typeof noteSchema>;

export const homeworkSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters.'),
    subject: z.string().min(1, 'Subject is required.'),
    classId: z.string().min(1, 'Class is required.'),
    section: z.string().min(1, 'Section is required.'),
    instructions: z.string().min(5, 'Instructions must be at least 5 characters.'),
    assignedDate: z.string().min(1, 'Assigned date is required.'),
    dueDate: z.string().min(1, 'Due date is required.'),
  })
  .refine((data) => data.dueDate >= data.assignedDate, {
    message: 'Due date cannot be before the assigned date.',
    path: ['dueDate'],
  });
export type HomeworkFormValues = z.infer<typeof homeworkSchema>;

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  body: z.string().min(10, 'Message must be at least 10 characters.'),
  category: z.enum(['general', 'academic', 'examination', 'holiday', 'event', 'emergency']),
  priority: z.enum(['low', 'normal', 'high']),
  pinned: z.boolean().default(false),
});
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  method: z.enum(['cash', 'card', 'online', 'cheque']),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const studentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  rollNumber: z.string().min(1, 'Roll number is required.'),
  classId: z.string().min(1, 'Class is required.'),
  section: z.string().min(1, 'Section is required.'),
  parentId: z.string().min(1, 'Parent is required.'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required.'),
  guardianName: z.string().min(3, 'Guardian name must be at least 3 characters.'),
  contactPhone: z.string().min(5, 'A valid contact number is required.'),
  admissionDate: z.string().min(1, 'Admission date is required.'),
});
export type StudentFormValues = z.infer<typeof studentSchema>;

export const parentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email('Enter a valid email address.'),
  username: z.string().optional(),
});
export type ParentFormValues = z.infer<typeof parentSchema>;

export const staffSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email('Enter a valid email address.'),
  department: z.string().min(1, 'Department is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  subjects: z.string().min(1, 'Enter at least one subject (comma separated).'),
  contactPhone: z.string().min(5, 'A valid contact number is required.'),
  joiningDate: z.string().min(1, 'Joining date is required.'),
  leaveBalance: z.coerce.number().min(0, 'Leave balance cannot be negative.'),
});
export type StaffFormValues = z.infer<typeof staffSchema>;
