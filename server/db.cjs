const sqlPromise = require('sql.js');
const path = require('path');
const fs = require('fs');

// Use Railway volume if available, otherwise local file (or /tmp on Vercel)
const VOL_PATH = '/data/data.db';
const TMP_PATH = '/tmp/data.db';
const LOCAL_PATH = path.join(__dirname, 'data.db');

let DB_PATH;
if (fs.existsSync('/data')) {
  DB_PATH = VOL_PATH;
} else if (process.env.VERCEL || process.env.NOW) {
  DB_PATH = TMP_PATH;
} else {
  DB_PATH = LOCAL_PATH;
}
console.log('Using DB path:', DB_PATH);

let db;
let dbReady = false;

function saveToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Failed to save DB:', e.message);
  }
}

// Auto-save every 30 seconds
setInterval(saveToDisk, 30000);

// Wrap sql.js prepared statement with better-sqlite3-like API
function wrapStmt(stmt, columnNames) {
  return {
    run(...params) {
      stmt.bind(params);
      stmt.step();
      stmt.free();
      saveToDisk();
    },
    get(...params) {
      stmt.bind(params);
      if (stmt.step()) {
        const row = {};
        columnNames.forEach((col, i) => { row[col] = stmt.get()[i]; });
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        const row = {};
        columnNames.forEach((col, i) => { row[col] = stmt.get()[i]; });
        rows.push(row);
      }
      stmt.free();
      return rows;
    },
  };
}

function prepare(sql) {
  const stmt = db.prepare(sql);
  // Parse column names from sql (simple regex for CREATE/INSERT/SELECT)
  const colMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  let cols = [];
  if (colMatch && colMatch[1] !== '*') {
    cols = colMatch[1].split(',').map(c => {
      const asMatch = c.trim().match(/(?:AS\s+)?(\w+)$/i);
      return asMatch ? asMatch[1] : c.trim().replace(/^.*\./, '');
    });
  }
  // If SELECT *, get all columns after first step
  const origGet = stmt.get;
  const withCols = wrapStmt(stmt, cols);
  // Override get/all to dynamically detect columns from SELECT *
  if (!cols.length && /SELECT\s+\*/i.test(sql)) {
    const origBind = stmt.bind.bind(stmt);
    const origStep = stmt.step.bind(stmt);
    return {
      run(...params) {
        stmt.bind(params);
        stmt.step();
        stmt.free();
        saveToDisk();
      },
      get(...params) {
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          rows.push(row);
        }
        stmt.free();
        return rows;
      },
    };
  }
  return withCols;
}

function exec(sql) {
  db.run(sql);
  saveToDisk();
}

function transaction(fn) {
  return (...args) => {
    try {
      db.run('BEGIN');
      fn(...args);
      db.run('COMMIT');
      saveToDisk();
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  };
}

async function ensureDb() {
  if (dbReady) return db;
  const SQL = await sqlPromise();
  let buffer;
  try {
    buffer = fs.readFileSync(DB_PATH);
  } catch {
    buffer = null;
  }
  db = new SQL.Database(buffer);
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = MEMORY');
  initSchema();
  dbReady = true;
  saveToDisk();
  return db;
}

function getDb() {
  if (!dbReady) throw new Error('DB not ready - call ensureDb first');
  return { prepare, exec, transaction };
}

function initSchema() {
  db.run(`
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

  // Check if seed needed
  const count = prepare('SELECT COUNT(*) as c FROM staff').get();
  if (!count || count.c === 0) seed();
}

function seed() {
  // Use the same seed data but in a single transaction
  try {
    db.run('BEGIN');
    const doSeed = () => {
      // Staff
      const staff = [
        ['s01','郭建国','T2015001','教务处','教务主任','高级教师','硕士','教育管理','13801010001','2010-09-01','2024-09-01','2027-08-31','在职',''],
        ['s02','林晓燕','T2019002','教务处','教务员','','本科','行政管理','13801010002','2019-03-01','2025-03-01','2028-02-28','在职',''],
        ['s10','孙晓红','T2008010','年级组','语文教师','特级教师','本科','汉语言文学','13802010001','2008-09-01','2025-09-01','2028-08-31','在职','学科带头人'],
        ['s11','赵雅文','T2017011','年级组','语文教师','一级教师','硕士','古代文学','13802010002','2017-07-01','2025-09-01','2028-08-31','在职',''],
        ['s20','赵德明','T2016020','年级组','数学教师','高级教师','硕士','应用数学','13802020001','2016-07-01','2025-09-01','2028-08-31','在职',''],
        ['s21','陈丽华','T2012021','年级组','数学教师','高级教师','本科','数学教育','13802020002','2012-07-01','2025-09-01','2028-08-31','在职','高三组长'],
        ['s30','王美玲','T2011030','年级组','英语教师','高级教师','硕士','英语语言文学','13802030001','2011-09-01','2024-09-01','2027-08-31','在职',''],
        ['s40','周明辉','T2013040','年级组','物理教师','高级教师','博士','理论物理','13802040001','2013-09-01','2024-09-01','2027-08-31','在职',''],
        ['s42','吴秀英','T2017042','年级组','化学教师','一级教师','硕士','化学教育','13802040003','2017-07-01','2026-02-01','2029-01-31','在职',''],
        ['s44','郑文博','T2020044','年级组','生物教师','一级教师','硕士','生物科学','13802040005','2020-09-01','2025-09-01','2028-08-31','在职',''],
        ['s50','黄丽萍','T2015050','年级组','历史教师','高级教师','硕士','中国史','13802050001','2015-09-01','2024-09-01','2027-08-31','在职',''],
        ['s52','陈晓宇','T2018052','年级组','地理教师','一级教师','硕士','自然地理','13802050003','2018-09-01','2026-02-01','2029-01-31','在职',''],
        ['s54','高洁','T2016054','年级组','政治教师','一级教师','硕士','法学','13802050005','2016-09-01','2025-03-01','2028-02-28','在职',''],
      ];
      const insS = db.prepare('INSERT INTO staff VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      for (const s of staff) { insS.run(s); insS.reset(); }
      insS.free();

      // Classes
      const classes = [
        ['c11','高一','高一(1)班','物化生','孙晓红','301',45,55,'在读',null],
        ['c12','高一','高一(2)班','物化地','赵德明','302',42,55,'在读',null],
        ['c13','高一','高一(3)班','史地政','陈丽华','303',40,55,'在读',null],
        ['c21','高二','高二(1)班','物化生','王美玲','401',43,55,'在读',null],
        ['c22','高二','高二(2)班','物化地','周明辉','402',38,55,'在读',null],
        ['c31','高三','高三(1)班','物化生','黄丽萍','501',40,55,'在读',null],
      ];
      const insC = db.prepare('INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?)');
      for (const c of classes) { insC.run(c); insC.reset(); }
      insC.free();

      // Subjects
      const subjects = [
        ['sub1','语文','主科','["s10","s11"]'],
        ['sub2','数学','主科','["s20","s21"]'],
        ['sub3','英语','主科','["s30"]'],
        ['sub4','物理','选考','["s40"]'],
        ['sub5','化学','选考','["s42"]'],
        ['sub6','生物','选考','["s44"]'],
        ['sub7','历史','选考','["s50"]'],
        ['sub8','地理','选考','["s52"]'],
        ['sub9','政治','选考','["s54"]'],
      ];
      const insSub = db.prepare('INSERT INTO subjects VALUES (?,?,?,?)');
      for (const s of subjects) { insSub.run(s); insSub.reset(); }
      insSub.free();

      // Users
      const bcrypt = require('bcryptjs');
      const users = [
        ['u1','admin',bcrypt.hashSync('admin123',10),'admin','s01','郭建国'],
        ['u2','s10',bcrypt.hashSync('123456',10),'teacher','s10','孙晓红'],
        ['u3','s20',bcrypt.hashSync('123456',10),'teacher','s20','赵德明'],
        ['u4','s21',bcrypt.hashSync('123456',10),'teacher','s21','陈丽华'],
      ];
      const insU = db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)');
      for (const u of users) { insU.run(u); insU.reset(); }
      insU.free();
    };
    doSeed();
    db.run('COMMIT');
    saveToDisk();
  } catch (e) {
    db.run('ROLLBACK');
    console.error('Seed failed:', e.message);
  }
}

module.exports = { getDb, ensureDb, DB_PATH };
