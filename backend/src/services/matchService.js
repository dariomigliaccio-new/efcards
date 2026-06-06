const { pool } = require('../config/database');

/**
 * Find trade-compatible collectors for a given user.
 * Score = average of:
 *   - % of user's "need" list that a candidate can supply (they have it as "have"/"duplicate")
 *   - % of candidate's "need" list that user can supply
 */
async function findMatches(userId, limit = 20) {
  // Cards this user HAS (have + duplicate)
  const [myHave] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status IN ('have','duplicate')`,
    [userId]
  );
  // Cards this user NEEDS
  const [myNeed] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status = 'need'`,
    [userId]
  );

  if (!myNeed.length && !myHave.length) return [];

  const myHaveIds = myHave.map(r => r.card_id);
  const myNeedIds = myNeed.map(r => r.card_id);

  if (!myHaveIds.length && !myNeedIds.length) return [];

  // Find candidates who have cards I need OR need cards I have
  const candidateIdsQuery = `
    SELECT DISTINCT user_id
    FROM user_cards
    WHERE user_id != ?
      AND (
        (status IN ('have','duplicate') AND card_id IN (${myNeedIds.map(() => '?').join(',') || "'_'"}) )
        OR
        (status = 'need' AND card_id IN (${myHaveIds.map(() => '?').join(',') || "'_'"}) )
      )
    LIMIT 100
  `;

  const [candidates] = await pool.execute(
    candidateIdsQuery,
    [userId, ...myNeedIds, ...myHaveIds]
  );

  if (!candidates.length) return [];

  const results = [];

  for (const { user_id } of candidates) {
    const [theirHave] = await pool.execute(
      `SELECT card_id FROM user_cards WHERE user_id = ? AND status IN ('have','duplicate')`,
      [user_id]
    );
    const [theirNeed] = await pool.execute(
      `SELECT card_id FROM user_cards WHERE user_id = ? AND status = 'need'`,
      [user_id]
    );

    const theirHaveSet = new Set(theirHave.map(r => r.card_id));
    const theirNeedSet = new Set(theirNeed.map(r => r.card_id));

    // Cards I can offer them
    const iCanGive = myHaveIds.filter(id => theirNeedSet.has(id));
    // Cards they can offer me
    const theyCanGive = myNeedIds.filter(id => theirHaveSet.has(id));

    const scoreForMe   = myNeedIds.length   > 0 ? theyCanGive.length / myNeedIds.length   : 0;
    const scoreForThem = theirNeed.length   > 0 ? iCanGive.length    / theirNeed.length    : 0;

    const combined = Math.round(((scoreForMe + scoreForThem) / 2) * 100);
    if (combined === 0) continue;

    results.push({
      user_id,
      compatibility: combined,
      cards_i_can_offer:    iCanGive,
      cards_they_can_offer: theyCanGive,
    });
  }

  results.sort((a, b) => b.compatibility - a.compatibility);
  const top = results.slice(0, limit);

  if (!top.length) return [];

  // Enrich with user info
  const ids = top.map(r => r.user_id);
  const placeholders = ids.map(() => '?').join(',');
  const [users] = await pool.execute(
    `SELECT id, username, display_name, avatar_url, rating, total_trades
     FROM users WHERE id IN (${placeholders})`,
    ids
  );

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return top.map(r => ({
    ...r,
    user: userMap[r.user_id] || null,
  }));
}

async function getCompatibility(userAId, userBId) {
  const [aHave] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status IN ('have','duplicate')`,
    [userAId]
  );
  const [aNeed] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status = 'need'`,
    [userAId]
  );
  const [bHave] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status IN ('have','duplicate')`,
    [userBId]
  );
  const [bNeed] = await pool.execute(
    `SELECT card_id FROM user_cards WHERE user_id = ? AND status = 'need'`,
    [userBId]
  );

  const aHaveSet = new Set(aHave.map(r => r.card_id));
  const aNeedIds = aNeed.map(r => r.card_id);
  const bHaveSet = new Set(bHave.map(r => r.card_id));
  const bNeedIds = bNeed.map(r => r.card_id);

  const aCanGive = bNeedIds.filter(id => aHaveSet.has(id));
  const bCanGive = aNeedIds.filter(id => bHaveSet.has(id));

  const scoreA = aNeedIds.length > 0 ? bCanGive.length / aNeedIds.length : 0;
  const scoreB = bNeedIds.length > 0 ? aCanGive.length / bNeedIds.length : 0;

  return {
    score:              Math.round(((scoreA + scoreB) / 2) * 100),
    cards_a_can_give:   aCanGive,
    cards_b_can_give:   bCanGive,
  };
}

module.exports = { findMatches, getCompatibility };
