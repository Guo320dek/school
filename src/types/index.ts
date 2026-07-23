// ===== 学校 =====
export interface School {
  id: string;
  name: string;
  region: string;
  type: '公立' | '私立';
  level: '高中';
  contact: string;
  phone: string;
  address: string;
  studentCount: number;
  staffCount: number;
}

// ===== 职工 =====
export interface Staff {
  id: string;
  name: string;
  staffNo: string;
  department: string;
  position: string;
  title: string;
  education: string;
  major: string;
  phone: string;
  hireDate: string;
  contractStart: string;
  contractEnd: string;
  status: '在职' | '离职' | '退休';
  remark: string;
}

// ===== 工资 =====
export interface SalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  year: number;
  month: number;
  basePay: number;
  bonus: number;
  deduction: number;
  total: number;
  status: '待发放' | '已发放';
  paidDate?: string;
}

// ===== 考勤 =====
export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: '正常' | '迟到' | '早退' | '缺勤' | '请假';
  remark: string;
}

// ===== 班级 =====
export type GradeLevel = '高一' | '高二' | '高三';
export type SubjectTrack = '物化生' | '物化地' | '物生政' | '史地政' | '史政生' | '物化政';

export interface ClassInfo {
  id: string;
  grade: GradeLevel;
  name: string;
  track: SubjectTrack;
  homeroomTeacher: string;
  room: string;
  studentCount: number;
  maxStudents: number;
  status: '在读' | '毕业';
  graduateYear?: number;
}

// ===== 课程 =====
export interface Subject {
  id: string;
  name: string;
  category: '主科' | '选考' | '学考' | '艺体' | '其他';
}

export interface GradeCourse {
  id: string;
  grade: GradeLevel;
  subjectId: string;
  subjectName: string;
  weeklyHours: number;
  teacherId: string;
  teacherName: string;
}

// ===== 课表 =====
export interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  dayOfWeek: number;
  period: number;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

// ===== 考试 =====
export type ExamType = '月考' | '期中' | '期末' | '一模' | '二模' | '三模';

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  grade: GradeLevel;
  startDate: string;
  endDate: string;
}

export interface ExamSession {
  id: string;
  examId: string;
  date: string;
  timeSlot: '上午' | '下午';
  subjectId: string;
  subjectName: string;
  duration: number;
}

export interface ExamRoom {
  id: string;
  examId: string;
  room: string;
  capacity: number;
  invigilator1: string;
  invigilator2: string;
}

// ===== 通知公告 =====
export type AnnounceTarget = '全体' | '高一' | '高二' | '高三';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: '普通' | '重要' | '紧急';
  target: AnnounceTarget;
  expireDate: string;
  isExpired: boolean;
}

// ===== 业务指标 =====
export interface BusinessMetric {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}
