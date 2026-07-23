import type {
  Staff, SalaryRecord, AttendanceRecord,
  ClassInfo, Subject, GradeCourse, TimetableEntry,
  Exam, ExamSession, ExamRoom, Announcement, BusinessMetric, School,
} from '../types';

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
export const createStaff = (data: Omit<Staff, 'id'> & { id: string }) => request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: Partial<Staff>) => request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStaff = (id: string) => request<{ success: boolean }>(`/staff/${id}`, { method: 'DELETE' });

// ===== Salary =====
export const getSalaries = () => request<SalaryRecord[]>('/salary');
export const createSalary = (data: Omit<SalaryRecord, 'id'> & { id: string }) => request<SalaryRecord>('/salary', { method: 'POST', body: JSON.stringify(data) });
export const updateSalary = (id: string, data: Partial<SalaryRecord>) => request<SalaryRecord>(`/salary/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSalary = (id: string) => request<{ success: boolean }>(`/salary/${id}`, { method: 'DELETE' });

// ===== Attendance =====
export const getAttendance = () => request<AttendanceRecord[]>('/attendance');
export const createAttendance = (data: Omit<AttendanceRecord, 'id'> & { id: string }) => request<AttendanceRecord>('/attendance', { method: 'POST', body: JSON.stringify(data) });
export const updateAttendance = (id: string, data: Partial<AttendanceRecord>) => request<AttendanceRecord>(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAttendance = (id: string) => request<{ success: boolean }>(`/attendance/${id}`, { method: 'DELETE' });

// ===== Classes =====
export const getClasses = () => request<ClassInfo[]>('/classes');
export const createClass = (data: Omit<ClassInfo, 'id'> & { id: string }) => request<ClassInfo>('/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: Partial<ClassInfo>) => request<ClassInfo>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClass = (id: string) => request<{ success: boolean }>(`/classes/${id}`, { method: 'DELETE' });

// ===== Subjects =====
export const getSubjects = () => request<Subject[]>('/subjects');
export const createSubject = (data: Omit<Subject, 'id'> & { id: string }) => request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: Partial<Subject>) => request<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubject = (id: string) => request<{ success: boolean }>(`/subjects/${id}`, { method: 'DELETE' });

// ===== Courses =====
export const getCourses = () => request<GradeCourse[]>('/courses');
export const createCourse = (data: Omit<GradeCourse, 'id'> & { id: string }) => request<GradeCourse>('/courses', { method: 'POST', body: JSON.stringify(data) });
export const updateCourse = (id: string, data: Partial<GradeCourse>) => request<GradeCourse>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCourse = (id: string) => request<{ success: boolean }>(`/courses/${id}`, { method: 'DELETE' });

// ===== Timetable =====
export const getTimetable = () => request<TimetableEntry[]>('/timetable');
export const createTimetableEntry = (data: Omit<TimetableEntry, 'id'> & { id: string }) => request<TimetableEntry>('/timetable', { method: 'POST', body: JSON.stringify(data) });
export const updateTimetableEntry = (id: string, data: Partial<TimetableEntry>) => request<TimetableEntry>(`/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTimetableEntry = (id: string) => request<{ success: boolean }>(`/timetable/${id}`, { method: 'DELETE' });

// ===== Exams =====
export const getExams = () => request<Exam[]>('/exams');
export const createExam = (data: Omit<Exam, 'id'> & { id: string }) => request<Exam>('/exams', { method: 'POST', body: JSON.stringify(data) });
export const updateExam = (id: string, data: Partial<Exam>) => request<Exam>(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExam = (id: string) => request<{ success: boolean }>(`/exams/${id}`, { method: 'DELETE' });

// ===== Exam Sessions =====
export const getExamSessions = (examId?: string) => request<ExamSession[]>(`/exam-sessions${examId ? `?examId=${examId}` : ''}`);
export const createExamSession = (data: Omit<ExamSession, 'id'> & { id: string }) => request<ExamSession>('/exam-sessions', { method: 'POST', body: JSON.stringify(data) });
export const updateExamSession = (id: string, data: Partial<ExamSession>) => request<ExamSession>(`/exam-sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExamSession = (id: string) => request<{ success: boolean }>(`/exam-sessions/${id}`, { method: 'DELETE' });

// ===== Exam Rooms =====
export const getExamRooms = (examId?: string) => request<ExamRoom[]>(`/exam-rooms${examId ? `?examId=${examId}` : ''}`);
export const createExamRoom = (data: Omit<ExamRoom, 'id'> & { id: string }) => request<ExamRoom>('/exam-rooms', { method: 'POST', body: JSON.stringify(data) });
export const updateExamRoom = (id: string, data: Partial<ExamRoom>) => request<ExamRoom>(`/exam-rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExamRoom = (id: string) => request<{ success: boolean }>(`/exam-rooms/${id}`, { method: 'DELETE' });

// ===== Announcements =====
export const getAnnouncements = () => request<Announcement[]>('/announcements');
export const createAnnouncement = (data: Omit<Announcement, 'id'> & { id: string }) => request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: Partial<Announcement>) => request<Announcement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string) => request<{ success: boolean }>(`/announcements/${id}`, { method: 'DELETE' });

// ===== Metrics =====
export const getMetrics = () => request<BusinessMetric[]>('/metrics');
