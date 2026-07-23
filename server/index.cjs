const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDb, ensureDb } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

const distPath = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: e.message });
  }
});

// Serve static frontend in production
app.use(express.static(distPath));

// ===== UTILITY =====
function crud(table, idField = 'id') {
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
        const db = getDb();
        const keys = Object.keys(req.body);
        const vals = Object.values(req.body);
        const placeholders = keys.map(() => '?').join(',');
        db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(...vals);
        res.status(201).json(req.body);
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    update: (req, res) => {
      try {
        const db = getDb();
        const keys = Object.keys(req.body);
        const vals = Object.values(req.body);
        const sets = keys.map(k => `${k} = ?`).join(',');
        db.prepare(`UPDATE ${table} SET ${sets} WHERE ${idField} = ?`).run(...vals, req.params.id);
        res.json({ id: req.params.id, ...req.body });
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
    delete: (req, res) => {
      try {
        const db = getDb();
        db.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`).run(req.params.id);
        res.json({ success: true });
      } catch (e) { res.status(500).json({ error: e.message }); }
    },
  };
}

// ===== ROUTES =====

// Staff
const staffApi = crud('staff');
app.get('/api/staff', staffApi.list);
app.get('/api/staff/:id', staffApi.get);
app.post('/api/staff', staffApi.create);
app.put('/api/staff/:id', staffApi.update);
app.delete('/api/staff/:id', staffApi.delete);

// Salary
const salaryApi = crud('salary_records');
app.get('/api/salary', salaryApi.list);
app.get('/api/salary/:id', salaryApi.get);
app.post('/api/salary', salaryApi.create);
app.put('/api/salary/:id', salaryApi.update);
app.delete('/api/salary/:id', salaryApi.delete);

// Attendance
const attendanceApi = crud('attendance_records');
app.get('/api/attendance', attendanceApi.list);
app.get('/api/attendance/:id', attendanceApi.get);
app.post('/api/attendance', attendanceApi.create);
app.put('/api/attendance/:id', attendanceApi.update);
app.delete('/api/attendance/:id', attendanceApi.delete);

// Classes
const classApi = crud('classes');
app.get('/api/classes', classApi.list);
app.get('/api/classes/:id', classApi.get);
app.post('/api/classes', classApi.create);
app.put('/api/classes/:id', classApi.update);
app.delete('/api/classes/:id', classApi.delete);

// Subjects
const subjectApi = crud('subjects');
app.get('/api/subjects', subjectApi.list);
app.get('/api/subjects/:id', subjectApi.get);
app.post('/api/subjects', subjectApi.create);
app.put('/api/subjects/:id', subjectApi.update);
app.delete('/api/subjects/:id', subjectApi.delete);

// Grade Courses
const courseApi = crud('grade_courses');
app.get('/api/courses', courseApi.list);
app.get('/api/courses/:id', courseApi.get);
app.post('/api/courses', courseApi.create);
app.put('/api/courses/:id', courseApi.update);
app.delete('/api/courses/:id', courseApi.delete);

// Timetable
const timetableApi = crud('timetable_entries');
app.get('/api/timetable', timetableApi.list);
app.get('/api/timetable/:id', timetableApi.get);
app.post('/api/timetable', timetableApi.create);
app.put('/api/timetable/:id', timetableApi.update);
app.delete('/api/timetable/:id', timetableApi.delete);

// Exams
const examApi = crud('exams');
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
const examSessionApi = crud('exam_sessions');
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
const examRoomApi = crud('exam_rooms');
app.post('/api/exam-rooms', examRoomApi.create);
app.put('/api/exam-rooms/:id', examRoomApi.update);
app.delete('/api/exam-rooms/:id', examRoomApi.delete);

// Announcements
const announcementApi = crud('announcements');
app.get('/api/announcements', announcementApi.list);
app.get('/api/announcements/:id', announcementApi.get);
app.post('/api/announcements', announcementApi.create);
app.put('/api/announcements/:id', announcementApi.update);
app.delete('/api/announcements/:id', announcementApi.delete);

// Dashboard metrics
app.get('/api/metrics', (req, res) => {
  try {
    const db = getDb();
    const classes = db.prepare("SELECT COUNT(*) as c FROM classes WHERE status = '在读'").get();
    const staff = db.prepare("SELECT COUNT(*) as c FROM staff WHERE status = '在职'").get();
    const students = db.prepare('SELECT SUM(studentCount) as c FROM classes WHERE status = ?').get('在读');
    const pending = db.prepare("SELECT COUNT(*) as c FROM salary_records WHERE status = '待发放' AND month = 7").get();
    const late = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE status = '迟到' AND date >= '2026-07-01'").get();
    const absent = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE status = '缺勤' AND date >= '2026-07-01'").get();

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
    res.json({
      id: '1', name: '青云高级中学', region: '海淀区', type: '公立', level: '高中',
      contact: '张校长', phone: '010-66001234', address: '北京市海淀区青云路18号',
      studentCount: students.c || 0, staffCount: staff.c,
    });
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

// Wait for DB then start
ensureDb().then(() => {
  // Startup diagnostics
  console.log('dist path:', distPath);
  console.log('dist exists:', fs.existsSync(distPath));
  console.log('index.html exists:', fs.existsSync(path.join(distPath, 'index.html')));

  try {
    const db = getDb();
    const staffCount = db.prepare('SELECT COUNT(*) as c FROM staff').get();
    console.log('Database OK - staff count:', staffCount.c);
  } catch (e) {
    console.error('Database init failed:', e.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
