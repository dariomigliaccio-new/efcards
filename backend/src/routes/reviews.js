const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { reviewed_id, order_id, trade_id, rating, comment, type } = req.body;

  if (!reviewed_id || !rating || !type) {
    return res.status(400).json({ error: 'reviewed_id, rating, and type required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5' });
  }

  await pool.execute(
    'INSERT INTO reviews (reviewer_id, reviewed_id, order_id, trade_id, rating, comment, type) VALUES (?,?,?,?,?,?,?)',
    [req.user.id, reviewed_id, order_id || null, trade_id || null, rating, comment, type]
  );

  // Update target user's average rating
  await pool.execute(
    `UPDATE users SET
       rating = (SELECT AVG(rating) FROM reviews WHERE reviewed_id = ?),
       rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = ?)
     WHERE id = ?`,
    [reviewed_id, reviewed_id, reviewed_id]
  );

  res.status(201).json({ message: 'Review submitted' });
});

module.exports = router;
