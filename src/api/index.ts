import type {
  Staff, SalaryRecord, AttendanceRecord,
  ClassInfo, Subject, GradeCourse, TimetableEntry,
  Exam, ExamSession, ExamRoom, Announcement, BusinessMetric, School,
  Student, ExamScore, ScoreSummary, User, LoginResponse,
} from '../types';
import type { CreateInput, UpdateInput } from '../types/api';
import type { CalendarEvent } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== School =====
export const getSchool = () => request<School>('/school');

// ===== Staff =====
export const getStaff = () => request<Staff[]>('/staff');
export const getStaffById = (id: string) => request<Staff>(`/staff/${id}`);
export const createStaff = (data: CreateInput<Staff>) => request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: UpdateInput<Staff>) => request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStaff = (id: string) => request<{ success: boolean }>(`/staff/${id}`, { method: 'DELETE' });

// ===== Salary =====
export const getSalaries = () => request<SalaryRecord[]>('/salary');
export const createSalary = (data: CreateInput<SalaryRecord>) => request<SalaryRecord>('/salary', { method: 'POST', body: JSON.stringify(data) });
export const updateSalary = (id: string, data: UpdateInput<SalaryRecord>) => request<SalaryRecord>(`/salary/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSalary = (id: string) => request<{ success: boolean }>(`/salary/${id}`, { method: 'DELETE' });

// ===== Attendance =====
export const getAttendance = () => request<AttendanceRecord[]>('/attendance');
export const createAttendance = (data: CreateInput<AttendanceRecord>) => request<AttendanceRecord>('/attendance', { method: 'POST', body: JSON.stringify(data) });
export const updateAttendance = (id: string, data: UpdateInput<AttendanceRecord>) => request<AttendanceRecord>(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAttendance = (id: string) => request<{ success: boolean }>(`/attendance/${id}`, { method: 'DELETE' });

// ===== Classes =====
export const getClasses = () => request<ClassInfo[]>('/classes');
export const createClass = (data: CreateInput<ClassInfo>) => request<ClassInfo>('/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: UpdateInput<ClassInfo>) => request<ClassInfo>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClass = (id: string) => request<{ success: boolean }>(`/classes/${id}`, { method: 'DELETE' });

// ===== Subjects =====
export const getSubjects = () => request<Subject[]>('/subjects');
export const createSubject = (data: CreateInput<Subject>) => request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: UpdateInput<Subject>) => request<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubject = (id: string) => request<{ success: boolean }>(`/subjects/${id}`, { method: 'DELETE' });

// ===== Courses =====
export const getCourses = () => request<GradeCourse[]>('/courses');
export const createCourse = (data: CreateInput<GradeCourse>) => request<GradeCourse>('/courses', { method: 'POST', body: JSON.stringify(data) });
export const updateCourse = (id: string, data: UpdateInput<GradeCourse>) => request<GradeCourse>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCourse = (id: string) => request<{ success: boolean }>(`/courses/${id}`, { method: 'DELETE' });

// ===== Timetable =====
export const getTimetable = () => request<TimetableEntry[]>('/timetable');
export const createTimetableEntry = (data: CreateInput<TimetableEntry>) => request<TimetableEntry>('/timetable', { method: 'POST', body: JSON.stringify(data) });
export const updateTimetableEntry = (id: string, data: UpdateInput<TimetableEntry>) => request<TimetableEntry>(`/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTimetableEntry = (id: string) => request<{ success: boolean }>(`/timetable/${id}`, { method: 'DELETE' });

// ===== Exams =====
export const getExams = () => request<Exam[]>('/exams');
export const createExam = (data: CreateInput<Exam>) => request<Exam>('/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: string, data: UpdateInput<Exam>) => request<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExam = (id: string) => request<{ success: boolean }>(`/exams/${id}`, { method: 'DELETE' });

// ===== Exam Sessions =====
export const getExamSessions = (examId?: string) => request<ExamSession[]>(`/exam-sessions${examId ? `?examId=${examId}` : ''}`);
export const createExamSession = (data: CreateInput<ExamSession>) => request<ExamSession>('/exam-sessions', { method: 'POST', body: JSON.stringify(data) });
export const updateExamSession = (id: string, data: UpdateInput<ExamSession>) => request<ExamSession>(`/exam-sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExamSession = (id: string) => request<{ success: boolean }>(`/exam-sessions/${id}`, { method: 'DELETE' });

// ===== Exam Rooms =====
export const getExamRooms = (examId?: string) => request<ExamRoom[]>(`/exam-rooms${examId ? `?examId=${examId}` : ''}`);
export const createExamRoom = (data: CreateInput<ExamRoom>) => request<ExamRoom>('/exam-rooms', { method: 'POST', body: JSON.stringify(data) });
export const updateExamRoom = (id: string, data: UpdateInput<ExamRoom>) => request<ExamRoom>(`/exam-rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExamRoom = (id: string) => request<{ success: boolean }>(`/exam-rooms/${id}`, { method: 'DELETE' });

// ===== Announcements =====
export const getAnnouncements = () => request<Announcement[]>('/announcements');
export const createAnnouncement = (data: CreateInput<Announcement>) => request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: UpdateInput<Announcement>) => request<Announcement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string) => request<{ success: boolean }>(`/announcements/${id}`, { method: 'DELETE' });

// ===== Students =====
export const getStudents = () => request<Student[]>('/students');
export const createStudent = (data: CreateInput<Student>) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: UpdateInput<Student>) => request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStudent = (id: string) => request<{ success: boolean }>(`/students/${id}`, { method: 'DELETE' });

// ===== Calendar =====
export const getCalendarEvents = () => request<CalendarEvent[]>('/calendar');
export const createCalendarEvent = (data: CreateInput<CalendarEvent>) => request<CalendarEvent>('/calendar', { method: 'POST', body: JSON.stringify(data) });
export const updateCalendarEvent = (id: string, data: UpdateInput<CalendarEvent>) => request<CalendarEvent>(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCalendarEvent = (id: string) => request<{ success: boolean }>(`/calendar/${id}`, { method: 'DELETE' });

// ===== Metrics =====
export const getMetrics = () => request<BusinessMetric[]>('/metrics');

// ===== Conflicts =====
export const getTimetableConflicts = () => request<Array<{
  id: string; teacherId: string; teacherName: string;
  dayOfWeek: number; period: number;
  subjectName: string; class1: string; class2: string;
}>>('/timetable/conflicts');

// ===== Search =====
export const globalSearch = (q: string) =>
  request<{ results: Array<{ type: string; id: string; title: string; subtitle: string; url: string }> }>(`/search?q=${encodeURIComponent(q)}`);

// ===== Auth =====
function getToken() { return localStorage.getItem('auth_token'); }

async function authRequest<T>(url: string, options?: RequestInit): Promise<T> {
  return request<T>(url, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${getToken()}` },
  });
}

export const login = (username: string, password: string) =>
  request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getMe = () => authRequest<{ user: User }>('/auth/me');

export const getMyClass = () => authRequest<{ cls: ClassInfo | null }>('/teacher/my-class');

// ===== Scores =====
export const getScores = (params?: { examId?: string; classId?: string; subjectId?: string }) => {
  const qs = new URLSearchParams();
  if (params?.examId) qs.set('examId', params.examId);
  if (params?.classId) qs.set('classId', params.classId);
  if (params?.subjectId) qs.set('subjectId', params.subjectId);
  return request<ExamScore[]>(`/scores?${qs.toString()}`);
};

export const saveScores = (scores: Omit<ExamScore, 'id'>[]) =>
  authRequest<{ success: boolean; count: number }>('/scores', {
    method: 'POST', body: JSON.stringify({ scores }),
  });

export const updateScore = (id: string, score: number) =>
  authRequest<{ success: boolean }>(`/scores/${id}`, {
    method: 'PUT', body: JSON.stringify({ score }),
  });

export const deleteScore = (id: string) =>
  authRequest<{ success: boolean }>(`/scores/${id}`, { method: 'DELETE' });

export const getScoreSummary = (examId: string) =>
  request<ScoreSummary[]>(`/scores/summary?examId=${examId}`);
