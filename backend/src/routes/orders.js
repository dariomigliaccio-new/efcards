const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { createCheckoutSession } = require('../services/stripeService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { role = 'buyer' } = req.query;
  const field = role === 'seller' ? 'seller_id' : 'buyer_id';

  const [rows] = await pool.execute(
    `SELECT o.*, c.player_name, c.image_url, c.sport,
            ub.username AS buyer_username,
            us.username AS seller_username
     FROM orders o
     JOIN cards c ON c.id = o.card_id
     JOIN users ub ON ub.id = o.buyer_id
     JOIN users us ON us.id = o.seller_id
     WHERE o.${field} = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
});

router.get('/:id', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT o.*, c.player_name, c.image_url, c.sport, c.rarity,
            ub.username AS buyer_username, ub.avatar_url AS buyer_avatar,
            us.username AS seller_username, us.avatar_url AS seller_avatar
     FROM orders o
     JOIN cards c ON c.id = o.card_id
     JOIN users ub ON ub.id = o.buyer_id
     JOIN users us ON us.id = o.seller_id
     WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)`,
    [req.params.id, req.user.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: rows[0] });
});

// Initiate purchase — creates Stripe PaymentIntent
router.post('/checkout', authenticate, async (req, res) => {
  const { listing_id, shipping_address } = req.body;

  const [listingRows] = await pool.execute(
    `SELECT l.*, c.player_name, u.email AS seller_email, u.stripe_customer_id AS seller_stripe_id
     FROM listings l
     JOIN cards c ON c.id = l.card_id
     JOIN users u ON u.id = l.seller_id
     WHERE l.id = ? AND l.status = 'active'`,
    [listing_id]
  );
  const listing = listingRows[0];
  if (!listing) return res.status(404).json({ error: 'Listing not available' });

  const session = await createCheckoutSession({
    listing,
    buyer: req.user,
    shipping_address,
  });

  res.json({ client_secret: session.client_secret, order_id: session.order_id });
});

// Update shipping (seller only)
router.patch('/:id/shipping', authenticate, async (req, res) => {
  const { tracking_number, tracking_carrier } = req.body;
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE id = ? AND seller_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });

  await pool.execute(
    "UPDATE orders SET tracking_number=?, tracking_carrier=?, status='shipped', shipped_at=NOW() WHERE id=?",
    [tracking_number, tracking_carrier, req.params.id]
  );

  await createNotification(rows[0].buyer_id, 'order_shipped', 'Your order has shipped!', {
    order_id: req.params.id,
    tracking_number,
    carrier: tracking_carrier,
  });
  res.json({ message: 'Shipping updated' });
});

// Confirm delivery (buyer)
router.patch('/:id/delivered', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT * FROM orders WHERE id = ? AND buyer_id = ? AND status = 'shipped'",
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });

  await pool.execute(
    "UPDATE orders SET status='delivered', delivered_at=NOW() WHERE id=?",
    [req.params.id]
  );
  await pool.execute(
    'UPDATE users SET total_sales = total_sales + 1 WHERE id = ?',
    [rows[0].seller_id]
  );
  res.json({ message: 'Delivery confirmed' });
});

module.exports = router;
