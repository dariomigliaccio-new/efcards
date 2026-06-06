const cron = require('node-cron');
const { pool } = require('../config/database');
const { createNotification } = require('./notificationService');

// Runs every minute — closes expired auctions and declares winners
function startAuctionCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const [expired] = await pool.execute(
        "SELECT * FROM auctions WHERE status = 'active' AND ends_at <= NOW()"
      );

      for (const auction of expired) {
        const [topBid] = await pool.execute(
          'SELECT * FROM bids WHERE auction_id = ? ORDER BY amount DESC LIMIT 1',
          [auction.id]
        );

        const hasWinner = topBid[0] && (!auction.reserve_price || topBid[0].amount >= auction.reserve_price);

        if (hasWinner) {
          await pool.execute(
            "UPDATE auctions SET status='ended', winner_id=?, winner_bid_id=? WHERE id=?",
            [topBid[0].bidder_id, topBid[0].id, auction.id]
          );

          // Create order for winner
          await pool.execute(
            `INSERT INTO orders (buyer_id, seller_id, listing_id, card_id, amount, platform_fee, seller_amount, status)
             VALUES (?,?,?,?,?,?,?,'pending_payment')`,
            [
              topBid[0].bidder_id, auction.seller_id, auction.listing_id, auction.card_id,
              topBid[0].amount,
              (topBid[0].amount * 0.08).toFixed(2),
              (topBid[0].amount * 0.92).toFixed(2),
            ]
          );

          await createNotification(topBid[0].bidder_id, 'auction_won', 'You won the auction!', {
            auction_id: auction.id,
            amount: topBid[0].amount,
          });
          await createNotification(auction.seller_id, 'auction_ended', 'Your auction ended', {
            auction_id: auction.id,
            winner_amount: topBid[0].amount,
          });
        } else {
          await pool.execute("UPDATE auctions SET status='ended' WHERE id=?", [auction.id]);
          await createNotification(auction.seller_id, 'auction_ended', 'Your auction ended with no winner', {
            auction_id: auction.id,
          });
        }
      }

      // Activate scheduled auctions
      await pool.execute(
        "UPDATE auctions SET status='active' WHERE status='scheduled' AND starts_at <= NOW()"
      );
    } catch (err) {
      console.error('Auction cron error:', err.message);
    }
  });

  console.log('✓ Auction cron started');
}

module.exports = { startAuctionCron };
