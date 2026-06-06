const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:username', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, username, display_name, avatar_url, bio, location, rating, rating_count,
            total_trades, total_sales, created_at
     FROM users WHERE username = ? AND is_active = TRUE`,
    [req.params.username]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});

router.patch('/me', authenticate, async (req, res) => {
  const { display_name, bio, location, avatar_url } = req.body;
  await pool.execute(
    'UPDATE users SET display_name=?, bio=?, location=?, avatar_url=? WHERE id=?',
    [display_name, bio, location, avatar_url, req.user.id]
  );
  const [rows] = await pool.execute(
    'SELECT id, email, username, display_name, avatar_url, bio, location, role, rating FROM users WHERE id=?',
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

router.get('/:userId/collection', async (req, res) => {
  const { status, sport, rarity, page = 1, limit = 24 } = req.query;
  const offset = (page - 1) * limit;
  const params = [req.params.userId];
  let where = 'uc.user_id = ?';

  if (status) { where += ' AND uc.status = ?'; params.push(status); }
  if (sport)  { where += ' AND c.sport = ?';   params.push(sport); }
  if (rarity) { where += ' AND c.rarity = ?';  params.push(rarity); }

  const [rows] = await pool.execute(
    `SELECT uc.*, c.player_name, c.team, c.sport, c.rarity, c.image_url,
            c.card_number, c.year, co.name AS collection_name
     FROM user_cards uc
     JOIN cards c ON c.id = uc.card_id
     JOIN collections co ON co.id = c.collection_id
     WHERE ${where}
     ORDER BY uc.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({ cards: rows });
});

router.get('/:userId/reviews', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT r.*, u.username AS reviewer_username, u.avatar_url AS reviewer_avatar
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     WHERE r.reviewed_id = ?
     ORDER BY r.created_at DESC
     LIMIT 20`,
    [req.params.userId]
  );
  res.json({ reviews: rows });
});

module.exports = router;
