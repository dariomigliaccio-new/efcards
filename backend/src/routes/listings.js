const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { sport, rarity, type, min_price, max_price, sort = 'newest', q } = req.query;
    const p = Math.max(1, parseInt(req.query.page) || 1);
    const l = Math.min(100, Math.max(1, parseInt(req.query.limit) || 24));
    const offset = (p - 1) * l;
    const params = [];
    const conditions = ["l.status = 'active'"];

    if (sport)     { conditions.push('c.sport = ?');          params.push(sport); }
    if (rarity)    { conditions.push('c.rarity = ?');         params.push(rarity); }
    if (type)      { conditions.push('l.`type` = ?');         params.push(type); }
    if (min_price) { conditions.push('l.price >= ?');         params.push(parseFloat(min_price)); }
    if (max_price) { conditions.push('l.price <= ?');         params.push(parseFloat(max_price)); }
    if (q)         { conditions.push('c.player_name LIKE ?'); params.push(`%${q}%`); }

    const orderMap = {
      newest:    'l.created_at DESC',
      oldest:    'l.created_at ASC',
      price_asc: 'l.price ASC',
      price_desc:'l.price DESC',
      popular:   'l.views DESC',
    };
    const order = orderMap[sort] || 'l.created_at DESC';
    const where = conditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT l.*, c.player_name, c.team, c.sport, c.rarity, c.image_url, c.year,
              co.name AS collection_name,
              u.username AS seller_username, u.avatar_url AS seller_avatar, u.rating AS seller_rating
       FROM listings l
       JOIN cards c ON c.id = l.card_id
       JOIN collections co ON co.id = c.collection_id
       JOIN users u ON u.id = l.seller_id
       WHERE ${where}
       ORDER BY l.is_featured DESC, ${order}
       LIMIT ${l} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM listings l
       JOIN cards c ON c.id = l.card_id
       WHERE ${where}`,
      params
    );

    res.json({ listings: rows, total, page: p, limit: l });
  } catch (err) {
    console.error('GET /listings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT l.*, c.*, co.name AS collection_name,
            u.username AS seller_username, u.avatar_url AS seller_avatar,
            u.rating AS seller_rating, u.total_sales AS seller_sales
     FROM listings l
     JOIN cards c ON c.id = l.card_id
     JOIN collections co ON co.id = c.collection_id
     JOIN users u ON u.id = l.seller_id
     WHERE l.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });

  await pool.execute('UPDATE listings SET views = views + 1 WHERE id = ?', [req.params.id]);
  res.json({ listing: rows[0] });
});

router.post('/', authenticate, async (req, res) => {
  const { card_id, type = 'fixed', price, min_offer, condition = 'near_mint', description } = req.body;
  if (!card_id) return res.status(400).json({ error: 'card_id required' });

  const [result] = await pool.execute(
    `INSERT INTO listings (seller_id, card_id, type, price, min_offer, condition, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, card_id, type, price || null, min_offer || null, condition, description]
  );

  const [rows] = await pool.execute(
    'SELECT id FROM listings WHERE seller_id = ? AND card_id = ? ORDER BY created_at DESC LIMIT 1',
    [req.user.id, card_id]
  );
  res.status(201).json({ listing_id: rows[0].id, message: 'Listing submitted for review' });
});

router.patch('/:id', authenticate, async (req, res) => {
  const { price, min_offer, description, condition } = req.body;
  const [rows] = await pool.execute(
    'SELECT * FROM listings WHERE id = ? AND seller_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });

  await pool.execute(
    'UPDATE listings SET price=?, min_offer=?, description=?, condition=? WHERE id=?',
    [price ?? rows[0].price, min_offer ?? rows[0].min_offer, description ?? rows[0].description, condition ?? rows[0].condition, req.params.id]
  );
  res.json({ message: 'Updated' });
});

router.delete('/:id', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id FROM listings WHERE id = ? AND seller_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });
  await pool.execute("UPDATE listings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ message: 'Listing cancelled' });
});

// Make an offer
router.post('/:id/offers', authenticate, async (req, res) => {
  const { amount, message } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

  const [listing] = await pool.execute("SELECT * FROM listings WHERE id = ? AND status = 'active'", [req.params.id]);
  if (!listing[0]) return res.status(404).json({ error: 'Listing not found' });

  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO offers (listing_id, buyer_id, amount, message, expires_at) VALUES (?,?,?,?,?)',
    [req.params.id, req.user.id, amount, message, expires]
  );
  res.status(201).json({ message: 'Offer submitted' });
});

// Add to cart
router.post('/:id/cart', authenticate, async (req, res) => {
  await pool.execute(
    'INSERT IGNORE INTO cart_items (user_id, listing_id) VALUES (?, ?)',
    [req.user.id, req.params.id]
  );
  res.json({ message: 'Added to cart' });
});

module.exports = router;
