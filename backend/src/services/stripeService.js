const { stripe, PLATFORM_FEE } = require('../config/stripe');
const { pool } = require('../config/database');

async function createCheckoutSession({ listing, buyer, shipping_address }) {
  const amount = Math.round(parseFloat(listing.price) * 100); // cents
  const platformFeeAmount = Math.round(amount * PLATFORM_FEE);
  const sellerAmount = amount - platformFeeAmount;

  let stripeCustomerId = buyer.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: buyer.email,
      metadata: { user_id: buyer.id },
    });
    stripeCustomerId = customer.id;
    await pool.execute('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customer.id, buyer.id]);
  }

  // Create order record
  const [result] = await pool.execute(
    `INSERT INTO orders (buyer_id, seller_id, listing_id, card_id, amount, platform_fee, seller_amount, shipping_address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
    [
      buyer.id, listing.seller_id, listing.id, listing.card_id,
      listing.price, (listing.price * PLATFORM_FEE).toFixed(2),
      (listing.price * (1 - PLATFORM_FEE)).toFixed(2),
      JSON.stringify(shipping_address || {}),
    ]
  );

  const [orderRows] = await pool.execute('SELECT id FROM orders ORDER BY created_at DESC LIMIT 1');
  const orderId = orderRows[0].id;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: stripeCustomerId,
    metadata: {
      order_id: orderId,
      listing_id: listing.id,
      buyer_id: buyer.id,
      seller_id: listing.seller_id,
    },
    description: `CardMatch purchase: ${listing.player_name}`,
    automatic_payment_methods: { enabled: true },
  });

  await pool.execute(
    `INSERT INTO payments (order_id, user_id, stripe_payment_intent_id, amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [orderId, buyer.id, paymentIntent.id, listing.price]
  );

  await pool.execute(
    'UPDATE orders SET stripe_payment_intent_id = ? WHERE id = ?',
    [paymentIntent.id, orderId]
  );

  return {
    client_secret: paymentIntent.client_secret,
    order_id: orderId,
  };
}

module.exports = { createCheckoutSession };
