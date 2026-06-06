const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const [[users]]    = await pool.execute('SELECT COUNT(*) AS total FROM users');
  const [[listings]] = await pool.execute('SELECT COUNT(*) AS total FROM listings');
  const [[orders]]   = await pool.execute("SELECT COUNT(*) AS total, SUM(amount) AS revenue FROM orders WHERE status NOT IN ('cancelled','refunded')");
  const [[auctions]] = await pool.execute("SELECT COUNT(*) AS total FROM auctions WHERE status = 'active'");
  const [[trades]]   = await pool.execute("SELECT COUNT(*) AS total FROM trades WHERE status = 'completed'");

  res.json({
    users:    users.total,
    listings: listings.total,
    orders:   orders.total,
    revenue:  orders.revenue || 0,
    active_auctions: auctions.total,
    completed_trades: trades.total,
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { page = 1, limit = 50, q, role } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['1=1'];

  if (q)    { conditions.push('(email LIKE ? OR username LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (role) { conditions.push('role = ?'); params.push(role); }

  const [rows] = await pool.execute(
    `SELECT id, email, username, display_name, role, is_active, is_verified, rating, total_trades, total_sales, created_at, last_login
     FROM users WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM users WHERE ${conditions.join(' AND ')}`, params);
  res.json({ users: rows, total });
});

router.patch('/users/:id', async (req, res) => {
  const { role, is_active, is_verified } = req.body;
  await pool.execute(
    'UPDATE users SET role=COALESCE(?,role), is_active=COALESCE(?,is_active), is_verified=COALESCE(?,is_verified) WHERE id=?',
    [role, is_active, is_verified, req.params.id]
  );
  res.json({ message: 'User updated' });
});

// ─── Listings ─────────────────────────────────────────────────────────────────
router.get('/listings', async (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute(
    `SELECT l.*, c.player_name, c.sport, c.rarity, u.username AS seller_username
     FROM listings l JOIN cards c ON c.id=l.card_id JOIN users u ON u.id=l.seller_id
     WHERE l.status = ? ORDER BY l.created_at ASC LIMIT ? OFFSET ?`,
    [status, parseInt(limit), offset]
  );
  res.json({ listings: rows });
});

router.patch('/listings/:id', async (req, res) => {
  const { action } = req.body; // approve | block
  const statusMap = { approve: 'active', block: 'blocked' };
  if (!statusMap[action]) return res.status(400).json({ error: 'action must be approve or block' });

  await pool.execute(
    'UPDATE listings SET status=?, approved_at=NOW(), approved_by=? WHERE id=?',
    [statusMap[action], req.user.id, req.params.id]
  );
  res.json({ message: `Listing ${action}d` });
});

// ─── Auctions ─────────────────────────────────────────────────────────────────
router.get('/auctions', async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['1=1'];

  if (status) { conditions.push('a.status = ?'); params.push(status); }

  const [rows] = await pool.execute(
    `SELECT a.*, c.player_name, c.sport, c.rarity, u.username AS seller_username
     FROM auctions a JOIN cards c ON c.id=a.card_id JOIN users u ON u.id=a.seller_id
     WHERE ${conditions.join(' AND ')} ORDER BY a.ends_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({ auctions: rows });
});

router.patch('/auctions/:id/cancel', async (req, res) => {
  await pool.execute("UPDATE auctions SET status='cancelled' WHERE id=?", [req.params.id]);
  res.json({ message: 'Auction cancelled' });
});

// ─── Orders / Payments ────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['1=1'];

  if (status) { conditions.push('o.status = ?'); params.push(status); }

  const [rows] = await pool.execute(
    `SELECT o.*, c.player_name, ub.username AS buyer, us.username AS seller
     FROM orders o JOIN cards c ON c.id=o.card_id
     JOIN users ub ON ub.id=o.buyer_id JOIN users us ON us.id=o.seller_id
     WHERE ${conditions.join(' AND ')} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({ orders: rows });
});

// ─── Collections management ───────────────────────────────────────────────────
router.post('/collections', async (req, res) => {
  const { name, description, sport, year, manufacturer, total_cards, image_url } = req.body;
  await pool.execute(
    'INSERT INTO collections (name, description, sport, year, manufacturer, total_cards, image_url, created_by) VALUES (?,?,?,?,?,?,?,?)',
    [name, description, sport, year, manufacturer, total_cards, image_url, req.user.id]
  );
  res.status(201).json({ message: 'Collection created' });
});

router.post('/collections/:id/cards', async (req, res) => {
  const cards = req.body.cards; // array of card objects
  if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });

  for (const card of cards) {
    await pool.execute(
      `INSERT INTO cards (collection_id, card_number, player_name, team, position, nationality, year, sport, rarity, image_url, estimated_value, is_rookie, is_autograph)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.params.id, card.card_number, card.player_name, card.team, card.position,
        card.nationality, card.year, card.sport, card.rarity || 'common', card.image_url,
        card.estimated_value || null, card.is_rookie || false, card.is_autograph || false
      ]
    );
  }
  res.status(201).json({ message: `${cards.length} cards added` });
});

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get('/reports/top-users', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, username, display_name, avatar_url, rating, total_trades, total_sales
     FROM users WHERE is_active = TRUE
     ORDER BY (total_trades + total_sales) DESC LIMIT 20`
  );
  res.json({ users: rows });
});

router.get('/reports/revenue', async (req, res) => {
  const [daily] = await pool.execute(
    `SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(amount) AS revenue
     FROM orders WHERE status NOT IN ('cancelled','refunded') AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at) ORDER BY date ASC`
  );
  res.json({ daily });
});

module.exports = router;
