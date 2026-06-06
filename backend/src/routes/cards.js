const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { sport, rarity, player, team, collection_id, year, page = 1, limit = 24, q } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['1=1'];

  if (sport)         { conditions.push('c.sport = ?');            params.push(sport); }
  if (rarity)        { conditions.push('c.rarity = ?');           params.push(rarity); }
  if (team)          { conditions.push('c.team LIKE ?');          params.push(`%${team}%`); }
  if (collection_id) { conditions.push('c.collection_id = ?');    params.push(collection_id); }
  if (year)          { conditions.push('c.year = ?');             params.push(year); }
  if (q)             { conditions.push('(c.player_name LIKE ? OR c.team LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (player)        { conditions.push('c.player_name LIKE ?');   params.push(`%${player}%`); }

  const [rows] = await pool.execute(
    `SELECT c.*, co.name AS collection_name, co.sport AS collection_sport
     FROM cards c
     JOIN collections co ON co.id = c.collection_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.rarity DESC, c.player_name ASC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM cards c WHERE ${conditions.join(' AND ')}`,
    params
  );

  res.json({ cards: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.*, co.name AS collection_name, co.manufacturer, co.year AS collection_year
     FROM cards c
     JOIN collections co ON co.id = c.collection_id
     WHERE c.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Card not found' });
  res.json({ card: rows[0] });
});

// Add card to user collection
router.post('/:id/collect', authenticate, async (req, res) => {
  const { status, condition = 'near_mint', quantity = 1 } = req.body;
  const validStatuses = ['have', 'need', 'duplicate'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'status must be: have, need, or duplicate' });
  }

  await pool.execute(
    `INSERT INTO user_cards (user_id, card_id, status, condition, quantity)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE condition=VALUES(condition), quantity=VALUES(quantity)`,
    [req.user.id, req.params.id, status, condition, quantity]
  );
  res.json({ message: 'Collection updated' });
});

router.delete('/:id/collect', authenticate, async (req, res) => {
  const { status } = req.query;
  await pool.execute(
    'DELETE FROM user_cards WHERE user_id = ? AND card_id = ? AND status = ?',
    [req.user.id, req.params.id, status]
  );
  res.json({ message: 'Removed from collection' });
});

// Wishlist
router.post('/:id/wishlist', authenticate, async (req, res) => {
  const { priority = 'medium', max_price } = req.body;
  await pool.execute(
    `INSERT INTO wishlists (user_id, card_id, priority, max_price)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE priority=VALUES(priority), max_price=VALUES(max_price)`,
    [req.user.id, req.params.id, priority, max_price || null]
  );
  res.json({ message: 'Added to wishlist' });
});

router.delete('/:id/wishlist', authenticate, async (req, res) => {
  await pool.execute('DELETE FROM wishlists WHERE user_id = ? AND card_id = ?', [req.user.id, req.params.id]);
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
