require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const compression = require('compression');
const passport   = require('passport');

const { testConnection } = require('./config/database');
const { setSocketIO }    = require('./services/notificationService');
const { startAuctionCron } = require('./services/auctionService');

const authRoutes          = require('./routes/auth');
const usersRoutes         = require('./routes/users');
const cardsRoutes         = require('./routes/cards');
const collectionsRoutes   = require('./routes/collections');
const tradesRoutes        = require('./routes/trades');
const listingsRoutes      = require('./routes/listings');
const ordersRoutes        = require('./routes/orders');
const bidsRoutes          = require('./routes/bids');
const paymentsRoutes      = require('./routes/payments');
const reviewsRoutes       = require('./routes/reviews');
const notificationsRoutes = require('./routes/notifications');
const chatRoutes          = require('./routes/chat');
const adminRoutes         = require('./routes/admin');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
});

setSocketIO(io);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    socket.on('join_trade', (tradeId) => socket.join(`trade:${tradeId}`));
    socket.on('trade_message', (data) => {
      io.to(`trade:${data.tradeId}`).emit('trade_message', data);
    });
    socket.on('chat_message', (data) => {
      io.to(`user:${data.receiverId}`).emit('chat_message', data);
    });
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Webhook needs raw body — mount BEFORE express.json()
app.use('/api/payments/webhook', paymentsRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// Static uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/cards',         cardsRoutes);
app.use('/api/collections',   collectionsRoutes);
app.use('/api/trades',        tradesRoutes);
app.use('/api/listings',      listingsRoutes);
app.use('/api/orders',        ordersRoutes);
app.use('/api/auctions',      bidsRoutes);
app.use('/api/payments',      paymentsRoutes);
app.use('/api/reviews',       reviewsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/admin',         adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

(async () => {
  await testConnection();
  startAuctionCron();

  server.listen(PORT, () => {
    console.log(`\n🎴  CardMatch API running on port ${PORT}`);
    console.log(`    Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
