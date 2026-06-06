const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Conversations list
router.get('/conversations', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
       CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS contact_id,
       u.username, u.display_name, u.avatar_url,
       m.message AS last_message,
       m.created_at AS last_at,
       SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) AS unread
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
     WHERE m.sender_id = ? OR m.receiver_id = ?
     GROUP BY contact_id, u.username, u.display_name, u.avatar_url, m.message, m.created_at
     ORDER BY m.created_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
  );
  res.json({ conversations: rows });
});

// Messages with a user
router.get('/:userId', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT m.*, u.username AS sender_username, u.avatar_url AS sender_avatar
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC
     LIMIT 100`,
    [req.user.id, req.params.userId, req.params.userId, req.user.id]
  );

  await pool.execute(
    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
    [req.params.userId, req.user.id]
  );

  res.json({ messages: rows });
});

router.post('/:userId', authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  await pool.execute(
    'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?,?,?)',
    [req.user.id, req.params.userId, message]
  );
  res.status(201).json({ message: 'Sent' });
});

module.exports = router;
