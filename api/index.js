const app = require('../server/index.cjs');
const { ensureDb } = require('../server/db.cjs');

const dbPromise = ensureDb().catch(err => {
  console.error('DB init failed:', err.message);
  return null;
});

module.exports = async (req, res) => {
  try {
    await dbPromise;
    app(req, res);
  } catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: 'Internal server error', detail: e.message });
  }
};
