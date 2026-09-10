import type {
  Activity,
  Announcement,
  AttendanceRecord,
  FeeStructure,
  Homework,
  LeaveRequest,
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
import { CURRENT_ACADEMIC_YEAR, FEE_CATEGORY_LABELS } from '@/constants';
import { isoOffset, todayIso, uid } from '@/utils';

export interface Database {
  users: User[];
  passwords: Record<string, string>; // userId -> password (prototype only)
  classes: SchoolClass[];
  students: Student[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  feeStructures: FeeStructure[];
  studentFees: StudentFee[];
  payments: Payment[];
  announcements: Announcement[];
  homework: Homework[];
  notes: Note[];
  activities: Activity[];
  timetable: TimetableEntry[];
  leaves: LeaveRequest[];
  notifications: AppNotification[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const color = (i: number) => COLORS[i % COLORS.length];

const FIRST_NAMES = [
  'Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishita', 'Rohan', 'Sara',
  'Kabir', 'Meera', 'Arjun', 'Priya', 'Reyansh', 'Anika', 'Dev', 'Kiara',
  'Neil', 'Riya', 'Ved', 'Tara', 'Om', 'Naina', 'Yash', 'Zoya',
];
const LAST_NAMES = ['Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Khan', 'Mehta'];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];

function makeAttachment(name: string) {
  return { id: uid('att'), name, sizeKb: 120 + Math.floor(Math.random() * 800), type: 'application/pdf' };
}

export function createSeedData(): Database {
  // --- Core accounts ---------------------------------------------------------
  const admin: User = {
    id: 'user_admin',
    name: 'Priya Menon',
    email: 'admin@school.edu',
    username: 'admin',
    role: 'admin',
    avatarColor: color(0),
    department: 'Administration',
  };

  const staffUser1: User = {
    id: 'user_staff1',
    name: 'Rahul Verma',
    email: 'staff@school.edu',
    username: 'rverma',
    role: 'staff',
    avatarColor: color(1),
    staffId: 'staff_1',
    department: 'Science',
  };
  const staffUser2: User = {
    id: 'user_staff2',
    name: 'Sneha Kapoor',
    email: 'skapoor@school.edu',
    username: 'skapoor',
    role: 'staff',
    avatarColor: color(2),
    staffId: 'staff_2',
    department: 'Mathematics',
  };

  const parent1: User = {
    id: 'user_parent1',
    name: 'Anil Sharma',
    email: 'parent@school.edu',
    username: 'asharma',
    role: 'parent',
    avatarColor: color(3),
    studentIds: ['stu_1', 'stu_2'],
  };
  const parent2: User = {
    id: 'user_parent2',
    name: 'Kavita Patel',
    email: 'kpatel@school.edu',
    username: 'kpatel',
    role: 'parent',
    avatarColor: color(4),
    studentIds: ['stu_3'],
  };

  const studentUser: User = {
    id: 'user_student1',
    name: 'Aarav Sharma',
    email: 'student@school.edu',
    username: 'aarav',
    role: 'student',
    avatarColor: color(5),
    studentId: 'stu_1',
  };

  const users = [admin, staffUser1, staffUser2, parent1, parent2, studentUser];
  const passwords: Record<string, string> = {};
  users.forEach((u) => (passwords[u.id] = 'password123'));

  // --- Classes ---------------------------------------------------------------
  const classes: SchoolClass[] = [
    { id: 'cls_5', name: 'Grade 5', sections: ['A', 'B'], classTeacherId: 'staff_1' },
    { id: 'cls_6', name: 'Grade 6', sections: ['A', 'B'], classTeacherId: 'staff_2' },
    { id: 'cls_7', name: 'Grade 7', sections: ['A'], classTeacherId: 'staff_1' },
  ];

  // --- Staff -----------------------------------------------------------------
  const staff: Staff[] = [
    {
      id: 'staff_1',
      name: 'Rahul Verma',
      email: 'staff@school.edu',
      department: 'Science',
      designation: 'Senior Teacher',
      subjects: ['Science', 'Computer Science'],
      assignedClassIds: ['cls_5', 'cls_7'],
      contactPhone: '+1 555 0101',
      joiningDate: '2019-06-01',
      avatarColor: color(1),
      leaveBalance: 18,
    },
    {
      id: 'staff_2',
      name: 'Sneha Kapoor',
      email: 'skapoor@school.edu',
      department: 'Mathematics',
      designation: 'Teacher',
      subjects: ['Mathematics'],
      assignedClassIds: ['cls_6'],
      contactPhone: '+1 555 0102',
      joiningDate: '2021-04-15',
      avatarColor: color(2),
      leaveBalance: 22,
    },
  ];

  // --- Students (20+ across classes) -----------------------------------------
  const students: Student[] = [];
  const namedStudents: Array<Partial<Student> & { id: string; parentId: string }> = [
    { id: 'stu_1', name: 'Aarav Sharma', parentId: 'user_parent1', classId: 'cls_5', section: 'A' },
    { id: 'stu_2', name: 'Diya Sharma', parentId: 'user_parent1', classId: 'cls_6', section: 'A' },
    { id: 'stu_3', name: 'Vivaan Patel', parentId: 'user_parent2', classId: 'cls_5', section: 'B' },
  ];

  let counter = 0;
  const pushStudent = (partial: Partial<Student> & { id: string; parentId: string }) => {
    const idx = counter++;
    const classId = partial.classId ?? classes[idx % classes.length].id;
    const cls = classes.find((c) => c.id === classId)!;
    const section = partial.section ?? cls.sections[idx % cls.sections.length];
    const name =
      partial.name ?? `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${LAST_NAMES[idx % LAST_NAMES.length]}`;
    students.push({
      id: partial.id,
      name,
      rollNumber: `${cls.name.replace('Grade ', 'G')}-${String(idx + 1).padStart(2, '0')}`,
      classId,
      section,
      parentId: partial.parentId,
      gender: idx % 2 === 0 ? 'male' : 'female',
      dateOfBirth: `2014-0${(idx % 9) + 1}-15`,
      avatarColor: color(idx),
      guardianName: partial.parentId === 'user_parent1' ? 'Anil Sharma' : 'Kavita Patel',
      contactPhone: `+1 555 0${200 + idx}`,
      admissionDate: '2022-04-01',
    });
  };

  namedStudents.forEach(pushStudent);
  // Fill up to 22 students total, alternating parents.
  for (let i = students.length; i < 22; i++) {
    pushStudent({ id: `stu_${i + 1}`, parentId: i % 2 === 0 ? 'user_parent1' : 'user_parent2' });
  }

  // --- Attendance (multiple dates) -------------------------------------------
  const attendance: AttendanceRecord[] = [];
  const statuses: AttendanceRecord['status'][] = ['present', 'present', 'present', 'late', 'absent', 'leave'];
  for (let d = 0; d < 10; d++) {
    const date = isoOffset(-d);
    students.forEach((s, i) => {
      attendance.push({
        id: uid('att'),
        studentId: s.id,
        classId: s.classId,
        section: s.section,
        date,
        status: statuses[(i + d) % statuses.length],
        submitted: true,
        markedBy: 'staff_1',
      });
    });
  }

  // --- Fee structures --------------------------------------------------------
  const feeStructures: FeeStructure[] = [
    {
      id: 'fee_tuition',
      name: 'Annual Tuition Fee',
      description: 'Core tuition fee for the academic year.',
      category: 'tuition',
      amount: 4000,
      dueDate: isoOffset(15),
      academicYear: CURRENT_ACADEMIC_YEAR,
      term: 'Term 1',
      classId: 'all',
      section: 'all',
      lateFeePerDay: 5,
      status: 'active',
      createdAt: isoOffset(-40),
    },
    {
      id: 'fee_transport',
      name: 'Transportation Fee',
      description: 'Bus service for the academic year.',
      category: 'transportation',
      amount: 1200,
      dueDate: isoOffset(-5),
      academicYear: CURRENT_ACADEMIC_YEAR,
      term: 'Term 1',
      classId: 'all',
      section: 'all',
      lateFeePerDay: 2,
      status: 'active',
      createdAt: isoOffset(-40),
    },
    {
      id: 'fee_exam',
      name: 'Examination Fee',
      description: 'Term examination charges.',
      category: 'examination',
      amount: 300,
      dueDate: isoOffset(30),
      academicYear: CURRENT_ACADEMIC_YEAR,
      term: 'Term 1',
      classId: 'cls_5',
      section: 'all',
      status: 'active',
      createdAt: isoOffset(-20),
    },
    {
      id: 'fee_lab',
      name: 'Laboratory Fee',
      description: 'Science laboratory usage fee.',
      category: 'laboratory',
      amount: 500,
      dueDate: isoOffset(-15),
      academicYear: CURRENT_ACADEMIC_YEAR,
      term: 'Term 1',
      classId: 'cls_7',
      section: 'all',
      status: 'active',
      createdAt: isoOffset(-30),
    },
  ];

  // --- Student fees + payments -----------------------------------------------
  const studentFees: StudentFee[] = [];
  const payments: Payment[] = [];
  students.forEach((s, i) => {
    feeStructures.forEach((fs) => {
      const applies =
        (fs.classId === 'all' || fs.classId === s.classId) &&
        (fs.section === 'all' || fs.section === s.section);
      if (!applies) return;

      const mod = i % 4;
      let amountPaid = 0;
      let status: StudentFee['status'] = 'unpaid';
      const overdue = fs.dueDate < todayIso();
      if (mod === 0) {
        amountPaid = fs.amount;
        status = 'paid';
      } else if (mod === 1) {
        amountPaid = Math.round(fs.amount * 0.5);
        status = 'partial';
      } else if (mod === 2) {
        amountPaid = 0;
        status = overdue ? 'overdue' : 'unpaid';
      } else {
        amountPaid = fs.amount; // waived represented as fully cleared
        status = 'paid';
      }

      const feeId = uid('sf');
      studentFees.push({
        id: feeId,
        studentId: s.id,
        feeStructureId: fs.id,
        amount: fs.amount,
        amountPaid,
        dueDate: fs.dueDate,
        status,
        category: fs.category,
        academicYear: fs.academicYear,
      });

      if (amountPaid > 0) {
        payments.push({
          id: uid('pay'),
          studentFeeId: feeId,
          studentId: s.id,
          amount: amountPaid,
          method: (['cash', 'card', 'online', 'cheque'] as const)[i % 4],
          date: isoOffset(-(i % 20)),
          reference: `RCPT-${1000 + payments.length}`,
          recordedBy: 'user_admin',
        });
      }
    });
  });

  // --- Announcements ---------------------------------------------------------
  const announcements: Announcement[] = [
    {
      id: uid('ann'),
      title: 'Annual Sports Day Scheduled',
      body: 'The Annual Sports Day will be held on the school grounds. All students are encouraged to participate. Parents are welcome to attend and cheer for their children.',
      category: 'event',
      priority: 'high',
      pinned: true,
      publishedAt: isoOffset(-2),
      author: 'Priya Menon',
      audience: ['admin', 'staff', 'parent', 'student'],
      attachments: [makeAttachment('sports-day-schedule.pdf')],
      readBy: [],
    },
    {
      id: uid('ann'),
      title: 'Term 1 Examination Timetable Released',
      body: 'The examination timetable for Term 1 is now available. Please review the subject-wise schedule and prepare accordingly.',
      category: 'examination',
      priority: 'high',
      pinned: true,
      publishedAt: isoOffset(-4),
      author: 'Priya Menon',
      audience: ['parent', 'student', 'staff'],
      attachments: [makeAttachment('term1-exam-timetable.pdf')],
      readBy: [],
    },
    {
      id: uid('ann'),
      title: 'School Closed for Founders Day',
      body: 'The school will remain closed in observance of Founders Day. Regular classes will resume the following working day.',
      category: 'holiday',
      priority: 'normal',
      pinned: false,
      publishedAt: isoOffset(-6),
      author: 'Administration',
      audience: ['admin', 'staff', 'parent', 'student'],
      attachments: [],
      readBy: [],
    },
    {
      id: uid('ann'),
      title: 'Parent-Teacher Meeting',
      body: 'A parent-teacher meeting is scheduled to discuss student progress. Slot booking details will be shared shortly.',
      category: 'academic',
      priority: 'normal',
      pinned: false,
      publishedAt: isoOffset(-8),
      author: 'Rahul Verma',
      audience: ['parent'],
      attachments: [],
      readBy: [],
    },
  ];

  // --- Homework --------------------------------------------------------------
  const homework: Homework[] = SUBJECTS.slice(0, 4).map((subject, i) => ({
    id: uid('hw'),
    title: `${subject} Assignment ${i + 1}`,
    subject,
    classId: 'cls_5',
    section: 'A',
    instructions: `Complete the exercises for ${subject}. Show all working and submit neatly.`,
    assignedDate: isoOffset(-(i + 1)),
    dueDate: isoOffset(3 - i),
    attachments: i % 2 === 0 ? [makeAttachment(`${subject.toLowerCase()}-worksheet.pdf`)] : [],
    completedBy: i === 0 ? ['stu_1'] : [],
  }));

  // --- Notes -----------------------------------------------------------------
  const notes: Note[] = SUBJECTS.slice(0, 3).map((subject, i) => ({
    id: uid('note'),
    title: `${subject} - Chapter ${i + 1} Notes`,
    subject,
    classId: 'cls_5',
    section: 'A',
    description: `Detailed classwork summary covering the key concepts of ${subject} chapter ${i + 1}.`,
    objectives: `Understand core ${subject} concepts and apply them to problems.`,
    date: isoOffset(-i),
    status: 'published',
    authorId: 'staff_1',
    authorName: 'Rahul Verma',
    attachments: [makeAttachment(`${subject.toLowerCase()}-notes.pdf`)],
    reviewedBy: [],
  }));

  // --- Activities ------------------------------------------------------------
  const activities: Activity[] = [
    { id: uid('act'), title: 'Mathematics Class Test', type: 'test', date: isoOffset(1), startTime: '09:00', endTime: '10:00', description: 'Chapter 1-2 test', classId: 'cls_5', section: 'A' },
    { id: uid('act'), title: 'Science Project Submission', type: 'assignment', date: isoOffset(2), description: 'Submit working models', classId: 'cls_5', section: 'A' },
    { id: uid('act'), title: 'Inter-house Football Match', type: 'sports', date: isoOffset(3), startTime: '14:00', endTime: '16:00', description: 'Sports ground' },
    { id: uid('act'), title: 'Robotics Club Meetup', type: 'club', date: isoOffset(4), startTime: '15:00', endTime: '16:00', description: 'Lab 2' },
    { id: uid('act'), title: 'Founders Day Holiday', type: 'holiday', date: isoOffset(5), description: 'School closed' },
    { id: uid('act'), title: 'Annual Day Rehearsal', type: 'special', date: isoOffset(6), description: 'Auditorium' },
    { id: uid('act'), title: 'English Reading Session', type: 'class', date: todayIso(), startTime: '11:00', endTime: '12:00', description: 'Library', classId: 'cls_5', section: 'A' },
  ];

  // --- Timetable -------------------------------------------------------------
  const timetable: TimetableEntry[] = [];
  const days: TimetableEntry['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const periods = [
    { period: 1, startTime: '08:00', endTime: '08:45' },
    { period: 2, startTime: '08:45', endTime: '09:30' },
    { period: 3, startTime: '09:45', endTime: '10:30' },
    { period: 4, startTime: '10:30', endTime: '11:15' },
  ];
  days.forEach((day, di) => {
    periods.forEach((p, pi) => {
      timetable.push({
        id: uid('tt'),
        classId: 'cls_5',
        section: 'A',
        day,
        period: p.period,
        startTime: p.startTime,
        endTime: p.endTime,
        subject: SUBJECTS[(di + pi) % SUBJECTS.length],
        staffId: (di + pi) % 2 === 0 ? 'staff_1' : 'staff_2',
      });
    });
  });

  // --- Leave requests --------------------------------------------------------
  const leaves: LeaveRequest[] = [
    {
      id: uid('lv'),
      staffId: 'staff_1',
      staffName: 'Rahul Verma',
      department: 'Science',
      type: 'casual',
      startDate: isoOffset(7),
      endDate: isoOffset(8),
      reason: 'Family function to attend.',
      status: 'pending',
      appliedAt: isoOffset(-1),
      attachments: [],
    },
    {
      id: uid('lv'),
      staffId: 'staff_2',
      staffName: 'Sneha Kapoor',
      department: 'Mathematics',
      type: 'sick',
      startDate: isoOffset(-3),
      endDate: isoOffset(-2),
      reason: 'Fever and rest advised by doctor.',
      status: 'approved',
      appliedAt: isoOffset(-5),
      reviewedBy: 'Priya Menon',
      reviewComment: 'Approved. Get well soon.',
      attachments: [makeAttachment('medical-certificate.pdf')],
    },
    {
      id: uid('lv'),
      staffId: 'staff_1',
      staffName: 'Rahul Verma',
      department: 'Science',
      type: 'earned',
      startDate: isoOffset(-10),
      endDate: isoOffset(-9),
      reason: 'Personal work.',
      status: 'rejected',
      appliedAt: isoOffset(-12),
      reviewedBy: 'Priya Menon',
      reviewComment: 'Insufficient staffing on requested dates.',
      attachments: [],
    },
  ];

  // --- Notifications ---------------------------------------------------------
  const notifications: AppNotification[] = [
    { id: uid('ntf'), userId: 'user_admin', title: 'New leave request', message: 'Rahul Verma applied for casual leave.', createdAt: isoOffset(-1), read: false, type: 'info', link: '/admin/staff-leaves' },
    { id: uid('ntf'), userId: 'user_parent1', title: 'Fee due soon', message: 'Tuition fee is due in 15 days.', createdAt: isoOffset(-1), read: false, type: 'warning', link: '/portal/fees' },
    { id: uid('ntf'), userId: 'user_student1', title: 'New homework', message: 'Mathematics Assignment 1 has been assigned.', createdAt: isoOffset(-1), read: false, type: 'info', link: '/portal/homework' },
    { id: uid('ntf'), userId: 'user_staff1', title: 'Attendance reminder', message: 'Please submit today\'s attendance for Grade 5 A.', createdAt: todayIso(), read: false, type: 'warning', link: '/staff/attendance' },
  ];

  return {
    users,
    passwords,
    classes,
    students,
    staff,
    attendance,
    feeStructures,
    studentFees,
    payments,
    announcements,
    homework,
    notes,
    activities,
    timetable,
    leaves,
    notifications,
  };
}

// Referenced to keep the label map import meaningful for future category grouping.
export const FEE_CATEGORY_KEYS = Object.keys(FEE_CATEGORY_LABELS);
