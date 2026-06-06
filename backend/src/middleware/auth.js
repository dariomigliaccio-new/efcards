const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, email, username, display_name, avatar_url, role, is_active, is_verified FROM users WHERE id = ?',
      [decoded.sub]
    );

    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'Account not found or suspended' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
  } catch (_) {}
  next();
}

module.exports = { authenticate, optionalAuth };
