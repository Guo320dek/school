const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use Railway volume if available, otherwise local file
const VOL_PATH = '/data/data.db';
const LOCAL_PATH = path.join(__dirname, 'data.db');
const DB_PATH = fs.existsSync('/data') ? VOL_PATH : LOCAL_PATH;
console.log('Using DB path:', DB_PATH);

let db;
let dbReady = false;

function getDb() {
  if (!dbReady) throw new Error('DB not ready - call ensureDb first');
  return db;
}

function ensureDb() {
  if (dbReady) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    try {
      db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      initSchema();
      dbReady = true;
      resolve(db);
    } catch (e) {
      reject(e);
    }
  });
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY, name TEXT, staffNo TEXT, department TEXT,
      position TEXT, title TEXT, education TEXT, major TEXT, phone TEXT,
      hireDate TEXT, contractStart TEXT, contractEnd TEXT,
      status TEXT DEFAULT '在职', remark TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS salary_records (
      id TEXT PRIMARY KEY, staffId TEXT, staffName TEXT,
      year INTEGER, month INTEGER, basePay REAL, bonus REAL,
      deduction REAL, total REAL, status TEXT DEFAULT '待发放',
      paidDate TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY, staffId TEXT, staffName TEXT,
      date TEXT, checkIn TEXT, checkOut TEXT,
      status TEXT DEFAULT '正常', remark TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY, grade TEXT, name TEXT, track TEXT,
      homeroomTeacher TEXT, room TEXT, studentCount INTEGER DEFAULT 0,
      maxStudents INTEGER DEFAULT 55, status TEXT DEFAULT '在读',
      graduateYear INTEGER
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY, name TEXT, category TEXT,
      teacherIds TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS grade_courses (
      id TEXT PRIMARY KEY, grade TEXT, subjectId TEXT, subjectName TEXT,
      weeklyHours INTEGER, teacherId TEXT, teacherName TEXT
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY, classId TEXT, className TEXT, grade TEXT,
      dayOfWeek INTEGER, period INTEGER, subjectId TEXT, subjectName TEXT,
      teacherId TEXT, teacherName TEXT
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY, name TEXT, type TEXT, grade TEXT,
      startDate TEXT, endDate TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY, examId TEXT, date TEXT,
      timeSlot TEXT, subjectId TEXT, subjectName TEXT, duration INTEGER
    );

    CREATE TABLE IF NOT EXISTS exam_rooms (
      id TEXT PRIMARY KEY, examId TEXT, room TEXT, capacity INTEGER,
      invigilator1 TEXT, invigilator2 TEXT
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY, title TEXT, content TEXT, date TEXT,
      priority TEXT, target TEXT, expireDate TEXT, isExpired INTEGER DEFAULT 0,
      classId TEXT, className TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY, name TEXT, gender TEXT,
      classId TEXT, className TEXT, studentNo TEXT,
      phone TEXT, address TEXT, enrollmentYear INTEGER,
      status TEXT DEFAULT '在读'
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY, title TEXT, date TEXT, endDate TEXT,
      type TEXT, description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, role TEXT DEFAULT 'teacher',
      staffId TEXT, displayName TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_scores (
      id TEXT PRIMARY KEY, examId TEXT NOT NULL,
      examSessionId TEXT, studentId TEXT NOT NULL,
      studentName TEXT, classId TEXT, className TEXT,
      subjectId TEXT, subjectName TEXT, score REAL,
      grade TEXT, rank INTEGER
    );
  `);

  // Migration: add columns that might be missing in old DBs
  try { db.exec(`ALTER TABLE subjects ADD COLUMN teacherIds TEXT DEFAULT '[]'`); } catch {}
  try { db.exec(`ALTER TABLE announcements ADD COLUMN classId TEXT`); } catch {}
  try { db.exec(`ALTER TABLE announcements ADD COLUMN className TEXT`); } catch {}

  const count = db.prepare('SELECT COUNT(*) as c FROM staff').get();
  if (!count || count.c === 0) seed();
}

function seed() {
  const doSeed = db.transaction(() => {
    // Staff
    const staff = [
      ['s01','郭建国','T2015001','教务处','教务主任','高级教师','硕士','教育管理','13801010001','2010-09-01','2024-09-01','2027-08-31','在职',''],
      ['s02','林晓燕','T2019002','教务处','教务员','','本科','行政管理','13801010002','2019-03-01','2025-03-01','2028-02-28','在职',''],
      ['s03','刘志强','T2016003','德育处','德育主任','一级教师','硕士','思政教育','13801010003','2014-09-01','2026-02-01','2029-01-31','在职',''],
      ['s04','何静','T2021004','德育处','德育干事','','本科','心理学','13801010004','2021-08-01','2025-08-01','2028-07-31','在职',''],
      ['s10','孙晓红','T2008010','年级组','语文教师','特级教师','本科','汉语言文学','13802010001','2008-09-01','2025-09-01','2028-08-31','在职','学科带头人'],
      ['s11','赵雅文','T2017011','年级组','语文教师','一级教师','硕士','古代文学','13802010002','2017-07-01','2025-09-01','2028-08-31','在职',''],
      ['s12','钱思远','T2020012','年级组','语文教师','二级教师','硕士','现当代文学','13802010003','2020-09-01','2025-09-01','2028-08-31','在职',''],
      ['s13','周晓雯','T2022013','年级组','语文教师','二级教师','本科','汉语言文学','13802010004','2022-09-01','2026-09-01','2029-08-31','在职',''],
      ['s20','赵德明','T2016020','年级组','数学教师','高级教师','硕士','应用数学','13802020001','2016-07-01','2025-09-01','2028-08-31','在职',''],
      ['s21','陈丽华','T2012021','年级组','数学教师','高级教师','本科','数学教育','13802020002','2012-07-01','2025-09-01','2028-08-31','在职','高三组长'],
      ['s22','李志鹏','T2018022','年级组','数学教师','一级教师','硕士','计算数学','13802020003','2018-09-01','2026-02-01','2029-01-31','在职',''],
      ['s23','吴桐','T2023023','年级组','数学教师','二级教师','本科','统计学','13802020004','2023-09-01','2025-09-01','2028-08-31','在职',''],
      ['s30','王美玲','T2011030','年级组','英语教师','高级教师','硕士','英语语言文学','13802030001','2011-09-01','2024-09-01','2027-08-31','在职',''],
      ['s31','郑晓明','T2014031','年级组','英语教师','一级教师','硕士','翻译','13802030002','2014-09-01','2025-09-01','2028-08-31','在职',''],
      ['s32','冯露','T2019032','年级组','英语教师','二级教师','本科','英语教育','13802030003','2019-07-01','2025-03-01','2028-02-28','在职',''],
      ['s33','韩梅梅','T2024033','年级组','英语教师','','硕士','TESOL','13802030004','2024-09-01','2026-09-01','2029-08-31','在职',''],
      ['s40','周明辉','T2013040','年级组','物理教师','高级教师','博士','理论物理','13802040001','2013-09-01','2024-09-01','2027-08-31','在职',''],
      ['s41','马超','T2021041','年级组','物理教师','二级教师','硕士','凝聚态物理','13802040002','2021-09-01','2025-09-01','2028-08-31','在职',''],
      ['s42','吴秀英','T2017042','年级组','化学教师','一级教师','硕士','化学教育','13802040003','2017-07-01','2026-02-01','2029-01-31','在职',''],
      ['s43','朱明','T2022043','年级组','化学教师','二级教师','硕士','有机化学','13802040004','2022-09-01','2026-09-01','2029-08-31','在职',''],
      ['s44','郑文博','T2020044','年级组','生物教师','一级教师','硕士','生物科学','13802040005','2020-09-01','2025-09-01','2028-08-31','在职',''],
      ['s45','沈洁','T2023045','年级组','生物教师','二级教师','本科','生物技术','13802040006','2023-09-01','2025-09-01','2028-08-31','在职',''],
      ['s50','黄丽萍','T2015050','年级组','历史教师','高级教师','硕士','中国史','13802050001','2015-09-01','2024-09-01','2027-08-31','在职',''],
      ['s51','丁一','T2021051','年级组','历史教师','二级教师','本科','历史学','13802050002','2021-09-01','2025-09-01','2028-08-31','在职',''],
      ['s52','陈晓宇','T2018052','年级组','地理教师','一级教师','硕士','自然地理','13802050003','2018-09-01','2026-02-01','2029-01-31','在职',''],
      ['s53','方圆','T2022053','年级组','地理教师','二级教师','本科','地理科学','13802050004','2022-09-01','2026-09-01','2029-08-31','在职',''],
      ['s54','高洁','T2016054','年级组','政治教师','一级教师','硕士','法学','13802050005','2016-09-01','2025-03-01','2028-02-28','在职',''],
      ['s55','江涛','T2023055','年级组','政治教师','','本科','思想政治教育','13802050006','2023-09-01','2025-09-01','2028-08-31','在职',''],
      ['s60','黄建军','A2021060','年级组','体育教师','','本科','体育教育','13802060001','2015-03-01','2025-03-01','2028-02-28','在职',''],
      ['s61','宋涛','A2024061','年级组','体育教师','','本科','运动训练','13802060002','2024-09-01','2026-09-01','2029-08-31','在职',''],
      ['s70','许国栋','L2018070','后勤处','后勤主管','','大专','行政管理','13803070001','2018-05-01','2025-05-01','2028-04-30','在职',''],
      ['s71','梁师傅','L2020071','后勤处','维修工','','中专','电工','13803070002','2020-06-01','2026-06-01','2029-05-31','在职',''],
      ['s99','杨秀丽','T2005099','年级组','历史教师','高级教师','硕士','中国史','13802050006','2005-09-01','2024-09-01','2025-08-31','退休','2025年退休'],
    ];
    const insS = db.prepare('INSERT INTO staff VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for (const s of staff) insS.run(...s);

    // Subjects
    const subjects = [
      ['sub1','语文','主科','["s10","s11","s12","s13"]'],
      ['sub2','数学','主科','["s20","s21","s22","s23"]'],
      ['sub3','英语','主科','["s30","s31","s32","s33"]'],
      ['sub4','物理','选考','["s40","s41"]'],
      ['sub5','化学','选考','["s42","s43"]'],
      ['sub6','生物','选考','["s44","s45"]'],
      ['sub7','历史','选考','["s50","s51"]'],
      ['sub8','地理','选考','["s52","s53"]'],
      ['sub9','政治','选考','["s54","s55"]'],
      ['sub10','体育','艺体','["s60","s61"]'],
      ['sub11','美术','艺体','[]'],
      ['sub12','信息技术','其他','[]'],
    ];
    const insSub = db.prepare('INSERT INTO subjects VALUES (?,?,?,?)');
    for (const s of subjects) insSub.run(...s);

    // Classes
    const classes = [
      ['c11','高一','高一(1)班','物化生','郭建国','教学楼3层301',51,55,'在读',null],
      ['c12','高一','高一(2)班','物化地','赵德明','教学楼3层302',50,55,'在读',null],
      ['c13','高一','高一(3)班','物化政','陈丽华','教学楼3层303',49,55,'在读',null],
      ['c14','高一','高一(4)班','物生政','钱思远','教学楼3层304',52,55,'在读',null],
      ['c15','高一','高一(5)班','史地政','周晓雯','教学楼3层305',50,55,'在读',null],
      ['c16','高一','高一(6)班','史政生','高洁','教学楼3层306',48,55,'在读',null],
      ['c21','高二','高二(1)班','物化生','王美玲','教学楼4层401',53,55,'在读',null],
      ['c22','高二','高二(2)班','物化地','孙晓红','教学楼4层402',50,55,'在读',null],
      ['c23','高二','高二(3)班','史地政','郭建国','教学楼4层403',48,55,'在读',null],
      ['c24','高二','高二(4)班','物化生','李志鹏','教学楼4层404',51,55,'在读',null],
      ['c25','高二','高二(5)班','物化政','赵雅文','教学楼4层405',49,55,'在读',null],
      ['c26','高二','高二(6)班','物生政','马超','教学楼4层406',50,55,'在读',null],
      ['c31','高三','高三(1)班','物化生','刘志强','教学楼5层501',54,55,'在读',null],
      ['c32','高三','高三(2)班','物化政','陈丽华','教学楼5层502',52,55,'在读',null],
      ['c33','高三','高三(3)班','史地政','周明辉','教学楼5层503',49,55,'在读',null],
      ['c34','高三','高三(4)班','物化生','郑晓明','教学楼5层504',53,55,'在读',null],
      ['c35','高三','高三(5)班','物化地','周晓雯','教学楼5层505',50,55,'在读',null],
      ['c36','高三','高三(6)班','史地政','沈洁','教学楼5层506',48,55,'在读',null],
    ];
    const insC = db.prepare('INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const c of classes) insC.run(...c);

    // Grade courses
    const courses = [
      ['g1','高一','sub1','语文',5,'s10','孙晓红'],['g2','高一','sub2','数学',5,'s20','赵德明'],
      ['g3','高一','sub3','英语',5,'s30','王美玲'],['g4','高一','sub4','物理',4,'s40','周明辉'],
      ['g5','高一','sub5','化学',4,'s42','吴秀英'],['g6','高一','sub6','生物',3,'s44','郑文博'],
      ['g7','高一','sub7','历史',3,'s50','黄丽萍'],['g8','高一','sub8','地理',2,'s52','陈晓宇'],
      ['g9','高一','sub9','政治',2,'s54','高洁'],['g10','高一','sub10','体育',2,'s60','黄建军'],
      ['g11','高二','sub1','语文',5,'s11','赵雅文'],['g12','高二','sub2','数学',5,'s21','陈丽华'],
      ['g13','高二','sub3','英语',5,'s31','郑晓明'],['g14','高二','sub4','物理',4,'s41','马超'],
      ['g15','高二','sub5','化学',4,'s43','朱明'],['g16','高二','sub6','生物',3,'s45','沈洁'],
      ['g17','高二','sub7','历史',3,'s51','丁一'],['g18','高二','sub8','地理',2,'s53','方圆'],
      ['g19','高二','sub9','政治',2,'s55','江涛'],['g20','高二','sub10','体育',2,'s61','宋涛'],
      ['g21','高三','sub1','语文',6,'s12','钱思远'],['g22','高三','sub2','数学',6,'s22','李志鹏'],
      ['g23','高三','sub3','英语',6,'s32','冯露'],['g24','高三','sub4','物理',5,'s40','周明辉'],
      ['g25','高三','sub5','化学',5,'s42','吴秀英'],['g26','高三','sub6','生物',4,'s44','郑文博'],
      ['g27','高三','sub7','历史',4,'s50','黄丽萍'],['g28','高三','sub8','地理',3,'s52','陈晓宇'],
      ['g29','高三','sub9','政治',3,'s54','高洁'],
      ['g30','高一','sub1','语文',6,'s20','赵德明'],
    ];
    const insG = db.prepare('INSERT INTO grade_courses VALUES (?,?,?,?,?,?,?)');
    for (const c of courses) insG.run(...c);

    // Timetable
    const tt = [
      ['t1','c11','高一(1)班','高一',1,1,'sub2','数学','s20','赵德明'],
      ['t2','c11','高一(1)班','高一',1,2,'sub2','数学','s20','赵德明'],
      ['t3','c11','高一(1)班','高一',1,3,'sub1','语文','s10','孙晓红'],
      ['t4','c11','高一(1)班','高一',1,4,'sub3','英语','s30','王美玲'],
      ['t5','c11','高一(1)班','高一',1,5,'sub4','物理','s40','周明辉'],
      ['t6','c12','高一(2)班','高一',1,1,'sub1','语文','s10','孙晓红'],
      ['t7','c12','高一(2)班','高一',1,2,'sub3','英语','s30','王美玲'],
    ];
    const insT = db.prepare('INSERT INTO timetable_entries VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const t of tt) insT.run(...t);

    // Exams
    const exams = [
      ['e1','高一期中考试','期中','高一','2026-11-09','2026-11-11'],
      ['e2','高二期中考试','期中','高二','2026-11-09','2026-11-11'],
    ];
    const insE = db.prepare('INSERT INTO exams VALUES (?,?,?,?,?,?)');
    for (const e of exams) insE.run(...e);

    // Exam sessions
    const sessions = [
      ['es1','e1','2026-11-09','08:00-10:00','sub1','语文',120],
      ['es2','e1','2026-11-09','14:00-16:00','sub2','数学',120],
      ['es3','e1','2026-11-10','08:00-10:00','sub3','英语',120],
    ];
    const insEs = db.prepare('INSERT INTO exam_sessions VALUES (?,?,?,?,?,?,?)');
    for (const s of sessions) insEs.run(...s);

    // Exam rooms
    const rooms = [
      ['er1','e1','教学楼3层301',30,'郭建国','林晓燕'],
      ['er2','e1','教学楼3层302',30,'刘志强','何静'],
    ];
    const insEr = db.prepare('INSERT INTO exam_rooms VALUES (?,?,?,?,?,?)');
    for (const r of rooms) insEr.run(...r);

    // Salary
    function mk(id,sid,name,base,bonus,ded,month,status) { return [id,sid,name,2026,month,base,bonus,ded,base+bonus-ded,status,null]; }
    const salaries = [
      mk('sa01','s01','郭建国',12000,3200,800,7,'待发放'),mk('sa02','s02','林晓燕',6500,1500,300,7,'待发放'),
      mk('sa03','s03','刘志强',11000,3000,700,7,'待发放'),mk('sa04','s04','何静',6000,1400,300,7,'待发放'),
      mk('sa10','s10','孙晓红',10000,2800,600,7,'待发放'),mk('sa11','s11','赵雅文',9000,2400,500,7,'待发放'),
      mk('sa12','s12','钱思远',7500,1900,400,7,'待发放'),mk('sa13','s13','周晓雯',7000,1800,350,7,'待发放'),
      mk('sa20','s20','赵德明',10500,2900,650,7,'待发放'),mk('sa21','s21','陈丽华',10000,2800,600,7,'待发放'),
      mk('sa22','s22','李志鹏',9000,2400,500,7,'待发放'),mk('sa23','s23','吴桐',7000,1800,350,7,'待发放'),
      mk('sa30','s30','王美玲',10000,2800,600,7,'待发放'),mk('sa31','s31','郑晓明',9000,2400,500,7,'待发放'),
      mk('sa32','s32','冯露',7500,1900,400,7,'待发放'),mk('sa33','s33','韩梅梅',7000,1800,350,7,'待发放'),
      mk('sa40','s40','周明辉',11000,3000,700,7,'待发放'),
      mk('sa41','s41','马超',7500,1900,400,7,'待发放'),
      mk('sa42','s42','吴秀英',9500,2500,550,7,'待发放'),mk('sa43','s43','朱明',7500,1900,400,7,'待发放'),
      mk('sa44','s44','郑文博',8500,2200,450,7,'待发放'),mk('sa45','s45','沈洁',6500,1700,350,7,'待发放'),
      mk('sa46','s70','许国栋',7000,1800,350,7,'待发放'),mk('sa47','s71','梁师傅',5500,1200,300,7,'待发放'),
    ];
    const insSa = db.prepare('INSERT INTO salary_records VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const s of salaries) insSa.run(...s);

    // Attendance
    const att = [
      ['a1','s01','郭建国','2026-07-20','07:55','17:05','正常',''],
      ['a2','s01','郭建国','2026-07-21','08:30','17:00','迟到','交通拥堵'],
      ['a3','s01','郭建国','2026-07-22','07:50','17:10','正常',''],
      ['a4','s21','陈丽华','2026-07-20','08:00','16:30','早退','个人原因'],
      ['a5','s21','陈丽华','2026-07-21','07:45','17:15','正常',''],
      ['a6','s03','刘志强','2026-07-20','08:10','17:00','正常',''],
      ['a7','s30','王美玲','2026-07-20','08:05','17:20','正常',''],
      ['a8','s10','孙晓红','2026-07-20','07:40','17:30','正常',''],
      ['a9','s10','孙晓红','2026-07-21','08:25','17:00','迟到',''],
      ['a10','s10','孙晓红','2026-07-22','07:55','16:45','早退','外出教研'],
      ['a11','s21','陈丽华','2026-07-22',null,null,'请假','事假'],
      ['a12','s70','许国栋','2026-07-20',null,null,'缺勤','未打卡'],
    ];
    const insAt = db.prepare('INSERT INTO attendance_records VALUES (?,?,?,?,?,?,?,?)');
    for (const a of att) insAt.run(...a);

    // Announcements
    const ann = [
      ['n1','关于开展暑期教师培训的通知','请高一、高二年级全体教师于8月20日前完成线上暑期培训课程。','2026-07-20','重要','高一','2026-08-25',0,null,null],
      ['n2','关于加强校园安全管理的紧急通知','接上级通知，近期需全面排查校园安全隐患。','2026-07-19','紧急','全体','2026-07-26',0,null,null],
      ['n3','高三年级毕业典礼安排','2026届高三毕业典礼定于7月25日上午9:00在学校礼堂举行。','2026-07-18','重要','高三','2026-07-25',0,null,null],
      ['n4','7月份工资发放时间调整通知','因银行系统维护，7月份工资将推迟至7月18日发放。','2026-07-15','普通','全体','2026-07-20',1,null,null],
      ['n5','高一年级家长会通知','定于7月28日下午2:30在各班教室召开高一年级期末家长会。','2026-07-16','普通','高一','2026-07-28',0,null,null],
      ['n6','高一(1)班期末动员','各位同学，期末考试即将到来，请认真复习。','2026-07-20','重要','高一','2026-07-28',0,'c11','高一(1)班'],
    ];
    const insAn = db.prepare('INSERT INTO announcements VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const a of ann) insAn.run(...a);

    // Students
    const firstNames = ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','艳','杰','军','秀英','涛','明','超','平','辉','玲','文','博','宇','轩','琪','瑶','峰','霖','昊','萱'];
    const lastNames = ['张','李','王','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡','郭','何','高','林','罗','郑','梁','宋','唐','韩','冯','董','程','曹','袁'];
    const genders = ['男','女'];
    const students = [];
    let stuIdx = 0;
    for (const cls of classes) {
      const studentCount = cls[6];
      const gradeDigit = cls[1] === '高一' ? '1' : cls[1] === '高二' ? '2' : '3';
      const classNum = cls[2].match(/(\d+)班/)?.[1] ?? '1';
      const classBaseNo = '2024' + gradeDigit + classNum.padStart(2, '0');
      for (let i = 0; i < studentCount; i++) {
        stuIdx++;
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        students.push([
          'stu' + stuIdx.toString().padStart(4, '0'),
          lastName + firstName,
          genders[Math.floor(Math.random() * 2)],
          cls[0],
          cls[2],
          classBaseNo + (i + 1).toString().padStart(2, '0'),
          '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
          '青云路' + (Math.floor(Math.random() * 100) + 1) + '号',
          2024,
          '在读'
        ]);
      }
    }
    const insStu = db.prepare('INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const s of students) insStu.run(...s);

    // Calendar events
    const calEvents = [
      ['cal1','第一学期开学','2026-09-01','2026-09-01','学期','2026-2027学年第一学期开学日'],
      ['cal2','中秋节放假','2026-09-15','2026-09-17','假期','中秋节假期3天'],
      ['cal3','国庆节放假','2026-10-01','2026-10-07','假期','国庆节假期7天'],
      ['cal4','期中考试周','2026-11-09','2026-11-13','考试','全校期中考试'],
      ['cal5','秋季运动会','2026-10-22','2026-10-23','活动','全校秋季田径运动会'],
      ['cal6','元旦放假','2027-01-01','2027-01-03','假期','元旦假期3天'],
      ['cal7','期末考试周','2027-01-12','2027-01-16','考试','第一学期期末考试'],
      ['cal8','寒假开始','2027-01-18','2027-02-14','假期','寒假4周'],
      ['cal9','第二学期开学','2027-02-15','2027-02-15','学期','2026-2027学年第二学期开学日'],
      ['cal10','清明放假','2027-04-05','2027-04-05','假期','清明节放假1天'],
      ['cal11','期中考试周','2027-04-19','2027-04-23','考试','全校期中考试'],
      ['cal12','劳动节放假','2027-05-01','2027-05-05','假期','劳动节假期5天'],
      ['cal13','高考','2027-06-07','2027-06-09','考试','全国高考'],
      ['cal14','期末考试周','2027-06-21','2027-06-25','考试','第二学期期末考试'],
      ['cal15','暑假开始','2027-06-28','2027-08-31','假期','暑假约9周'],
      ['cal16','高三一模','2027-03-15','2027-03-16','考试','高三年级第一次模拟考试'],
      ['cal17','高三二模','2027-04-26','2027-04-27','考试','高三年级第二次模拟考试'],
      ['cal18','校园开放日','2027-05-15','2027-05-15','活动','校园开放日，欢迎家长参观'],
    ];
    const insCal = db.prepare('INSERT INTO calendar_events VALUES (?,?,?,?,?,?)');
    for (const e of calEvents) insCal.run(...e);

    // Users (password: 123456 hashed with bcryptjs)
    const bcrypt = require('bcryptjs');
    const users = [
      ['u1','admin',bcrypt.hashSync('admin123',10),'admin','s01','郭建国'],
      ['u2','s10',bcrypt.hashSync('123456',10),'teacher','s10','孙晓红'],
      ['u3','s20',bcrypt.hashSync('123456',10),'teacher','s20','赵德明'],
      ['u4','s21',bcrypt.hashSync('123456',10),'teacher','s21','陈丽华'],
      ['u5','s30',bcrypt.hashSync('123456',10),'teacher','s30','王美玲'],
    ];
    const insUser = db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)');
    for (const u of users) insUser.run(...u);
  });
  doSeed();
}

module.exports = { getDb, ensureDb, DB_PATH };
