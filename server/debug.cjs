const express = require('express');
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', node: process.version });
});

app.get('/api/debug', (_req, res) => {
  const info = { node: process.version, cwd: process.cwd(), arch: process.arch, platform: process.platform };
  try {
    const sql = require('sql.js');
    info.sql = typeof sql === 'function' ? 'init function' : typeof sql;
  } catch (e) {
    info.sql_error = e.message;
  }
  try {
    const ws = require('ws');
    info.ws = 'ok';
  } catch (e) {
    info.ws_error = e.message;
  }
  try {
    const db = require('./db.cjs');
    info.db_module = 'loaded';
    info.db_keys = Object.keys(db);
  } catch (e) {
    info.db_error = e.message;
    info.db_stack = e.stack?.split('\n').slice(0, 4).join('\n');
  }
  res.json(info);
});

app.listen(PORT, () => console.log('Debug server on port', PORT));
