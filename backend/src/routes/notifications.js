const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  const [[{ unread }]] = await pool.execute(
    'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [req.user.id]
  );
  res.json({ notifications: rows, unread });
});

router.patch('/read-all', authenticate, async (req, res) => {
  await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
  res.json({ message: 'All marked as read' });
});

router.patch('/:id/read', authenticate, async (req, res) => {
  await pool.execute(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Marked as read' });
});

module.exports = router;
