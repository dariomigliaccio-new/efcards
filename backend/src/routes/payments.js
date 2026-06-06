const express = require('express');
const { stripe } = require('../config/stripe');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Stripe webhook — must be raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await pool.execute(
          "UPDATE orders SET status='paid', stripe_payment_status='succeeded' WHERE id=?",
          [orderId]
        );
        await pool.execute(
          "UPDATE listings SET status='sold' WHERE id=(SELECT listing_id FROM orders WHERE id=?)",
          [orderId]
        );
        await pool.execute(
          "UPDATE payments SET status='succeeded', stripe_charge_id=? WHERE stripe_payment_intent_id=?",
          [pi.latest_charge, pi.id]
        );

        const [order] = await pool.execute('SELECT * FROM orders WHERE id=?', [orderId]);
        if (order[0]) {
          await createNotification(order[0].buyer_id, 'order_placed', 'Payment confirmed!', { order_id: orderId });
          await createNotification(order[0].seller_id, 'order_placed', 'You made a sale!', { order_id: orderId });
        }
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await pool.execute(
          "UPDATE orders SET status='cancelled', stripe_payment_status='failed' WHERE id=?",
          [orderId]
        );
      }
      break;
    }
  }

  res.json({ received: true });
});

router.get('/history', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json({ payments: rows });
});

module.exports = router;
