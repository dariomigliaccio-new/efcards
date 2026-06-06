-- CardMatch Database Schema — MySQL 8.0+
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS cardmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cardmatch;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    VARCHAR(500),
  bio           TEXT,
  location      VARCHAR(100),
  google_id     VARCHAR(100) UNIQUE,
  apple_id      VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  role          ENUM('user','admin','moderator') DEFAULT 'user',
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  stripe_customer_id VARCHAR(100),
  rating        DECIMAL(3,2) DEFAULT 0.00,
  rating_count  INT          DEFAULT 0,
  total_trades  INT          DEFAULT 0,
  total_sales   INT          DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login    TIMESTAMP    NULL
);

-- ─────────────────────────────────────────
-- COLLECTIONS  (e.g. "2022 Panini World Cup")
-- ─────────────────────────────────────────
CREATE TABLE collections (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  sport         ENUM('soccer','baseball','basketball','football','other') NOT NULL,
  year          YEAR         NOT NULL,
  manufacturer  VARCHAR(100),
  total_cards   INT,
  image_url     VARCHAR(500),
  is_active     BOOLEAN      DEFAULT TRUE,
  created_by    VARCHAR(36),
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- CARDS / STICKERS
-- ─────────────────────────────────────────
CREATE TABLE cards (
  id              VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  collection_id   VARCHAR(36)  NOT NULL,
  card_number     VARCHAR(20),
  player_name     VARCHAR(200),
  team            VARCHAR(100),
  position        VARCHAR(50),
  nationality     VARCHAR(100),
  year            YEAR,
  sport           ENUM('soccer','baseball','basketball','football','other'),
  rarity          ENUM('common','uncommon','rare','ultra_rare','legendary') DEFAULT 'common',
  parallel_type   VARCHAR(100),
  image_url       VARCHAR(500),
  image_back_url  VARCHAR(500),
  description     TEXT,
  estimated_value DECIMAL(10,2),
  is_rookie       BOOLEAN DEFAULT FALSE,
  is_autograph    BOOLEAN DEFAULT FALSE,
  is_memorabilia  BOOLEAN DEFAULT FALSE,
  print_run       INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  INDEX idx_collection (collection_id),
  INDEX idx_player     (player_name),
  INDEX idx_sport      (sport),
  INDEX idx_rarity     (rarity)
);

-- ─────────────────────────────────────────
-- USER CARD COLLECTION  (have / need / duplicate)
-- ─────────────────────────────────────────
CREATE TABLE user_cards (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  card_id    VARCHAR(36) NOT NULL,
  status     ENUM('have','need','duplicate') NOT NULL,
  condition  ENUM('mint','near_mint','excellent','good','poor') DEFAULT 'near_mint',
  quantity   INT         DEFAULT 1,
  notes      TEXT,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_card_status (user_id, card_id, status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_card   (card_id),
  INDEX idx_status (status)
);

-- ─────────────────────────────────────────
-- WISHLIST
-- ─────────────────────────────────────────
CREATE TABLE wishlists (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  card_id    VARCHAR(36) NOT NULL,
  priority   ENUM('low','medium','high') DEFAULT 'medium',
  max_price  DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, card_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- TRADES
-- ─────────────────────────────────────────
CREATE TABLE trades (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  initiator_id        VARCHAR(36) NOT NULL,
  receiver_id         VARCHAR(36) NOT NULL,
  status              ENUM('pending','accepted','declined','completed','cancelled') DEFAULT 'pending',
  compatibility_score DECIMAL(5,2),
  message             TEXT,
  initiator_confirmed BOOLEAN DEFAULT FALSE,
  receiver_confirmed  BOOLEAN DEFAULT FALSE,
  completed_at        TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (initiator_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id)  REFERENCES users(id),
  INDEX idx_initiator (initiator_id),
  INDEX idx_receiver  (receiver_id),
  INDEX idx_status    (status)
);

CREATE TABLE trade_items (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  trade_id   VARCHAR(36) NOT NULL,
  card_id    VARCHAR(36) NOT NULL,
  offered_by VARCHAR(36) NOT NULL,
  FOREIGN KEY (trade_id)   REFERENCES trades(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id)    REFERENCES cards(id),
  FOREIGN KEY (offered_by) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- MESSAGES  (trade chat + DM)
-- ─────────────────────────────────────────
CREATE TABLE trade_messages (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  trade_id   VARCHAR(36) NOT NULL,
  sender_id  VARCHAR(36) NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trade_id)  REFERENCES trades(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_trade (trade_id)
);

CREATE TABLE messages (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sender_id   VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  message     TEXT        NOT NULL,
  is_read     BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)   REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  INDEX idx_sender   (sender_id),
  INDEX idx_receiver (receiver_id)
);

-- ─────────────────────────────────────────
-- MARKETPLACE LISTINGS
-- ─────────────────────────────────────────
CREATE TABLE listings (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  seller_id   VARCHAR(36)  NOT NULL,
  card_id     VARCHAR(36)  NOT NULL,
  type        ENUM('fixed','offer','auction') NOT NULL DEFAULT 'fixed',
  price       DECIMAL(10,2),
  min_offer   DECIMAL(10,2),
  condition   ENUM('mint','near_mint','excellent','good','poor') DEFAULT 'near_mint',
  description TEXT,
  images      JSON,
  status      ENUM('active','pending','sold','cancelled','blocked') DEFAULT 'pending',
  views       INT          DEFAULT 0,
  is_featured BOOLEAN      DEFAULT FALSE,
  approved_at TIMESTAMP    NULL,
  approved_by VARCHAR(36),
  expires_at  TIMESTAMP    NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (card_id)   REFERENCES cards(id),
  INDEX idx_seller (seller_id),
  INDEX idx_card   (card_id),
  INDEX idx_status (status),
  INDEX idx_type   (type)
);

CREATE TABLE offers (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  listing_id VARCHAR(36)  NOT NULL,
  buyer_id   VARCHAR(36)  NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  message    TEXT,
  status     ENUM('pending','accepted','declined','countered','expired') DEFAULT 'pending',
  expires_at TIMESTAMP    NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id)   REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE orders (
  id                       VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  buyer_id                 VARCHAR(36)  NOT NULL,
  seller_id                VARCHAR(36)  NOT NULL,
  listing_id               VARCHAR(36),
  card_id                  VARCHAR(36)  NOT NULL,
  amount                   DECIMAL(10,2) NOT NULL,
  platform_fee             DECIMAL(10,2),
  seller_amount            DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(200),
  stripe_payment_status    VARCHAR(50),
  status                   ENUM('pending_payment','paid','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending_payment',
  shipping_address         JSON,
  tracking_number          VARCHAR(100),
  tracking_carrier         VARCHAR(50),
  shipped_at               TIMESTAMP NULL,
  delivered_at             TIMESTAMP NULL,
  notes                    TEXT,
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
  FOREIGN KEY (card_id)    REFERENCES cards(id),
  INDEX idx_buyer  (buyer_id),
  INDEX idx_seller (seller_id),
  INDEX idx_status (status)
);

-- ─────────────────────────────────────────
-- AUCTIONS
-- ─────────────────────────────────────────
CREATE TABLE auctions (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  listing_id      VARCHAR(36)   NOT NULL,
  seller_id       VARCHAR(36)   NOT NULL,
  card_id         VARCHAR(36)   NOT NULL,
  start_price     DECIMAL(10,2) NOT NULL,
  reserve_price   DECIMAL(10,2),
  current_price   DECIMAL(10,2) NOT NULL,
  buy_now_price   DECIMAL(10,2),
  min_increment   DECIMAL(10,2) DEFAULT 1.00,
  status          ENUM('scheduled','active','ended','cancelled') DEFAULT 'scheduled',
  starts_at       TIMESTAMP     NOT NULL,
  ends_at         TIMESTAMP     NOT NULL,
  winner_id       VARCHAR(36),
  winner_bid_id   VARCHAR(36),
  bid_count       INT           DEFAULT 0,
  is_featured     BOOLEAN       DEFAULT FALSE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id),
  FOREIGN KEY (card_id)    REFERENCES cards(id),
  INDEX idx_status  (status),
  INDEX idx_ends_at (ends_at)
);

CREATE TABLE bids (
  id            VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  auction_id    VARCHAR(36)   NOT NULL,
  bidder_id     VARCHAR(36)   NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  is_winning    BOOLEAN       DEFAULT FALSE,
  auto_bid_max  DECIMAL(10,2),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id)  REFERENCES users(id),
  INDEX idx_auction (auction_id),
  INDEX idx_bidder  (bidder_id)
);

-- ─────────────────────────────────────────
-- CART
-- ─────────────────────────────────────────
CREATE TABLE cart_items (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  added_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart (user_id, listing_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE payments (
  id                       VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  order_id                 VARCHAR(36),
  user_id                  VARCHAR(36)   NOT NULL,
  stripe_payment_intent_id VARCHAR(200)  UNIQUE,
  stripe_charge_id         VARCHAR(200),
  amount                   DECIMAL(10,2) NOT NULL,
  currency                 VARCHAR(3)    DEFAULT 'USD',
  status                   ENUM('pending','processing','succeeded','failed','cancelled','refunded') DEFAULT 'pending',
  payment_method           VARCHAR(50),
  metadata                 JSON,
  created_at               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)  REFERENCES users(id),
  INDEX idx_user   (user_id),
  INDEX idx_status (status)
);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE reviews (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reviewer_id VARCHAR(36) NOT NULL,
  reviewed_id VARCHAR(36) NOT NULL,
  order_id    VARCHAR(36),
  trade_id    VARCHAR(36),
  rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  type        ENUM('sale','trade') NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (reviewer_id, order_id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_id) REFERENCES users(id),
  FOREIGN KEY (order_id)    REFERENCES orders(id)  ON DELETE SET NULL,
  FOREIGN KEY (trade_id)    REFERENCES trades(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  type       ENUM(
               'trade_request','trade_accepted','trade_declined','trade_completed',
               'bid_received','bid_outbid','auction_won','auction_ended',
               'offer_received','offer_accepted','offer_declined',
               'order_placed','order_shipped','order_delivered',
               'message_received','review_received',
               'listing_approved','listing_blocked',
               'match_found','system'
             ) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  data       JSON,
  is_read    BOOLEAN   DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
);

-- ─────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────
CREATE TABLE follows (
  follower_id  VARCHAR(36) NOT NULL,
  following_id VARCHAR(36) NOT NULL,
  created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- VERIFICATION TOKENS
-- ─────────────────────────────────────────
CREATE TABLE verification_tokens (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36)  NOT NULL,
  token      VARCHAR(255) UNIQUE NOT NULL,
  type       ENUM('email_verify','password_reset') NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- SEED: default admin
-- ─────────────────────────────────────────
-- Password: Admin@CardMatch1  (bcrypt, change after first login)
INSERT INTO users (email, username, display_name, role, is_verified, password_hash)
VALUES (
  'admin@cardmatch.io',
  'cardmatch_admin',
  'CardMatch Admin',
  'admin',
  TRUE,
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3jp5UJE6Vy'
);
