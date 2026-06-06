const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { findMatches, getCompatibility } = require('../services/matchService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Discover matches
router.get('/matches', authenticate, async (req, res) => {
  const matches = await findMatches(req.user.id, 30);
  res.json({ matches });
});

// Compatibility between two users
router.get('/compatibility/:userId', authenticate, async (req, res) => {
  const result = await getCompatibility(req.user.id, req.params.userId);
  res.json(result);
});

// List my trades
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;
  const params = [req.user.id, req.user.id];
  let where = '(t.initiator_id = ? OR t.receiver_id = ?)';
  if (status) { where += ' AND t.status = ?'; params.push(status); }

  const [rows] = await pool.execute(
    `SELECT t.*,
            ui.username AS initiator_username, ui.avatar_url AS initiator_avatar,
            ur.username AS receiver_username,  ur.avatar_url AS receiver_avatar
     FROM trades t
     JOIN users ui ON ui.id = t.initiator_id
     JOIN users ur ON ur.id = t.receiver_id
     WHERE ${where}
     ORDER BY t.updated_at DESC`,
    params
  );
  res.json({ trades: rows });
});

// Single trade
router.get('/:id', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT t.*,
            ui.username AS initiator_username, ui.avatar_url AS initiator_avatar,
            ur.username AS receiver_username,  ur.avatar_url AS receiver_avatar
     FROM trades t
     JOIN users ui ON ui.id = t.initiator_id
     JOIN users ur ON ur.id = t.receiver_id
     WHERE t.id = ? AND (t.initiator_id = ? OR t.receiver_id = ?)`,
    [req.params.id, req.user.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Trade not found' });

  const [items] = await pool.execute(
    `SELECT ti.*, c.player_name, c.image_url, c.rarity, c.sport, c.team
     FROM trade_items ti JOIN cards c ON c.id = ti.card_id
     WHERE ti.trade_id = ?`,
    [req.params.id]
  );

  const [messages] = await pool.execute(
    `SELECT tm.*, u.username, u.avatar_url
     FROM trade_messages tm JOIN users u ON u.id = tm.sender_id
     WHERE tm.trade_id = ? ORDER BY tm.created_at ASC`,
    [req.params.id]
  );

  res.json({ trade: rows[0], items, messages });
});

// Create trade request
router.post('/', authenticate, async (req, res) => {
  const { receiver_id, offered_card_ids = [], requested_card_ids = [], message } = req.body;

  if (!receiver_id) return res.status(400).json({ error: 'receiver_id required' });
  if (!offered_card_ids.length && !requested_card_ids.length) {
    return res.status(400).json({ error: 'Include at least one card' });
  }

  const { score } = await getCompatibility(req.user.id, receiver_id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO trades (initiator_id, receiver_id, compatibility_score, message)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, receiver_id, score, message]
    );
    const tradeId = result.insertId;

    // Actually MySQL returns insertId but we used UUID default — need to re-fetch
    const [rows] = await conn.execute('SELECT id FROM trades ORDER BY created_at DESC LIMIT 1');
    const actualId = rows[0].id;

    for (const cardId of offered_card_ids) {
      await conn.execute(
        'INSERT INTO trade_items (trade_id, card_id, offered_by) VALUES (?, ?, ?)',
        [actualId, cardId, req.user.id]
      );
    }
    for (const cardId of requested_card_ids) {
      await conn.execute(
        'INSERT INTO trade_items (trade_id, card_id, offered_by) VALUES (?, ?, ?)',
        [actualId, cardId, receiver_id]
      );
    }

    await conn.commit();

    await createNotification(receiver_id, 'trade_request', 'New trade request', {
      trade_id: actualId,
      from_user: req.user.username,
    });

    const [trade] = await pool.execute('SELECT * FROM trades WHERE id = ?', [actualId]);
    res.status(201).json({ trade: trade[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Accept / decline / cancel
router.patch('/:id/status', authenticate, async (req, res) => {
  const { action } = req.body; // accept | decline | cancel | complete

  const [rows] = await pool.execute('SELECT * FROM trades WHERE id = ?', [req.params.id]);
  const trade = rows[0];
  if (!trade) return res.status(404).json({ error: 'Trade not found' });

  const isInitiator = trade.initiator_id === req.user.id;
  const isReceiver  = trade.receiver_id  === req.user.id;

  const allowed = {
    accept:   isReceiver  && trade.status === 'pending',
    decline:  isReceiver  && trade.status === 'pending',
    cancel:   isInitiator && ['pending','accepted'].includes(trade.status),
    complete: (isInitiator || isReceiver) && trade.status === 'accepted',
  };

  if (!allowed[action]) return res.status(403).json({ error: 'Action not allowed' });

  const statusMap = { accept: 'accepted', decline: 'declined', cancel: 'cancelled', complete: 'completed' };
  await pool.execute(
    'UPDATE trades SET status = ?, completed_at = ? WHERE id = ?',
    [statusMap[action], action === 'complete' ? new Date() : null, trade.id]
  );

  const notifyTarget = isInitiator ? trade.receiver_id : trade.initiator_id;
  const notifTypeMap = {
    accept: 'trade_accepted', decline: 'trade_declined',
    cancel: 'trade_declined', complete: 'trade_completed'
  };
  await createNotification(notifyTarget, notifTypeMap[action], `Trade ${action}ed`, { trade_id: trade.id });

  if (action === 'complete') {
    await pool.execute(
      'UPDATE users SET total_trades = total_trades + 1 WHERE id IN (?, ?)',
      [trade.initiator_id, trade.receiver_id]
    );
  }

  res.json({ message: `Trade ${action}ed` });
});

// Send message in trade
router.post('/:id/messages', authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  const [rows] = await pool.execute(
    'SELECT * FROM trades WHERE id = ? AND (initiator_id = ? OR receiver_id = ?)',
    [req.params.id, req.user.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Trade not found' });

  await pool.execute(
    'INSERT INTO trade_messages (trade_id, sender_id, message) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, message]
  );
  res.status(201).json({ message: 'Sent' });
});

module.exports = router;
