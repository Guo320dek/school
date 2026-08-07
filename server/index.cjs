const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { WebSocketServer } = require('ws');
const { getDb, ensureDb, DB_PATH } = require('./db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'school-management-secret-key-2026';
const TOKEN_EXPIRY = '24h';

const app = express();
const PORT = process.env.PORT || 3001;

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const wsClients = new Set();
wss.on('connection', (ws) => { wsClients.add(ws); ws.on('close', () => wsClients.delete(ws)); });
function broadcast(table) {
  const msg = JSON.stringify({ type: 'change', table });
  for (const ws of wsClients) { try { ws.send(msg); } catch {} }
}

const distPath = path.join(__dirname, '..', 'dist');

// CORS: allow all origins. The app serves frontend & API from same origin,
// but Vite's crossorigin attributes on script/link tags require CORS headers.
app.use(cors({ origin: true }));
app.use(express.json());

// Health check — returns DB status, uptime, table info for Railway diagnostics
app.get('/api/health', (_req, res) => {
  const info = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    node: process.version,
    db: dbStatus,
    dbError: dbError || null,
    tables: 0,
    staffCount: 0,
  };
  if (dbStatus !== 'connected') {
    return res.status(503).json(info);
  }
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    const tables = db.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get();
    info.tables = tables.c;
    const staff = db.prepare('SELECT COUNT(*) as c FROM staff').get();
    info.staffCount = staff.c;
    res.json(info);
  } catch (e) {
    info.status = 'error';
    info.db = 'error';
    info.dbError = e.message;
    res.status(500).json(info);
  }
});

// Serve static frontend in production
app.use(express.static(distPath));

// ===== AUTH =====
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {}
  }
  next();
}

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '请输入账号和密码' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, staffId: user.staffId, displayName: user.displayName },
      JWT_SECRET, { expiresIn: TOKEN_EXPIRY }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, staffId: user.staffId, displayName: user.displayName } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
function crud(table, idField = 'id', allowedFields = null) {
  const VALID_TABLES = [
    'staff', 'salary_records', 'attendance_records',
    'classes', 'subjects', 'grade_courses', 'timetable_entries',
    'exams', 'exam_sessions', 'exam_rooms', 'announcements', 'students', 'calendar_events',
  ];
  if (!VALID_TABLES.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  function filterBody(body) {
    if (!allowedFields) return body;
    const filtered = {};
    for (const f of allowedFields) {
      if (body[f] !== undefined) filtered[f] = body[f];
    }
    return filtered;
  }
  return {
    list: (req, res) => {
      try {
        const db = getDb();
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        if (table === 'announcements') rows.forEach(r => r.isExpired = !!r.isExpired);
        res.json(rows);
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    get: (req, res) => {
      try {
        const db = getDb();
        const row = db.prepare(`SELECT * FROM ${table} WHERE ${idField} = ?`).get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (table === 'announcements') row.isExpired = !!row.isExpired;
        res.json(row);
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    create: (req, res) => {
      try {
        const body = filterBody(req.body);
        const keys = Object.keys(body);
        if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
        const db = getDb();
        const vals = Object.values(body);
        const placeholders = keys.map(() => '?').join(',');
        db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(...vals);
        broadcast(table);
        res.status(201).json(body);
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    update: (req, res) => {
      try {
        const body = filterBody(req.body);
        const keys = Object.keys(body);
        if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
        const db = getDb();
        const vals = Object.values(body);
        const sets = keys.map(k => `${k} = ?`).join(',');
        db.prepare(`UPDATE ${table} SET ${sets} WHERE ${idField} = ?`).run(...vals, req.params.id);
        broadcast(table);
        res.json({ id: req.params.id, ...body });
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    delete: (req, res) => {
      try {
        const db = getDb();
        db.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`).run(req.params.id);
        broadcast(table);
        res.json({ success: true });
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
  };
}

// ===== ROUTES =====

// Staff
const staffApi = crud('staff', 'id', ['name','staffNo','department','position','title','education','major','phone','hireDate','contractStart','contractEnd','status','remark']);
app.get('/api/staff', staffApi.list);
app.get('/api/staff/:id', staffApi.get);
app.post('/api/staff', (req, res, next) => {
  if (req.body.staffNo) {
    const db = getDb();
    const dup = db.prepare('SELECT id FROM staff WHERE staffNo = ? AND id != ?').get(req.body.staffNo, req.body.id || '');
    if (dup) return res.status(409).json({ error: `工号 ${req.body.staffNo} 已存在` });
  }
  staffApi.create(req, res, next);
});
app.put('/api/staff/:id', staffApi.update);
app.delete('/api/staff/:id', staffApi.delete);

// Salary
const salaryApi = crud('salary_records', 'id', ['staffId','staffName','year','month','basePay','bonus','deduction','total','status','paidDate']);
app.get('/api/salary', salaryApi.list);
app.get('/api/salary/:id', salaryApi.get);
app.post('/api/salary', salaryApi.create);
app.put('/api/salary/:id', salaryApi.update);
app.delete('/api/salary/:id', salaryApi.delete);

// Attendance
const attendanceApi = crud('attendance_records', 'id', ['staffId','staffName','date','checkIn','checkOut','status','remark']);
app.get('/api/attendance', attendanceApi.list);
app.get('/api/attendance/:id', attendanceApi.get);
app.post('/api/attendance', attendanceApi.create);
app.put('/api/attendance/:id', attendanceApi.update);
app.delete('/api/attendance/:id', attendanceApi.delete);

// Classes
const classApi = crud('classes', 'id', ['name','grade','track','homeroomTeacher','room','studentCount','maxStudents','status','graduateYear']);
app.get('/api/classes', classApi.list);
app.get('/api/classes/:id', classApi.get);
app.post('/api/classes', classApi.create);
app.put('/api/classes/:id', classApi.update);
app.delete('/api/classes/:id', classApi.delete);

// Subjects
const subjectApi = crud('subjects', 'id', ['name','category','teacherIds']);
app.get('/api/subjects', subjectApi.list);
app.get('/api/subjects/:id', subjectApi.get);
app.post('/api/subjects', subjectApi.create);
app.put('/api/subjects/:id', subjectApi.update);
app.delete('/api/subjects/:id', subjectApi.delete);

// Grade Courses
const courseApi = crud('grade_courses', 'id', ['grade','subjectId','subjectName','weeklyHours','teacherId','teacherName']);
app.get('/api/courses', courseApi.list);
app.get('/api/courses/:id', courseApi.get);
app.post('/api/courses', courseApi.create);
app.put('/api/courses/:id', courseApi.update);
app.delete('/api/courses/:id', courseApi.delete);

// Timetable
const timetableApi = crud('timetable_entries', 'id', ['classId','className','grade','dayOfWeek','period','subjectId','subjectName','teacherId','teacherName']);
app.get('/api/timetable/conflicts', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT t1.id, t1.teacherId, t1.teacherName, t1.dayOfWeek, t1.period,
             t1.subjectName, t1.className as class1, t2.className as class2
      FROM timetable_entries t1
      JOIN timetable_entries t2 ON t1.teacherId = t2.teacherId
        AND t1.dayOfWeek = t2.dayOfWeek AND t1.period = t2.period
        AND t1.id < t2.id
    `).all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/timetable', timetableApi.list);
app.get('/api/timetable/:id', timetableApi.get);
app.post('/api/timetable', timetableApi.create);
app.put('/api/timetable/:id', timetableApi.update);
app.delete('/api/timetable/:id', timetableApi.delete);

// Exams
const examApi = crud('exams', 'id', ['name','type','grade','startDate','endDate']);
app.get('/api/exams', examApi.list);
app.get('/api/exams/:id', examApi.get);
app.post('/api/exams', examApi.create);
app.put('/api/exams/:id', examApi.update);
app.delete('/api/exams/:id', examApi.delete);

// Exam Sessions (filtered by examId)
app.get('/api/exam-sessions', (req, res) => {
  try {
    const { examId } = req.query;
    const db = getDb();
    if (examId) {
      res.json(db.prepare('SELECT * FROM exam_sessions WHERE examId = ?').all(examId));
    } else {
      res.json(db.prepare('SELECT * FROM exam_sessions').all());
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
const examSessionApi = crud('exam_sessions', 'id', ['examId','date','timeSlot','subjectId','subjectName','duration']);
app.post('/api/exam-sessions', examSessionApi.create);
app.put('/api/exam-sessions/:id', examSessionApi.update);
app.delete('/api/exam-sessions/:id', examSessionApi.delete);

// Exam Rooms (filtered by examId)
app.get('/api/exam-rooms', (req, res) => {
  try {
    const { examId } = req.query;
    const db = getDb();
    if (examId) {
      res.json(db.prepare('SELECT * FROM exam_rooms WHERE examId = ?').all(examId));
    } else {
      res.json(db.prepare('SELECT * FROM exam_rooms').all());
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
const examRoomApi = crud('exam_rooms', 'id', ['examId','room','capacity','invigilator1','invigilator2']);
app.post('/api/exam-rooms', examRoomApi.create);
app.put('/api/exam-rooms/:id', examRoomApi.update);
app.delete('/api/exam-rooms/:id', examRoomApi.delete);

// Announcements
const announcementApi = crud('announcements', 'id', ['title','content','date','priority','target','expireDate','isExpired','classId','className']);
app.get('/api/announcements', announcementApi.list);
app.get('/api/announcements/:id', announcementApi.get);
app.post('/api/announcements', announcementApi.create);
app.put('/api/announcements/:id', announcementApi.update);
app.delete('/api/announcements/:id', announcementApi.delete);

// Calendar events
const calendarApi = crud('calendar_events', 'id', ['title','date','endDate','type','description']);
app.get('/api/calendar', calendarApi.list);
app.get('/api/calendar/:id', calendarApi.get);
app.post('/api/calendar', calendarApi.create);
app.put('/api/calendar/:id', calendarApi.update);
app.delete('/api/calendar/:id', calendarApi.delete);

// Students (with auto-sync class studentCount)
const studentApi = crud('students', 'id', ['name','gender','classId','className','studentNo','phone','address','enrollmentYear','status']);
app.get('/api/students', studentApi.list);
app.get('/api/students/:id', studentApi.get);

app.post('/api/students', (req, res, next) => {
  // Validate unique studentNo
  if (req.body.studentNo) {
    const db = getDb();
    const dup = db.prepare('SELECT id FROM students WHERE studentNo = ? AND id != ?').get(req.body.studentNo, req.body.id || '');
    if (dup) return res.status(409).json({ error: `学号 ${req.body.studentNo} 已存在` });
  }
  const origJson = res.json.bind(res);
  res.json = function(body) {
    try {
      const db = getDb();
      const classId = body.classId;
      if (classId) {
        db.prepare('UPDATE classes SET studentCount = studentCount + 1 WHERE id = ?').run(classId);
        broadcast('classes');
      }
    } catch {}
    return origJson(body);
  };
  studentApi.create(req, res, next);
});

app.put('/api/students/:id', (req, res, next) => {
  // Get old class before update
  const old = getDb().prepare('SELECT classId FROM students WHERE id = ?').get(req.params.id);
  const origJson = res.json.bind(res);
  res.json = function(body) {
    try {
      const db = getDb();
      const newClassId = body.classId;
      const oldClassId = old?.classId;
      if (newClassId && oldClassId && newClassId !== oldClassId) {
        db.prepare('UPDATE classes SET studentCount = studentCount - 1 WHERE id = ? AND studentCount > 0').run(oldClassId);
        db.prepare('UPDATE classes SET studentCount = studentCount + 1 WHERE id = ?').run(newClassId);
        broadcast('classes');
      }
    } catch {}
    return origJson(body);
  };
  studentApi.update(req, res, next);
});

app.delete('/api/students/:id', (req, res, next) => {
  const old = getDb().prepare('SELECT classId FROM students WHERE id = ?').get(req.params.id);
  const origJson = res.json.bind(res);
  res.json = function(body) {
    try {
      const db = getDb();
      if (old?.classId) {
        db.prepare('UPDATE classes SET studentCount = studentCount - 1 WHERE id = ? AND studentCount > 0').run(old.classId);
        broadcast('classes');
      }
    } catch {}
    return origJson(body);
  };
  studentApi.delete(req, res, next);
});

// ===== SCORES =====
app.get('/api/scores', (req, res) => {
  try {
    const db = getDb();
    const { examId, classId, subjectId } = req.query;
    let sql = 'SELECT * FROM exam_scores WHERE 1=1';
    const params = [];
    if (examId) { sql += ' AND examId = ?'; params.push(examId); }
    if (classId) { sql += ' AND classId = ?'; params.push(classId); }
    if (subjectId) { sql += ' AND subjectId = ?'; params.push(subjectId); }
    sql += ' ORDER BY subjectId, score DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/scores', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { scores } = req.body;
    if (!scores || !Array.isArray(scores)) return res.status(400).json({ error: 'scores array required' });
    const insert = db.prepare('INSERT OR REPLACE INTO exam_scores (id, examId, examSessionId, studentId, studentName, classId, className, subjectId, subjectName, score) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const transaction = db.transaction((items) => {
      for (const s of items) {
        const id = `${s.examId}_${s.studentId}_${s.subjectId}`;
        insert.run(id, s.examId, s.examSessionId || null, s.studentId, s.studentName || '', s.classId || '', s.className || '', s.subjectId, s.subjectName || '', s.score);
      }
    });
    transaction(scores);
    broadcast('exam_scores');
    res.json({ success: true, count: scores.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/scores/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { score } = req.body;
    db.prepare('UPDATE exam_scores SET score = ? WHERE id = ?').run(score, req.params.id);
    broadcast('exam_scores');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/scores/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM exam_scores WHERE id = ?').run(req.params.id);
    broadcast('exam_scores');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/scores/summary', (req, res) => {
  try {
    const db = getDb();
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ error: 'examId required' });
    const rows = db.prepare(`
      SELECT subjectId, subjectName, classId, className,
             ROUND(AVG(score), 1) as avgScore,
             MAX(score) as maxScore, MIN(score) as minScore,
             COUNT(*) as count
      FROM exam_scores WHERE examId = ?
      GROUP BY subjectId, classId
      ORDER BY subjectId, classId
    `).all(examId);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dashboard metrics
app.get('/api/metrics', (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const classes = db.prepare("SELECT COUNT(*) as c FROM classes WHERE status = '在读'").get();
    const staff = db.prepare("SELECT COUNT(*) as c FROM staff WHERE status = '在职'").get();
    const students = db.prepare('SELECT SUM(studentCount) as c FROM classes WHERE status = ?').get('在读');
    const pending = db.prepare("SELECT COUNT(*) as c FROM salary_records WHERE status = '待发放' AND month = ?").get(currentMonth);
    const late = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE status = '迟到' AND date >= ?").get(monthStart);
    const absent = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE status = '缺勤' AND date >= ?").get(monthStart);

    res.json([
      { title: '在读班级', value: classes.c, unit: '个', trend: 'stable', icon: 'book' },
      { title: '在职教职工', value: staff.c, unit: '人', trend: 'stable', icon: 'team' },
      { title: '在校学生', value: students.c || 0, unit: '人', trend: 'up', icon: 'student' },
      { title: '本月工资待发', value: pending.c, unit: '笔', trend: 'down', icon: 'dollar' },
      { title: '本月迟到人次', value: late.c, unit: '次', trend: 'down', icon: 'clock' },
      { title: '本月缺勤人次', value: absent.c, unit: '次', trend: 'stable', icon: 'warning' },
    ]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// School info
app.get('/api/school', (req, res) => {
  try {
    const db = getDb();
    const students = db.prepare('SELECT SUM(studentCount) as c FROM classes WHERE status = ?').get('在读');
    const staff = db.prepare("SELECT COUNT(*) as c FROM staff WHERE status = '在职'").get();
    const classes = db.prepare("SELECT COUNT(*) as c FROM classes WHERE status = '在读'").get();
    const courses = db.prepare('SELECT COUNT(*) as c FROM grade_courses').get();
    res.json({
      id: '1', name: '青云高级中学', region: '海淀区', type: '公立', level: '高中',
      contact: '张校长', phone: '010-66001234', address: '北京市海淀区青云路18号',
      studentCount: students.c || 0, staffCount: staff.c,
      classCount: classes.c || 0, courseCount: courses.c || 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Homeroom: get the class where logged-in teacher is homeroom teacher
app.get('/api/teacher/my-class', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.user.staffId);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    const cls = db.prepare("SELECT * FROM classes WHERE status = '在读' AND homeroomTeacher = ?").get(staff.name);
    if (!cls) return res.json({ cls: null });
    res.json({ cls });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Global search
app.get('/api/search', (req, res) => {
  try {
    const db = getDb();
    const q = req.query.q;
    if (!q) return res.json({ results: [] });
    const like = `%${q}%`;
    const results = [];
    const students = db.prepare('SELECT id, name, className, studentNo FROM students WHERE name LIKE ? OR studentNo LIKE ? LIMIT 5').all(like, like);
    students.forEach((s) => results.push({ type: 'student', id: s.id, title: s.name, subtitle: `${s.className} · ${s.studentNo}`, url: '/teaching/students' }));
    const staff = db.prepare('SELECT id, name, department, position FROM staff WHERE name LIKE ? OR staffNo LIKE ? LIMIT 5').all(like, like);
    staff.forEach((s) => results.push({ type: 'staff', id: s.id, title: s.name, subtitle: `${s.department} · ${s.position}`, url: '/hr/staff' }));
    const classes = db.prepare('SELECT id, name, grade, track FROM classes WHERE name LIKE ? LIMIT 3').all(like);
    classes.forEach((c) => results.push({ type: 'class', id: c.id, title: c.name, subtitle: `${c.grade} · ${c.track}`, url: '/teaching/class' }));
    res.json({ results: results.slice(0, 10) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback: serve index.html for all non-API routes
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// ===== STARTUP: Open port first, init DB in background =====
// Railway needs the port open immediately for health checks.
// DB init errors are surfaced through /api/health instead of crashing.
let dbStatus = 'initializing';
let dbError = null;

console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || '(not set)'}`);
console.log(`[startup] DB path: ${DB_PATH}`);
console.log(`[startup] dist path: ${distPath}`);
console.log(`[startup] dist exists: ${fs.existsSync(distPath)}`);

// Open port immediately
httpServer.listen(PORT, () => {
  console.log(`[startup] Server listening on port ${PORT} (DB initializing...)`);
});
httpServer.on('error', (err) => {
  console.error(`[startup] Server listen error: ${err.message}`);
  process.exit(1);
});

// Init DB in background with a timeout safety net
const DB_INIT_TIMEOUT = 30000;
const dbInitTimer = setTimeout(() => {
  if (dbStatus === 'initializing') {
    console.error('[startup] DB init timed out after 30s');
    dbStatus = 'error';
    dbError = 'DB initialization timed out';
  }
}, DB_INIT_TIMEOUT);

ensureDb()
  .then(() => {
    clearTimeout(dbInitTimer);
    try {
      const db = getDb();
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      console.log(`[startup] DB tables: ${tables.map(t => t.name).join(', ')}`);
      const staffCount = db.prepare('SELECT COUNT(*) as c FROM staff').get();
      console.log(`[startup] DB OK – staff count: ${staffCount.c}`);
      dbStatus = 'connected';
    } catch (e) {
      console.error(`[startup] DB verification failed: ${e.message}`);
      dbStatus = 'error';
      dbError = e.message;
    }
  })
  .catch((err) => {
    clearTimeout(dbInitTimer);
    console.error(`[startup] ensureDb failed: ${err.message || err}`);
    dbStatus = 'error';
    dbError = err.message || String(err);
  });
