const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Active auctions
router.get('/', async (req, res) => {
  try {
    const { sport, rarity, featured } = req.query;
    const p = Math.max(1, parseInt(req.query.page) || 1);
    const l = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (p - 1) * l;
    const params = [];
    const conditions = ["a.status = 'active'"];

    if (sport)    { conditions.push('c.sport = ?');  params.push(sport); }
    if (rarity)   { conditions.push('c.rarity = ?'); params.push(rarity); }
    if (featured) { conditions.push('a.is_featured = TRUE'); }

    const [rows] = await pool.execute(
      `SELECT a.*, c.player_name, c.team, c.sport, c.rarity, c.image_url,
              co.name AS collection_name,
              u.username AS seller_username, u.avatar_url AS seller_avatar,
              TIMESTAMPDIFF(SECOND, NOW(), a.ends_at) AS seconds_remaining
       FROM auctions a
       JOIN cards c ON c.id = a.card_id
       JOIN collections co ON co.id = c.collection_id
       JOIN users u ON u.id = a.seller_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.is_featured DESC, a.ends_at ASC
       LIMIT ${l} OFFSET ${offset}`,
      params
    );
    res.json({ auctions: rows });
  } catch (err) {
    console.error('GET /auctions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

// Single auction
router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT a.*, c.*, co.name AS collection_name,
            u.username AS seller_username, u.avatar_url AS seller_avatar,
            TIMESTAMPDIFF(SECOND, NOW(), a.ends_at) AS seconds_remaining
     FROM auctions a
     JOIN cards c ON c.id = a.card_id
     JOIN collections co ON co.id = c.collection_id
     JOIN users u ON u.id = a.seller_id
     WHERE a.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Auction not found' });

  const [bids] = await pool.execute(
    `SELECT b.*, u.username, u.avatar_url
     FROM bids b JOIN users u ON u.id = b.bidder_id
     WHERE b.auction_id = ? ORDER BY b.amount DESC LIMIT 20`,
    [req.params.id]
  );

  res.json({ auction: rows[0], bids });
});

// Place a bid
router.post('/:id/bid', authenticate, async (req, res) => {
  const { amount, auto_bid_max } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Valid bid amount required' });

  const [rows] = await pool.execute(
    "SELECT * FROM auctions WHERE id = ? AND status = 'active' AND ends_at > NOW()",
    [req.params.id]
  );
  const auction = rows[0];
  if (!auction) return res.status(404).json({ error: 'Auction not found or ended' });

  if (auction.seller_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot bid on your own auction' });
  }

  const minBid = parseFloat(auction.current_price) + parseFloat(auction.min_increment);
  if (parseFloat(amount) < minBid) {
    return res.status(400).json({ error: `Minimum bid is $${minBid.toFixed(2)}` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Mark previous winning bid as non-winning
    const [prevWinner] = await conn.execute(
      'SELECT * FROM bids WHERE auction_id = ? AND is_winning = TRUE',
      [auction.id]
    );

    await conn.execute(
      'UPDATE bids SET is_winning = FALSE WHERE auction_id = ?',
      [auction.id]
    );

    await conn.execute(
      'INSERT INTO bids (auction_id, bidder_id, amount, is_winning, auto_bid_max) VALUES (?,?,?,TRUE,?)',
      [auction.id, req.user.id, amount, auto_bid_max || null]
    );

    await conn.execute(
      'UPDATE auctions SET current_price = ?, bid_count = bid_count + 1 WHERE id = ?',
      [amount, auction.id]
    );

    await conn.commit();

    // Notify outbid user
    if (prevWinner[0] && prevWinner[0].bidder_id !== req.user.id) {
      await createNotification(prevWinner[0].bidder_id, 'bid_outbid', 'You were outbid!', {
        auction_id: auction.id,
        new_amount: amount,
      });
    }

    // Notify seller
    await createNotification(auction.seller_id, 'bid_received', 'New bid on your auction', {
      auction_id: auction.id,
      amount,
      bidder: req.user.username,
    });

    res.status(201).json({ message: 'Bid placed', current_price: amount });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Create auction (from existing listing)
router.post('/', authenticate, async (req, res) => {
  const { card_id, start_price, reserve_price, buy_now_price, min_increment = 1, starts_at, ends_at, description } = req.body;

  if (!card_id || !start_price || !ends_at) {
    return res.status(400).json({ error: 'card_id, start_price, ends_at required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [listingResult] = await conn.execute(
      `INSERT INTO listings (seller_id, card_id, type, price, description, status)
       VALUES (?, ?, 'auction', ?, ?, 'active')`,
      [req.user.id, card_id, buy_now_price || null, description]
    );

    const [lRows] = await conn.execute(
      'SELECT id FROM listings WHERE seller_id = ? AND card_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, card_id]
    );
    const listingId = lRows[0].id;

    await conn.execute(
      `INSERT INTO auctions
       (listing_id, seller_id, card_id, start_price, reserve_price, current_price, buy_now_price, min_increment, starts_at, ends_at, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        listingId, req.user.id, card_id,
        start_price, reserve_price || null, start_price,
        buy_now_price || null, min_increment,
        starts_at || new Date(), ends_at,
        starts_at && new Date(starts_at) > new Date() ? 'scheduled' : 'active'
      ]
    );

    await conn.commit();
    const [aRows] = await pool.execute(
      'SELECT * FROM auctions WHERE seller_id = ? AND card_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id, card_id]
    );
    res.status(201).json({ auction: aRows[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = router;
