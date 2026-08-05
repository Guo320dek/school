const app = require('../server/index.cjs');
const { ensureDb } = require('../server/db.cjs');

let dbReady = false;
const dbPromise = ensureDb().then(() => { dbReady = true; }).catch(err => {
  console.error('DB init failed:', err.message);
});

module.exports = async (req, res) => {
  await dbPromise;
  app(req, res);
};
