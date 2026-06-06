const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function safeUser(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

// ── Google OAuth ─────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [profile.id, email]
    );

    if (existing[0]) {
      await pool.execute(
        'UPDATE users SET google_id = ?, avatar_url = ?, last_login = NOW() WHERE id = ?',
        [profile.id, profile.photos?.[0]?.value, existing[0].id]
      );
      return done(null, existing[0]);
    }

    const username = `${profile.displayName.replace(/\s+/g, '_').toLowerCase()}_${Date.now().toString(36)}`;
    const [result] = await pool.execute(
      `INSERT INTO users (email, username, display_name, avatar_url, google_id, is_verified, last_login)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
      [email, username.slice(0, 50), profile.displayName, profile.photos?.[0]?.value, profile.id]
    );
    const [newUser] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    done(null, newUser[0]);
  } catch (err) {
    done(err);
  }
}));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = signToken(req.user.id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// ── Email Register ────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, display_name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing[0]) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await pool.execute(
      `INSERT INTO users (email, username, display_name, password_hash, last_login)
       VALUES (?, ?, ?, ?, NOW())`,
      [email.toLowerCase(), username.toLowerCase(), display_name || username, password_hash]
    );

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const token = signToken(rows[0].id);

    res.status(201).json({ token, user: safeUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email Login ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    const token = signToken(user.id);

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ── Logout (client-side token invalidation) ────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
