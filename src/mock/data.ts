import type {
  School, Staff, SalaryRecord, AttendanceRecord,
  ClassInfo, Subject, GradeCourse, TimetableEntry,
  Exam, ExamSession, ExamRoom, Announcement, BusinessMetric,
} from '../types';

// ===== 学校 =====
export const schoolInfo: School = {
  id: '1', name: '青云高级中学', region: '海淀区', type: '公立', level: '高中',
  contact: '张校长', phone: '010-66001234', address: '北京市海淀区青云路18号',
  studentCount: 910, staffCount: 36,
};

// ===== 教职工（36人，覆盖所有科目×多个教师）=====
export const mockStaff: Staff[] = [
  // 教务处
  { id: 's01', name: '郭建国', staffNo: 'T2015001', department: '教务处', position: '教务主任', title: '高级教师', education: '硕士', major: '教育管理', phone: '13801010001', hireDate: '2010-09-01', contractStart: '2024-09-01', contractEnd: '2027-08-31', status: '在职', remark: '' },
  { id: 's02', name: '林晓燕', staffNo: 'T2019002', department: '教务处', position: '教务员', title: '', education: '本科', major: '行政管理', phone: '13801010002', hireDate: '2019-03-01', contractStart: '2025-03-01', contractEnd: '2028-02-28', status: '在职', remark: '' },
  // 德育处
  { id: 's03', name: '刘志强', staffNo: 'T2016003', department: '德育处', position: '德育主任', title: '一级教师', education: '硕士', major: '思政教育', phone: '13801010003', hireDate: '2014-09-01', contractStart: '2026-02-01', contractEnd: '2029-01-31', status: '在职', remark: '' },
  { id: 's04', name: '何静',     staffNo: 'T2021004', department: '德育处', position: '德育干事', title: '', education: '本科', major: '心理学', phone: '13801010004', hireDate: '2021-08-01', contractStart: '2025-08-01', contractEnd: '2028-07-31', status: '在职', remark: '' },
  // 语文组(4人)
  { id: 's10', name: '孙晓红', staffNo: 'T2008010', department: '年级组', position: '语文教师', title: '特级教师', education: '本科', major: '汉语言文学', phone: '13802010001', hireDate: '2008-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '学科带头人' },
  { id: 's11', name: '赵雅文', staffNo: 'T2017011', department: '年级组', position: '语文教师', title: '一级教师', education: '硕士', major: '古代文学', phone: '13802010002', hireDate: '2017-07-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's12', name: '钱思远', staffNo: 'T2020012', department: '年级组', position: '语文教师', title: '二级教师', education: '硕士', major: '现当代文学', phone: '13802010003', hireDate: '2020-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's13', name: '周晓雯', staffNo: 'T2022013', department: '年级组', position: '语文教师', title: '二级教师', education: '本科', major: '汉语言文学', phone: '13802010004', hireDate: '2022-09-01', contractStart: '2026-09-01', contractEnd: '2029-08-31', status: '在职', remark: '' },
  // 数学组(4人)
  { id: 's20', name: '赵德明', staffNo: 'T2016020', department: '年级组', position: '数学教师', title: '高级教师', education: '硕士', major: '应用数学', phone: '13802020001', hireDate: '2016-07-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's21', name: '陈丽华', staffNo: 'T2012021', department: '年级组', position: '数学教师', title: '高级教师', education: '本科', major: '数学教育', phone: '13802020002', hireDate: '2012-07-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '高三组长' },
  { id: 's22', name: '李志鹏', staffNo: 'T2018022', department: '年级组', position: '数学教师', title: '一级教师', education: '硕士', major: '计算数学', phone: '13802020003', hireDate: '2018-09-01', contractStart: '2026-02-01', contractEnd: '2029-01-31', status: '在职', remark: '' },
  { id: 's23', name: '吴桐',   staffNo: 'T2023023', department: '年级组', position: '数学教师', title: '二级教师', education: '本科', major: '统计学', phone: '13802020004', hireDate: '2023-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  // 英语组(4人)
  { id: 's30', name: '王美玲', staffNo: 'T2011030', department: '年级组', position: '英语教师', title: '高级教师', education: '硕士', major: '英语语言文学', phone: '13802030001', hireDate: '2011-09-01', contractStart: '2024-09-01', contractEnd: '2027-08-31', status: '在职', remark: '' },
  { id: 's31', name: '郑晓明', staffNo: 'T2014031', department: '年级组', position: '英语教师', title: '一级教师', education: '硕士', major: '翻译', phone: '13802030002', hireDate: '2014-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's32', name: '冯露',   staffNo: 'T2019032', department: '年级组', position: '英语教师', title: '二级教师', education: '本科', major: '英语教育', phone: '13802030003', hireDate: '2019-07-01', contractStart: '2025-03-01', contractEnd: '2028-02-28', status: '在职', remark: '' },
  { id: 's33', name: '韩梅梅', staffNo: 'T2024033', department: '年级组', position: '英语教师', title: '', education: '硕士', major: 'TESOL', phone: '13802030004', hireDate: '2024-09-01', contractStart: '2026-09-01', contractEnd: '2029-08-31', status: '在职', remark: '' },
  // 理综组
  { id: 's40', name: '周明辉', staffNo: 'T2013040', department: '年级组', position: '物理教师', title: '高级教师', education: '博士', major: '理论物理', phone: '13802040001', hireDate: '2013-09-01', contractStart: '2024-09-01', contractEnd: '2027-08-31', status: '在职', remark: '' },
  { id: 's41', name: '马超',   staffNo: 'T2021041', department: '年级组', position: '物理教师', title: '二级教师', education: '硕士', major: '凝聚态物理', phone: '13802040002', hireDate: '2021-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's42', name: '吴秀英', staffNo: 'T2017042', department: '年级组', position: '化学教师', title: '一级教师', education: '硕士', major: '化学教育', phone: '13802040003', hireDate: '2017-07-01', contractStart: '2026-02-01', contractEnd: '2029-01-31', status: '在职', remark: '' },
  { id: 's43', name: '朱明',   staffNo: 'T2022043', department: '年级组', position: '化学教师', title: '二级教师', education: '硕士', major: '有机化学', phone: '13802040004', hireDate: '2022-09-01', contractStart: '2026-09-01', contractEnd: '2029-08-31', status: '在职', remark: '' },
  { id: 's44', name: '郑文博', staffNo: 'T2020044', department: '年级组', position: '生物教师', title: '一级教师', education: '硕士', major: '生物科学', phone: '13802040005', hireDate: '2020-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's45', name: '沈洁',   staffNo: 'T2023045', department: '年级组', position: '生物教师', title: '二级教师', education: '本科', major: '生物技术', phone: '13802040006', hireDate: '2023-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  // 文综组
  { id: 's50', name: '黄丽萍', staffNo: 'T2015050', department: '年级组', position: '历史教师', title: '高级教师', education: '硕士', major: '中国史', phone: '13802050001', hireDate: '2015-09-01', contractStart: '2024-09-01', contractEnd: '2027-08-31', status: '在职', remark: '' },
  { id: 's51', name: '丁一',   staffNo: 'T2021051', department: '年级组', position: '历史教师', title: '二级教师', education: '本科', major: '历史学', phone: '13802050002', hireDate: '2021-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  { id: 's52', name: '陈晓宇', staffNo: 'T2018052', department: '年级组', position: '地理教师', title: '一级教师', education: '硕士', major: '自然地理', phone: '13802050003', hireDate: '2018-09-01', contractStart: '2026-02-01', contractEnd: '2029-01-31', status: '在职', remark: '' },
  { id: 's53', name: '方圆',   staffNo: 'T2022053', department: '年级组', position: '地理教师', title: '二级教师', education: '本科', major: '地理科学', phone: '13802050004', hireDate: '2022-09-01', contractStart: '2026-09-01', contractEnd: '2029-08-31', status: '在职', remark: '' },
  { id: 's54', name: '高洁',   staffNo: 'T2016054', department: '年级组', position: '政治教师', title: '一级教师', education: '硕士', major: '法学', phone: '13802050005', hireDate: '2016-09-01', contractStart: '2025-03-01', contractEnd: '2028-02-28', status: '在职', remark: '' },
  { id: 's55', name: '江涛',   staffNo: 'T2023055', department: '年级组', position: '政治教师', title: '', education: '本科', major: '思想政治教育', phone: '13802050006', hireDate: '2023-09-01', contractStart: '2025-09-01', contractEnd: '2028-08-31', status: '在职', remark: '' },
  // 艺体
  { id: 's60', name: '黄建军', staffNo: 'A2021060', department: '年级组', position: '体育教师', title: '', education: '本科', major: '体育教育', phone: '13802060001', hireDate: '2015-03-01', contractStart: '2025-03-01', contractEnd: '2028-02-28', status: '在职', remark: '' },
  { id: 's61', name: '宋涛',   staffNo: 'A2024061', department: '年级组', position: '体育教师', title: '', education: '本科', major: '运动训练', phone: '13802060002', hireDate: '2024-09-01', contractStart: '2026-09-01', contractEnd: '2029-08-31', status: '在职', remark: '' },
  // 后勤
  { id: 's70', name: '许国栋', staffNo: 'L2018070', department: '后勤处', position: '后勤主管', title: '', education: '大专', major: '行政管理', phone: '13803070001', hireDate: '2018-05-01', contractStart: '2025-05-01', contractEnd: '2028-04-30', status: '在职', remark: '' },
  { id: 's71', name: '梁师傅', staffNo: 'L2020071', department: '后勤处', position: '维修工', title: '', education: '中专', major: '电工', phone: '13803070002', hireDate: '2020-06-01', contractStart: '2026-06-01', contractEnd: '2029-05-31', status: '在职', remark: '' },
  // 退休
  { id: 's99', name: '杨秀丽', staffNo: 'T2005099', department: '年级组', position: '历史教师', title: '高级教师', education: '硕士', major: '中国史', phone: '13802050006', hireDate: '2005-09-01', contractStart: '2024-09-01', contractEnd: '2025-08-31', status: '退休', remark: '2025年退休' },
];

// ===== 科目库 =====
export const mockSubjects: Subject[] = [
  { id: 'sub1', name: '语文', category: '主科' }, { id: 'sub2', name: '数学', category: '主科' },
  { id: 'sub3', name: '英语', category: '主科' }, { id: 'sub4', name: '物理', category: '选考' },
  { id: 'sub5', name: '化学', category: '选考' }, { id: 'sub6', name: '生物', category: '选考' },
  { id: 'sub7', name: '历史', category: '选考' }, { id: 'sub8', name: '地理', category: '选考' },
  { id: 'sub9', name: '政治', category: '选考' }, { id: 'sub10', name: '体育', category: '艺体' },
  { id: 'sub11', name: '美术', category: '艺体' }, { id: 'sub12', name: '信息技术', category: '其他' },
];

// ===== 班级（每级6个班，共18个）=====
export const mockClasses: ClassInfo[] = [
  { id: 'c11', grade: '高一', name: '高一(1)班', track: '物化生', homeroomTeacher: '赵德明', room: '教学楼3层301', studentCount: 51, maxStudents: 55, status: '在读' },
  { id: 'c12', grade: '高一', name: '高一(2)班', track: '物化地', homeroomTeacher: '周明辉', room: '教学楼3层302', studentCount: 50, maxStudents: 55, status: '在读' },
  { id: 'c13', grade: '高一', name: '高一(3)班', track: '史地政', homeroomTeacher: '黄丽萍', room: '教学楼3层303', studentCount: 49, maxStudents: 55, status: '在读' },
  { id: 'c14', grade: '高一', name: '高一(4)班', track: '物化生', homeroomTeacher: '陈丽华', room: '教学楼3层304', studentCount: 52, maxStudents: 55, status: '在读' },
  { id: 'c15', grade: '高一', name: '高一(5)班', track: '物生政', homeroomTeacher: '吴秀英', room: '教学楼3层305', studentCount: 50, maxStudents: 55, status: '在读' },
  { id: 'c16', grade: '高一', name: '高一(6)班', track: '史政生', homeroomTeacher: '高洁',   room: '教学楼3层306', studentCount: 48, maxStudents: 55, status: '在读' },
  { id: 'c21', grade: '高二', name: '高二(1)班', track: '物化生', homeroomTeacher: '王美玲', room: '教学楼4层401', studentCount: 53, maxStudents: 55, status: '在读' },
  { id: 'c22', grade: '高二', name: '高二(2)班', track: '物化地', homeroomTeacher: '孙晓红', room: '教学楼4层402', studentCount: 50, maxStudents: 55, status: '在读' },
  { id: 'c23', grade: '高二', name: '高二(3)班', track: '史地政', homeroomTeacher: '郭建国', room: '教学楼4层403', studentCount: 48, maxStudents: 55, status: '在读' },
  { id: 'c24', grade: '高二', name: '高二(4)班', track: '物化生', homeroomTeacher: '李志鹏', room: '教学楼4层404', studentCount: 51, maxStudents: 55, status: '在读' },
  { id: 'c25', grade: '高二', name: '高二(5)班', track: '物化政', homeroomTeacher: '赵雅文', room: '教学楼4层405', studentCount: 49, maxStudents: 55, status: '在读' },
  { id: 'c26', grade: '高二', name: '高二(6)班', track: '物生政', homeroomTeacher: '马超',   room: '教学楼4层406', studentCount: 50, maxStudents: 55, status: '在读' },
  { id: 'c31', grade: '高三', name: '高三(1)班', track: '物化生', homeroomTeacher: '刘志强', room: '教学楼5层501', studentCount: 54, maxStudents: 55, status: '在读' },
  { id: 'c32', grade: '高三', name: '高三(2)班', track: '物化政', homeroomTeacher: '陈丽华', room: '教学楼5层502', studentCount: 52, maxStudents: 55, status: '在读' },
  { id: 'c33', grade: '高三', name: '高三(3)班', track: '史地政', homeroomTeacher: '周明辉', room: '教学楼5层503', studentCount: 49, maxStudents: 55, status: '在读' },
  { id: 'c34', grade: '高三', name: '高三(4)班', track: '物化生', homeroomTeacher: '郑晓明', room: '教学楼5层504', studentCount: 53, maxStudents: 55, status: '在读' },
  { id: 'c35', grade: '高三', name: '高三(5)班', track: '物化地', homeroomTeacher: '周晓雯', room: '教学楼5层505', studentCount: 50, maxStudents: 55, status: '在读' },
  { id: 'c36', grade: '高三', name: '高三(6)班', track: '史地政', homeroomTeacher: '沈洁',   room: '教学楼5层506', studentCount: 48, maxStudents: 55, status: '在读' },
];

// ===== 课程设置 =====
export const mockGradeCourses: GradeCourse[] = [
  { id: 'g1', grade: '高一', subjectId: 'sub1', subjectName: '语文', weeklyHours: 5, teacherId: 's10', teacherName: '孙晓红' },
  { id: 'g2', grade: '高一', subjectId: 'sub2', subjectName: '数学', weeklyHours: 5, teacherId: 's20', teacherName: '赵德明' },
  { id: 'g3', grade: '高一', subjectId: 'sub3', subjectName: '英语', weeklyHours: 5, teacherId: 's30', teacherName: '王美玲' },
  { id: 'g4', grade: '高一', subjectId: 'sub4', subjectName: '物理', weeklyHours: 4, teacherId: 's40', teacherName: '周明辉' },
  { id: 'g5', grade: '高一', subjectId: 'sub5', subjectName: '化学', weeklyHours: 4, teacherId: 's42', teacherName: '吴秀英' },
  { id: 'g6', grade: '高一', subjectId: 'sub6', subjectName: '生物', weeklyHours: 3, teacherId: 's44', teacherName: '郑文博' },
  { id: 'g7', grade: '高一', subjectId: 'sub7', subjectName: '历史', weeklyHours: 3, teacherId: 's50', teacherName: '黄丽萍' },
  { id: 'g8', grade: '高一', subjectId: 'sub8', subjectName: '地理', weeklyHours: 2, teacherId: 's52', teacherName: '陈晓宇' },
  { id: 'g9', grade: '高一', subjectId: 'sub9', subjectName: '政治', weeklyHours: 2, teacherId: 's54', teacherName: '高洁' },
  { id: 'g10', grade: '高一', subjectId: 'sub10', subjectName: '体育', weeklyHours: 2, teacherId: 's60', teacherName: '黄建军' },
  { id: 'g11', grade: '高二', subjectId: 'sub1', subjectName: '语文', weeklyHours: 5, teacherId: 's11', teacherName: '赵雅文' },
  { id: 'g12', grade: '高二', subjectId: 'sub2', subjectName: '数学', weeklyHours: 5, teacherId: 's21', teacherName: '陈丽华' },
  { id: 'g13', grade: '高二', subjectId: 'sub3', subjectName: '英语', weeklyHours: 5, teacherId: 's31', teacherName: '郑晓明' },
  { id: 'g14', grade: '高二', subjectId: 'sub4', subjectName: '物理', weeklyHours: 4, teacherId: 's41', teacherName: '马超' },
  { id: 'g15', grade: '高二', subjectId: 'sub5', subjectName: '化学', weeklyHours: 4, teacherId: 's43', teacherName: '朱明' },
  { id: 'g16', grade: '高二', subjectId: 'sub6', subjectName: '生物', weeklyHours: 3, teacherId: 's45', teacherName: '沈洁' },
  { id: 'g17', grade: '高二', subjectId: 'sub7', subjectName: '历史', weeklyHours: 3, teacherId: 's51', teacherName: '丁一' },
  { id: 'g18', grade: '高二', subjectId: 'sub8', subjectName: '地理', weeklyHours: 2, teacherId: 's53', teacherName: '方圆' },
  { id: 'g19', grade: '高二', subjectId: 'sub9', subjectName: '政治', weeklyHours: 2, teacherId: 's55', teacherName: '江涛' },
  { id: 'g20', grade: '高二', subjectId: 'sub10', subjectName: '体育', weeklyHours: 2, teacherId: 's61', teacherName: '宋涛' },
  { id: 'g21', grade: '高三', subjectId: 'sub1', subjectName: '语文', weeklyHours: 6, teacherId: 's12', teacherName: '钱思远' },
  { id: 'g22', grade: '高三', subjectId: 'sub2', subjectName: '数学', weeklyHours: 6, teacherId: 's22', teacherName: '李志鹏' },
  { id: 'g23', grade: '高三', subjectId: 'sub3', subjectName: '英语', weeklyHours: 6, teacherId: 's32', teacherName: '冯露' },
  { id: 'g24', grade: '高三', subjectId: 'sub4', subjectName: '物理', weeklyHours: 5, teacherId: 's40', teacherName: '周明辉' },
  { id: 'g25', grade: '高三', subjectId: 'sub5', subjectName: '化学', weeklyHours: 5, teacherId: 's42', teacherName: '吴秀英' },
  { id: 'g26', grade: '高三', subjectId: 'sub6', subjectName: '生物', weeklyHours: 4, teacherId: 's44', teacherName: '郑文博' },
  { id: 'g27', grade: '高三', subjectId: 'sub7', subjectName: '历史', weeklyHours: 4, teacherId: 's50', teacherName: '黄丽萍' },
  { id: 'g28', grade: '高三', subjectId: 'sub8', subjectName: '地理', weeklyHours: 3, teacherId: 's52', teacherName: '陈晓宇' },
  { id: 'g29', grade: '高三', subjectId: 'sub9', subjectName: '政治', weeklyHours: 3, teacherId: 's54', teacherName: '高洁' },
];

// ===== 课表（高一1班示例）=====
export const mockTimetable: TimetableEntry[] = [
  { id: 't1', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 1, subjectId: 'sub2', subjectName: '数学', teacherId: 's20', teacherName: '赵德明' },
  { id: 't2', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 2, subjectId: 'sub2', subjectName: '数学', teacherId: 's20', teacherName: '赵德明' },
  { id: 't3', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 3, subjectId: 'sub1', subjectName: '语文', teacherId: 's10', teacherName: '孙晓红' },
  { id: 't4', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 4, subjectId: 'sub4', subjectName: '物理', teacherId: 's40', teacherName: '周明辉' },
  { id: 't5', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 5, subjectId: 'sub3', subjectName: '英语', teacherId: 's30', teacherName: '王美玲' },
  { id: 't6', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 6, subjectId: 'sub5', subjectName: '化学', teacherId: 's42', teacherName: '吴秀英' },
  { id: 't7', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 1, period: 7, subjectId: 'sub10', subjectName: '体育', teacherId: 's60', teacherName: '黄建军' },
  { id: 't8', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 1, subjectId: 'sub1', subjectName: '语文', teacherId: 's10', teacherName: '孙晓红' },
  { id: 't9', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 2, subjectId: 'sub3', subjectName: '英语', teacherId: 's30', teacherName: '王美玲' },
  { id: 't10', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 3, subjectId: 'sub4', subjectName: '物理', teacherId: 's40', teacherName: '周明辉' },
  { id: 't11', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 4, subjectId: 'sub2', subjectName: '数学', teacherId: 's20', teacherName: '赵德明' },
  { id: 't12', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 5, subjectId: 'sub7', subjectName: '历史', teacherId: 's50', teacherName: '黄丽萍' },
  { id: 't13', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 6, subjectId: 'sub6', subjectName: '生物', teacherId: 's44', teacherName: '郑文博' },
  { id: 't14', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 2, period: 7, subjectId: 'sub8', subjectName: '地理', teacherId: 's52', teacherName: '陈晓宇' },
  { id: 't15', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 1, subjectId: 'sub3', subjectName: '英语', teacherId: 's30', teacherName: '王美玲' },
  { id: 't16', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 2, subjectId: 'sub2', subjectName: '数学', teacherId: 's20', teacherName: '赵德明' },
  { id: 't17', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 3, subjectId: 'sub1', subjectName: '语文', teacherId: 's10', teacherName: '孙晓红' },
  { id: 't18', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 4, subjectId: 'sub5', subjectName: '化学', teacherId: 's42', teacherName: '吴秀英' },
  { id: 't19', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 5, subjectId: 'sub4', subjectName: '物理', teacherId: 's40', teacherName: '周明辉' },
  { id: 't20', classId: 'c11', className: '高一(1)班', grade: '高一', dayOfWeek: 3, period: 6, subjectId: 'sub9', subjectName: '政治', teacherId: 's54', teacherName: '高洁' },
];

// ===== 考试 =====
export const mockExams: Exam[] = [
  { id: 'e1', name: '2026年7月期末考试', type: '期末', grade: '高一', startDate: '2026-07-10', endDate: '2026-07-12' },
  { id: 'e2', name: '2026年7月期末考试', type: '期末', grade: '高二', startDate: '2026-07-10', endDate: '2026-07-12' },
];

export const mockExamSessions: ExamSession[] = [
  { id: 'es1', examId: 'e1', date: '2026-07-10', timeSlot: '上午', subjectId: 'sub1', subjectName: '语文', duration: 150 },
  { id: 'es2', examId: 'e1', date: '2026-07-10', timeSlot: '下午', subjectId: 'sub2', subjectName: '数学', duration: 120 },
  { id: 'es3', examId: 'e1', date: '2026-07-11', timeSlot: '上午', subjectId: 'sub3', subjectName: '英语', duration: 120 },
  { id: 'es4', examId: 'e1', date: '2026-07-11', timeSlot: '下午', subjectId: 'sub4', subjectName: '物理', duration: 90 },
  { id: 'es5', examId: 'e1', date: '2026-07-12', timeSlot: '上午', subjectId: 'sub5', subjectName: '化学', duration: 90 },
  { id: 'es6', examId: 'e1', date: '2026-07-12', timeSlot: '下午', subjectId: 'sub6', subjectName: '生物', duration: 90 },
];

export const mockExamRooms: ExamRoom[] = [
  { id: 'er1', examId: 'e1', room: '教学楼3层301', capacity: 30, invigilator1: '赵德明', invigilator2: '吴秀英' },
  { id: 'er2', examId: 'e1', room: '教学楼3层302', capacity: 30, invigilator1: '周明辉', invigilator2: '郑文博' },
  { id: 'er3', examId: 'e1', room: '教学楼3层303', capacity: 30, invigilator1: '孙晓红', invigilator2: '王美玲' },
  { id: 'er4', examId: 'e1', room: '教学楼3层304', capacity: 30, invigilator1: '郭建国', invigilator2: '陈丽华' },
  { id: 'er5', examId: 'e1', room: '教学楼3层305', capacity: 30, invigilator1: '李志鹏', invigilator2: '冯露' },
  { id: 'er6', examId: 'e1', room: '教学楼3层306', capacity: 30, invigilator1: '赵雅文', invigilator2: '马超' },
];

// ===== 工资记录（6月已发放24人 + 7月待发放24人）=====
function makeSalary(id: string, staffId: string, name: string, base: number, bonus: number, ded: number, month: 6|7, status: '已发放'|'待发放') {
  const total = base + bonus - ded;
  return { id, staffId, staffName: name, year: 2026, month, basePay: base, bonus, deduction: ded, total,
    status: status as '已发放' | '待发放',
    paidDate: status === '已发放' ? `2026-0${month}-15` : undefined,
  };
}

export const mockSalaries: SalaryRecord[] = [
  // 6月已发放
  makeSalary('sa01', 's01', '郭建国', 12000, 3000, 800, 6, '已发放'),
  makeSalary('sa02', 's02', '林晓燕', 7000, 1500, 400, 6, '已发放'),
  makeSalary('sa03', 's03', '刘志强', 9500, 2000, 500, 6, '已发放'),
  makeSalary('sa04', 's04', '何静',   6500, 1200, 350, 6, '已发放'),
  makeSalary('sa05', 's10', '孙晓红', 15000, 4000, 1000, 6, '已发放'),
  makeSalary('sa06', 's11', '赵雅文', 9500, 2200, 550, 6, '已发放'),
  makeSalary('sa07', 's12', '钱思远', 8000, 1800, 400, 6, '已发放'),
  makeSalary('sa08', 's13', '周晓雯', 7000, 1500, 350, 6, '已发放'),
  makeSalary('sa09', 's20', '赵德明', 10000, 2500, 450, 6, '已发放'),
  makeSalary('sa10', 's21', '陈丽华', 11000, 2800, 700, 6, '已发放'),
  makeSalary('sa11', 's22', '李志鹏', 9000, 2000, 500, 6, '已发放'),
  makeSalary('sa12', 's23', '吴桐',   6500, 1400, 350, 6, '已发放'),
  makeSalary('sa13', 's30', '王美玲', 10500, 2500, 600, 6, '已发放'),
  makeSalary('sa14', 's31', '郑晓明', 9500, 2200, 500, 6, '已发放'),
  makeSalary('sa15', 's32', '冯露',   8000, 1800, 400, 6, '已发放'),
  makeSalary('sa16', 's33', '韩梅梅', 6500, 1300, 350, 6, '已发放'),
  makeSalary('sa17', 's40', '周明辉', 13000, 3500, 900, 6, '已发放'),
  makeSalary('sa18', 's41', '马超',   7500, 1600, 400, 6, '已发放'),
  makeSalary('sa19', 's42', '吴秀英', 9500, 2200, 550, 6, '已发放'),
  makeSalary('sa20', 's43', '朱明',   7500, 1600, 400, 6, '已发放'),
  makeSalary('sa21', 's44', '郑文博', 8500, 2000, 450, 6, '已发放'),
  makeSalary('sa22', 's45', '沈洁',   6500, 1400, 350, 6, '已发放'),
  makeSalary('sa23', 's70', '许国栋', 7000, 1500, 350, 6, '已发放'),
  makeSalary('sa24', 's71', '梁师傅', 5500, 1000, 300, 6, '已发放'),
  // 7月待发放
  makeSalary('sa25', 's01', '郭建国', 12000, 3500, 800, 7, '待发放'),
  makeSalary('sa26', 's02', '林晓燕', 7000, 1800, 400, 7, '待发放'),
  makeSalary('sa27', 's03', '刘志强', 9500, 2500, 500, 7, '待发放'),
  makeSalary('sa28', 's04', '何静',   6500, 1500, 350, 7, '待发放'),
  makeSalary('sa29', 's10', '孙晓红', 15000, 4500, 1000, 7, '待发放'),
  makeSalary('sa30', 's11', '赵雅文', 9500, 2500, 550, 7, '待发放'),
  makeSalary('sa31', 's12', '钱思远', 8000, 2000, 400, 7, '待发放'),
  makeSalary('sa32', 's13', '周晓雯', 7000, 1800, 350, 7, '待发放'),
  makeSalary('sa33', 's20', '赵德明', 10000, 2800, 450, 7, '待发放'),
  makeSalary('sa34', 's21', '陈丽华', 11000, 3200, 700, 7, '待发放'),
  makeSalary('sa35', 's22', '李志鹏', 9000, 2400, 500, 7, '待发放'),
  makeSalary('sa36', 's23', '吴桐',   6500, 1700, 350, 7, '待发放'),
  makeSalary('sa37', 's30', '王美玲', 10500, 2800, 600, 7, '待发放'),
  makeSalary('sa38', 's31', '郑晓明', 9500, 2500, 500, 7, '待发放'),
  makeSalary('sa39', 's32', '冯露',   8000, 2000, 400, 7, '待发放'),
  makeSalary('sa40', 's33', '韩梅梅', 6500, 1600, 350, 7, '待发放'),
  makeSalary('sa41', 's40', '周明辉', 13000, 3800, 900, 7, '待发放'),
  makeSalary('sa42', 's41', '马超',   7500, 1900, 400, 7, '待发放'),
  makeSalary('sa43', 's42', '吴秀英', 9500, 2500, 550, 7, '待发放'),
  makeSalary('sa44', 's43', '朱明',   7500, 1900, 400, 7, '待发放'),
  makeSalary('sa45', 's44', '郑文博', 8500, 2200, 450, 7, '待发放'),
  makeSalary('sa46', 's45', '沈洁',   6500, 1700, 350, 7, '待发放'),
  makeSalary('sa47', 's70', '许国栋', 7000, 1800, 350, 7, '待发放'),
  makeSalary('sa48', 's71', '梁师傅', 5500, 1200, 300, 7, '待发放'),
];

// ===== 考勤记录 =====
export const mockAttendance: AttendanceRecord[] = [
  { id: 'a1', staffId: 's01', staffName: '郭建国', date: '2026-07-20', checkIn: '07:55', checkOut: '17:05', status: '正常', remark: '' },
  { id: 'a2', staffId: 's01', staffName: '郭建国', date: '2026-07-21', checkIn: '08:30', checkOut: '17:00', status: '迟到', remark: '交通拥堵' },
  { id: 'a3', staffId: 's01', staffName: '郭建国', date: '2026-07-22', checkIn: '07:50', checkOut: '17:10', status: '正常', remark: '' },
  { id: 'a4', staffId: 's21', staffName: '陈丽华', date: '2026-07-20', checkIn: '08:00', checkOut: '16:30', status: '早退', remark: '个人原因' },
  { id: 'a5', staffId: 's21', staffName: '陈丽华', date: '2026-07-21', checkIn: '07:45', checkOut: '17:15', status: '正常', remark: '' },
  { id: 'a6', staffId: 's03', staffName: '刘志强', date: '2026-07-20', checkIn: '08:10', checkOut: '17:00', status: '正常', remark: '' },
  { id: 'a7', staffId: 's30', staffName: '王美玲', date: '2026-07-20', checkIn: '08:05', checkOut: '17:20', status: '正常', remark: '' },
  { id: 'a8', staffId: 's10', staffName: '孙晓红', date: '2026-07-20', checkIn: '07:40', checkOut: '17:30', status: '正常', remark: '' },
  { id: 'a9', staffId: 's10', staffName: '孙晓红', date: '2026-07-21', checkIn: '08:25', checkOut: '17:00', status: '迟到', remark: '' },
  { id: 'a10', staffId: 's10', staffName: '孙晓红', date: '2026-07-22', checkIn: '07:55', checkOut: '16:45', status: '早退', remark: '外出教研' },
  { id: 'a11', staffId: 's21', staffName: '陈丽华', date: '2026-07-22', checkIn: null, checkOut: null, status: '请假', remark: '事假' },
  { id: 'a12', staffId: 's70', staffName: '许国栋', date: '2026-07-20', checkIn: null, checkOut: null, status: '缺勤', remark: '未打卡' },
];

// ===== 通知公告 =====
export const mockAnnouncements: Announcement[] = [
  { id: 'n1', title: '关于开展暑期教师培训的通知', content: '请高一、高二年级全体教师于8月20日前完成线上暑期培训课程，培训内容涵盖新课标解读与教学方法研讨。', date: '2026-07-20', priority: '重要', target: '高一', expireDate: '2026-08-25', isExpired: false },
  { id: 'n2', title: '关于加强校园安全管理的紧急通知', content: '接上级通知，近期需全面排查校园安全隐患，重点检查消防设施、电路安全和实验室危化品管理。各年级组请于本周内完成自查。', date: '2026-07-19', priority: '紧急', target: '全体', expireDate: '2026-07-26', isExpired: false },
  { id: 'n3', title: '高三年级毕业典礼安排', content: '2026届高三毕业典礼定于7月25日上午9:00在学校礼堂举行，请高三全体师生及家长代表准时参加。', date: '2026-07-18', priority: '重要', target: '高三', expireDate: '2026-07-25', isExpired: false },
  { id: 'n4', title: '7月份工资发放时间调整通知', content: '因银行系统维护，7月份工资将推迟至7月18日发放，请各位教职工谅解。', date: '2026-07-15', priority: '普通', target: '全体', expireDate: '2026-07-20', isExpired: true },
  { id: 'n5', title: '高一年级家长会通知', content: '定于7月28日下午2:30在各班教室召开高一年级期末家长会，请班主任做好准备工作。', date: '2026-07-16', priority: '普通', target: '高一', expireDate: '2026-07-28', isExpired: false },
];

// ===== 业务指标 =====
export const mockMetrics: BusinessMetric[] = [
  { title: '在读班级', value: 18, unit: '个', trend: 'stable', icon: 'book' },
  { title: '在职教职工', value: 35, unit: '人', trend: 'stable', icon: 'team' },
  { title: '在校学生', value: 910, unit: '人', trend: 'up', icon: 'student' },
  { title: '本月工资待发', value: 24, unit: '笔', trend: 'down', icon: 'dollar' },
  { title: '本月迟到人次', value: 2, unit: '次', trend: 'down', icon: 'clock' },
  { title: '本月缺勤人次', value: 1, unit: '次', trend: 'stable', icon: 'warning' },
];
