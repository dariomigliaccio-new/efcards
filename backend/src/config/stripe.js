const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: { name: 'CardMatch', version: '1.0.0' },
});

const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.08');

module.exports = { stripe, PLATFORM_FEE };
