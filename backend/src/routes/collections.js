const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const p = Math.max(1, parseInt(req.query.page) || 1);
    const l = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (p - 1) * l;
    const { sport, year } = req.query;
    const params = [];
    const conditions = ['is_active = TRUE'];

    if (sport) { conditions.push('sport = ?'); params.push(sport); }
    if (year)  { conditions.push('year = ?');  params.push(parseInt(year)); }

    const [rows] = await pool.execute(
      `SELECT * FROM collections WHERE ${conditions.join(' AND ')}
       ORDER BY year DESC, name ASC LIMIT ${l} OFFSET ${offset}`,
      params
    );
    res.json({ collections: rows });
  } catch (err) {
    console.error('GET /collections error:', err.message);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Collection not found' });

  const [cards] = await pool.execute(
    'SELECT * FROM cards WHERE collection_id = ? ORDER BY card_number ASC',
    [req.params.id]
  );
  res.json({ collection: rows[0], cards });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, sport, year, manufacturer, total_cards, image_url } = req.body;
  const [result] = await pool.execute(
    `INSERT INTO collections (name, description, sport, year, manufacturer, total_cards, image_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, sport, year, manufacturer, total_cards, image_url, req.user.id]
  );
  const [rows] = await pool.execute('SELECT * FROM collections WHERE name = ? ORDER BY created_at DESC LIMIT 1', [name]);
  res.status(201).json({ collection: rows[0] });
});

module.exports = router;
