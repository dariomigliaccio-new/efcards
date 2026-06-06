require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

// ─── Helpers ────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function future(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  { name: '2022 Panini FIFA World Cup',        sport: 'soccer',     year: 2022, manufacturer: 'Panini',     total_cards: 670, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/100px-Flag_of_Canada_%28Pantone%29.svg.png' },
  { name: '2023 Topps Chrome Baseball',        sport: 'baseball',   year: 2023, manufacturer: 'Topps',      total_cards: 220, image_url: '' },
  { name: '2023 Panini Prizm Basketball',      sport: 'basketball', year: 2023, manufacturer: 'Panini',     total_cards: 300, image_url: '' },
  { name: '2023 Panini Prizm NFL',             sport: 'football',   year: 2023, manufacturer: 'Panini',     total_cards: 400, image_url: '' },
  { name: '2023 Panini Mosaic Soccer',         sport: 'soccer',     year: 2023, manufacturer: 'Panini',     total_cards: 350, image_url: '' },
  { name: '2003 Topps Chrome Basketball',      sport: 'basketball', year: 2003, manufacturer: 'Topps',      total_cards: 165, image_url: '' },
];

const CARDS_BY_COLLECTION = {
  '2022 Panini FIFA World Cup': [
    { card_number: '001', player_name: 'Lionel Messi',     team: 'Argentina',    position: 'Forward',    nationality: 'Argentine', rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 2400 },
    { card_number: '002', player_name: 'Cristiano Ronaldo',team: 'Portugal',     position: 'Forward',    nationality: 'Portuguese',rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 1800 },
    { card_number: '003', player_name: 'Kylian Mbappé',    team: 'France',       position: 'Forward',    nationality: 'French',    rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 890  },
    { card_number: '004', player_name: 'Neymar Jr',        team: 'Brazil',       position: 'Forward',    nationality: 'Brazilian', rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 650  },
    { card_number: '005', player_name: 'Erling Haaland',   team: 'Norway',       position: 'Forward',    nationality: 'Norwegian', rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 420  },
    { card_number: '006', player_name: 'Vinicius Jr',      team: 'Brazil',       position: 'Forward',    nationality: 'Brazilian', rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 380  },
    { card_number: '007', player_name: 'Luka Modrić',      team: 'Croatia',      position: 'Midfielder', nationality: 'Croatian',  rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 180  },
    { card_number: '008', player_name: 'Mohamed Salah',    team: 'Egypt',        position: 'Forward',    nationality: 'Egyptian',  rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 150  },
    { card_number: '009', player_name: 'Pedri',            team: 'Spain',        position: 'Midfielder', nationality: 'Spanish',   rarity: 'uncommon',   is_rookie: true,  is_autograph: false, estimated_value: 210  },
    { card_number: '010', player_name: 'Jude Bellingham',  team: 'England',      position: 'Midfielder', nationality: 'English',   rarity: 'rare',       is_rookie: true,  is_autograph: false, estimated_value: 480  },
    { card_number: '011', player_name: 'Harry Kane',       team: 'England',      position: 'Forward',    nationality: 'English',   rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 130  },
    { card_number: '012', player_name: 'Robert Lewandowski',team:'Poland',       position: 'Forward',    nationality: 'Polish',    rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 110  },
    { card_number: '099', player_name: 'Lionel Messi',     team: 'Argentina',    position: 'Forward',    nationality: 'Argentine', rarity: 'legendary',  is_rookie: false, is_autograph: true,  estimated_value: 12000, parallel_type: 'Auto Gold /10' },
    { card_number: '100', player_name: 'Kylian Mbappé',    team: 'France',       position: 'Forward',    nationality: 'French',    rarity: 'legendary',  is_rookie: false, is_autograph: true,  estimated_value: 4800, parallel_type: 'Auto Silver /25' },
  ],

  '2023 Topps Chrome Baseball': [
    { card_number: '001', player_name: 'Shohei Ohtani',    team: 'LA Dodgers',   position: 'DH/SP',   nationality: 'Japanese',  rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 3200 },
    { card_number: '002', player_name: 'Mike Trout',       team: 'LA Angels',    position: 'CF',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 950  },
    { card_number: '003', player_name: 'Aaron Judge',      team: 'NY Yankees',   position: 'RF',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 780  },
    { card_number: '004', player_name: 'Fernando Tatis Jr',team: 'SD Padres',    position: 'SS',      nationality: 'Dominican', rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 420  },
    { card_number: '005', player_name: 'Ronald Acuña Jr',  team: 'ATL Braves',   position: 'RF',      nationality: 'Venezuelan',rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 390  },
    { card_number: '006', player_name: 'Julio Rodríguez',  team: 'SEA Mariners', position: 'CF',      nationality: 'Dominican', rarity: 'rare',       is_rookie: true,  is_autograph: false, estimated_value: 480  },
    { card_number: '007', player_name: 'Elly De La Cruz',  team: 'CIN Reds',     position: 'SS',      nationality: 'Dominican', rarity: 'uncommon',   is_rookie: true,  is_autograph: false, estimated_value: 220  },
    { card_number: '008', player_name: 'Mookie Betts',     team: 'LA Dodgers',   position: 'RF',      nationality: 'American',  rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 140  },
  ],

  '2023 Panini Prizm Basketball': [
    { card_number: '001', player_name: 'LeBron James',     team: 'LA Lakers',    position: 'SF',      nationality: 'American',  rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 1800 },
    { card_number: '002', player_name: 'Stephen Curry',    team: 'Golden State', position: 'PG',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 1100 },
    { card_number: '003', player_name: 'Giannis Antetokounmpo', team: 'Milwaukee', position: 'PF',  nationality: 'Greek',     rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 880  },
    { card_number: '004', player_name: 'Luka Dončić',      team: 'Dallas',       position: 'PG',      nationality: 'Slovenian', rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 1400 },
    { card_number: '005', player_name: 'Victor Wembanyama',team: 'San Antonio',  position: 'C',       nationality: 'French',    rarity: 'legendary',  is_rookie: true,  is_autograph: false, estimated_value: 2800 },
    { card_number: '006', player_name: 'Jayson Tatum',     team: 'Boston',       position: 'SF',      nationality: 'American',  rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 450  },
    { card_number: '007', player_name: 'Anthony Edwards',  team: 'Minnesota',    position: 'SG',      nationality: 'American',  rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 520  },
    { card_number: '008', player_name: 'Nikola Jokić',     team: 'Denver',       position: 'C',       nationality: 'Serbian',   rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 920  },
    { card_number: '009', player_name: 'Chet Holmgren',    team: 'OKC Thunder',  position: 'C',       nationality: 'American',  rarity: 'uncommon',   is_rookie: true,  is_autograph: false, estimated_value: 180  },
    { card_number: '010', player_name: 'Scoot Henderson',  team: 'Portland',     position: 'PG',      nationality: 'American',  rarity: 'rare',       is_rookie: true,  is_autograph: false, estimated_value: 280  },
  ],

  '2023 Panini Prizm NFL': [
    { card_number: '001', player_name: 'Patrick Mahomes',  team: 'Kansas City',  position: 'QB',      nationality: 'American',  rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 3200 },
    { card_number: '002', player_name: 'Josh Allen',       team: 'Buffalo Bills',position: 'QB',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 1200 },
    { card_number: '003', player_name: 'Justin Jefferson', team: 'Minnesota',    position: 'WR',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 950  },
    { card_number: '004', player_name: 'CeeDee Lamb',      team: 'Dallas Cowboys',position: 'WR',     nationality: 'American',  rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 580  },
    { card_number: '005', player_name: 'Ja\'Marr Chase',   team: 'Cincinnati',   position: 'WR',      nationality: 'American',  rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 490  },
    { card_number: '006', player_name: 'Travis Kelce',     team: 'Kansas City',  position: 'TE',      nationality: 'American',  rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 420  },
    { card_number: '007', player_name: 'Tyreek Hill',      team: 'Miami Dolphins',position: 'WR',     nationality: 'American',  rarity: 'uncommon',   is_rookie: false, is_autograph: false, estimated_value: 220  },
    { card_number: '008', player_name: 'C.J. Stroud',      team: 'Houston Texans',position: 'QB',     nationality: 'American',  rarity: 'rare',       is_rookie: true,  is_autograph: false, estimated_value: 680  },
    { card_number: '009', player_name: 'Bijan Robinson',   team: 'Atlanta Falcons',position: 'RB',    nationality: 'American',  rarity: 'uncommon',   is_rookie: true,  is_autograph: false, estimated_value: 240  },
  ],

  '2023 Panini Mosaic Soccer': [
    { card_number: '001', player_name: 'Lionel Messi',     team: 'Inter Miami',  position: 'Forward',    nationality: 'Argentine', rarity: 'legendary',  is_rookie: false, is_autograph: false, estimated_value: 1800 },
    { card_number: '002', player_name: 'Erling Haaland',   team: 'Manchester City', position: 'Forward', nationality: 'Norwegian', rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 680  },
    { card_number: '003', player_name: 'Jude Bellingham',  team: 'Real Madrid',  position: 'Midfielder', nationality: 'English',   rarity: 'ultra_rare', is_rookie: false, is_autograph: false, estimated_value: 720  },
    { card_number: '004', player_name: 'Vinicius Jr',      team: 'Real Madrid',  position: 'Forward',    nationality: 'Brazilian', rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 390  },
    { card_number: '005', player_name: 'Bukayo Saka',      team: 'Arsenal',      position: 'Forward',    nationality: 'English',   rarity: 'rare',       is_rookie: false, is_autograph: false, estimated_value: 280  },
    { card_number: '006', player_name: 'Phil Foden',       team: 'Manchester City', position: 'Midfielder', nationality: 'English', rarity: 'uncommon', is_rookie: false, is_autograph: false, estimated_value: 160  },
  ],

  '2003 Topps Chrome Basketball': [
    { card_number: '111', player_name: 'LeBron James',     team: 'Cleveland',    position: 'SF',      nationality: 'American',  rarity: 'legendary',  is_rookie: true,  is_autograph: false, estimated_value: 18000, parallel_type: 'Refractor RC' },
    { card_number: '115', player_name: 'Dwyane Wade',      team: 'Miami Heat',   position: 'SG',      nationality: 'American',  rarity: 'ultra_rare', is_rookie: true,  is_autograph: false, estimated_value: 2800  },
    { card_number: '113', player_name: 'Carmelo Anthony',  team: 'Denver',       position: 'SF',      nationality: 'American',  rarity: 'rare',       is_rookie: true,  is_autograph: false, estimated_value: 480   },
    { card_number: '118', player_name: 'Chris Bosh',       team: 'Toronto',      position: 'C',       nationality: 'American',  rarity: 'uncommon',   is_rookie: true,  is_autograph: false, estimated_value: 120   },
  ],
};

const USERS = [
  { email: 'marco@example.com',   username: 'marco_collects',  display_name: 'Marco Rossi',    password: 'Pass@1234', bio: 'Soccer card enthusiast from Italy. Trading since 2018.', location: 'Milan, Italy' },
  { email: 'sarah@example.com',   username: 'sarah_cards',     display_name: 'Sarah Chen',     password: 'Pass@1234', bio: 'NBA and NFL collector. Always looking for PSA 10s.', location: 'New York, USA' },
  { email: 'carlos@example.com',  username: 'carlos_stickers', display_name: 'Carlos Mendez',  password: 'Pass@1234', bio: 'Panini World Cup specialist. Messi collector.', location: 'Buenos Aires, Argentina' },
  { email: 'yuki@example.com',    username: 'yuki_sports',     display_name: 'Yuki Tanaka',    password: 'Pass@1234', bio: 'Baseball and NBA cards. Huge Ohtani fan.', location: 'Tokyo, Japan' },
];

// ─── Main seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Starting CardMatch seed...\n');

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const userIds = {};
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute(
      `INSERT IGNORE INTO users (email, username, display_name, password_hash, bio, location, is_verified, rating, rating_count, total_trades, total_sales)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)`,
      [u.email, u.username, u.display_name, hash, u.bio, u.location,
       randFloat(3.8, 5.0), rand(2, 40), rand(0, 25), rand(0, 18)]
    );
    const [[row]] = await pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
    userIds[u.username] = row.id;
    console.log(`  ✓ User: ${u.display_name} (${u.username})`);
  }

  // ── 2. Collections + Cards ─────────────────────────────────────────────────
  const collectionIds = {};
  const cardIds = {};  // { collectionName_cardNumber: uuid }

  for (const col of COLLECTIONS) {
    const [[admin]] = await pool.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    await pool.execute(
      `INSERT IGNORE INTO collections (name, description, sport, year, manufacturer, total_cards, image_url, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [col.name, `Official ${col.year} ${col.manufacturer} ${col.sport} collection`, col.sport, col.year, col.manufacturer, col.total_cards, col.image_url || '', admin.id]
    );
    const [[row]] = await pool.execute('SELECT id FROM collections WHERE name = ?', [col.name]);
    collectionIds[col.name] = row.id;
    console.log(`  ✓ Collection: ${col.name}`);

    // Insert cards for this collection
    const cards = CARDS_BY_COLLECTION[col.name] || [];
    for (const card of cards) {
      await pool.execute(
        `INSERT IGNORE INTO cards
           (collection_id, card_number, player_name, team, position, nationality, year, sport, rarity, parallel_type, estimated_value, is_rookie, is_autograph, is_memorabilia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [row.id, card.card_number, card.player_name, card.team, card.position,
         card.nationality, col.year, col.sport, card.rarity, card.parallel_type || null,
         card.estimated_value || null, card.is_rookie, card.is_autograph]
      );
      const [[cRow]] = await pool.execute(
        'SELECT id FROM cards WHERE collection_id = ? AND card_number = ?',
        [row.id, card.card_number]
      );
      cardIds[`${col.name}::${card.card_number}`] = cRow.id;
    }
    console.log(`     └ ${cards.length} cards inserted`);
  }

  // ── 3. User collections (have/need/duplicate) ─────────────────────────────
  // marco: FIFA WC enthusiast
  const marcoPairs = [
    ['2022 Panini FIFA World Cup', '001', 'need'],
    ['2022 Panini FIFA World Cup', '002', 'have'],
    ['2022 Panini FIFA World Cup', '003', 'have'],
    ['2022 Panini FIFA World Cup', '004', 'have'],
    ['2022 Panini FIFA World Cup', '005', 'need'],
    ['2022 Panini FIFA World Cup', '006', 'have'],
    ['2022 Panini FIFA World Cup', '007', 'duplicate'],
    ['2022 Panini FIFA World Cup', '008', 'need'],
    ['2022 Panini FIFA World Cup', '010', 'need'],
    ['2023 Panini Mosaic Soccer',  '001', 'have'],
    ['2023 Panini Mosaic Soccer',  '002', 'need'],
    ['2023 Panini Mosaic Soccer',  '003', 'need'],
  ];

  // sarah: NBA + NFL
  const sarahPairs = [
    ['2023 Panini Prizm Basketball', '001', 'have'],
    ['2023 Panini Prizm Basketball', '002', 'need'],
    ['2023 Panini Prizm Basketball', '004', 'have'],
    ['2023 Panini Prizm Basketball', '005', 'have'],
    ['2023 Panini Prizm Basketball', '007', 'duplicate'],
    ['2023 Panini Prizm NFL',        '001', 'have'],
    ['2023 Panini Prizm NFL',        '002', 'have'],
    ['2023 Panini Prizm NFL',        '003', 'need'],
    ['2023 Panini Prizm NFL',        '004', 'need'],
    ['2003 Topps Chrome Basketball', '111', 'need'],
  ];

  // carlos: Messi collector
  const carlosPairs = [
    ['2022 Panini FIFA World Cup', '001', 'have'],
    ['2022 Panini FIFA World Cup', '099', 'have'],
    ['2022 Panini FIFA World Cup', '002', 'need'],
    ['2022 Panini FIFA World Cup', '003', 'need'],
    ['2023 Panini Mosaic Soccer',  '001', 'have'],
    ['2023 Panini Mosaic Soccer',  '002', 'have'],
    ['2023 Panini Mosaic Soccer',  '004', 'duplicate'],
    ['2023 Panini Mosaic Soccer',  '005', 'need'],
    ['2023 Panini Mosaic Soccer',  '006', 'need'],
  ];

  // yuki: Baseball + NBA
  const yukiPairs = [
    ['2023 Topps Chrome Baseball',  '001', 'have'],
    ['2023 Topps Chrome Baseball',  '002', 'need'],
    ['2023 Topps Chrome Baseball',  '003', 'have'],
    ['2023 Topps Chrome Baseball',  '004', 'have'],
    ['2023 Topps Chrome Baseball',  '006', 'need'],
    ['2023 Panini Prizm Basketball', '003', 'have'],
    ['2023 Panini Prizm Basketball', '008', 'have'],
    ['2023 Panini Prizm Basketball', '001', 'need'],
    ['2003 Topps Chrome Basketball', '111', 'need'],
  ];

  const allPairs = [
    [userIds['marco_collects'],  marcoPairs],
    [userIds['sarah_cards'],     sarahPairs],
    [userIds['carlos_stickers'], carlosPairs],
    [userIds['yuki_sports'],     yukiPairs],
  ];

  for (const [uid, pairs] of allPairs) {
    for (const [colName, cardNum, status] of pairs) {
      const cid = cardIds[`${colName}::${cardNum}`];
      if (!cid) continue;
      await pool.execute(
        `INSERT IGNORE INTO user_cards (user_id, card_id, status, \`condition\`, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [uid, cid, status, pick(['mint','near_mint','near_mint','excellent']), status === 'duplicate' ? rand(2,4) : 1]
      );
    }
  }
  console.log('\n  ✓ User collections assigned');

  // ── 4. Listings (marketplace) ─────────────────────────────────────────────
  const LISTINGS_DATA = [
    // Marco selling his duplicates/extras
    { seller: 'marco_collects', col: '2022 Panini FIFA World Cup', card: '007', type: 'fixed',  price: 145,   condition: 'near_mint',  description: 'Luka Modrić 2022 WC. Near mint condition, no creases.' },
    { seller: 'marco_collects', col: '2022 Panini FIFA World Cup', card: '002', type: 'offer',  price: 1650,  condition: 'near_mint',  description: 'Ronaldo 2022 WC. Open to offers above $1500.' },
    // Sarah selling NBA
    { seller: 'sarah_cards',    col: '2023 Panini Prizm Basketball', card: '007', type: 'fixed', price: 180,  condition: 'mint',       description: 'Anthony Edwards Silver Prizm. PSA ready.' },
    { seller: 'sarah_cards',    col: '2023 Panini Prizm NFL',        card: '006', type: 'fixed', price: 310,  condition: 'mint',       description: 'Travis Kelce 2023 Prizm. Mint, ungraded.' },
    { seller: 'sarah_cards',    col: '2023 Panini Prizm NFL',        card: '007', type: 'offer', price: 195,  condition: 'near_mint',  description: 'Tyreek Hill Silver Prizm.' },
    // Carlos selling soccer
    { seller: 'carlos_stickers', col: '2022 Panini FIFA World Cup', card: '003', type: 'fixed', price: 820,  condition: 'mint',       description: 'Mbappé 2022 WC. Freshly pulled, top loader stored.' },
    { seller: 'carlos_stickers', col: '2023 Panini Mosaic Soccer',  card: '004', type: 'fixed', price: 340,  condition: 'near_mint',  description: 'Vinicius Jr Mosaic. Beautiful holographic design.' },
    { seller: 'carlos_stickers', col: '2023 Panini Mosaic Soccer',  card: '004', type: 'fixed', price: 320,  condition: 'excellent',  description: 'Second copy. Slight corner wear.' },
    // Yuki selling baseball
    { seller: 'yuki_sports', col: '2023 Topps Chrome Baseball', card: '001', type: 'offer',  price: 3100, condition: 'mint',       description: 'Ohtani Chrome. One of the best cards in the hobby right now.' },
    { seller: 'yuki_sports', col: '2023 Topps Chrome Baseball', card: '003', type: 'fixed',  price: 700,  condition: 'near_mint',  description: 'Aaron Judge Chrome. Raw NM+.' },
    { seller: 'yuki_sports', col: '2023 Panini Prizm Basketball', card: '003', type: 'fixed', price: 840, condition: 'mint',       description: 'Giannis Prizm Silver. Super clean card.' },
    // Legendary card listings
    { seller: 'sarah_cards', col: '2023 Panini Prizm Basketball', card: '001', type: 'offer',  price: 1700, condition: 'near_mint', description: 'LeBron James Prizm. Iconic card.' },
    { seller: 'marco_collects', col: '2022 Panini FIFA World Cup', card: '004', type: 'fixed', price: 610, condition: 'mint',       description: 'Neymar 2022 WC. PSA ready.' },
  ];

  for (const l of LISTINGS_DATA) {
    const sellerId = userIds[l.seller];
    const cardId = cardIds[`${l.col}::${l.card}`];
    if (!sellerId || !cardId) continue;

    await pool.execute(
      `INSERT INTO listings (seller_id, card_id, \`type\`, price, min_offer, \`condition\`, description, status, is_featured, approved_at, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW(), (SELECT id FROM users WHERE role='admin' LIMIT 1))`,
      [sellerId, cardId, l.type, l.price, l.type === 'offer' ? l.price * 0.8 : null,
       l.condition, l.description, l.price > 500 ? 1 : 0]
    );
  }
  console.log(`  ✓ ${LISTINGS_DATA.length} listings created`);

  // ── 5. Auctions ───────────────────────────────────────────────────────────
  const AUCTIONS_DATA = [
    {
      seller: 'carlos_stickers', col: '2022 Panini FIFA World Cup', card: '099',
      start: 4500, current: 6200, buy_now: 15000, min_inc: 100,
      ends: future(2), featured: true,
      description: 'Messi Auto Gold /10 — the crown jewel of 2022 WC.'
    },
    {
      seller: 'sarah_cards', col: '2003 Topps Chrome Basketball', card: '111',
      start: 8000, current: 11500, buy_now: null, min_inc: 250,
      ends: future(1), featured: true,
      description: 'LeBron James Rookie Refractor RC. Graded BGS 9.'
    },
    {
      seller: 'yuki_sports', col: '2022 Panini FIFA World Cup', card: '100',
      start: 1500, current: 2800, buy_now: 6000, min_inc: 100,
      ends: future(3), featured: true,
      description: 'Mbappé Auto Silver /25. Top condition.'
    },
    {
      seller: 'marco_collects', col: '2023 Panini Prizm Basketball', card: '005',
      start: 800, current: 1650, buy_now: 4000, min_inc: 50,
      ends: future(1), featured: false,
      description: 'Victor Wembanyama Rookie Prizm. First-year card of a generational talent.'
    },
    {
      seller: 'sarah_cards', col: '2023 Panini Prizm NFL', card: '001',
      start: 600, current: 1200, buy_now: 3500, min_inc: 50,
      ends: future(4), featured: false,
      description: 'Mahomes Silver Prizm. Clean card, no print lines.'
    },
  ];

  for (const a of AUCTIONS_DATA) {
    const sellerId = userIds[a.seller];
    const cardId   = cardIds[`${a.col}::${a.card}`];
    if (!sellerId || !cardId) continue;

    // Create listing
    await pool.execute(
      `INSERT INTO listings (seller_id, card_id, \`type\`, price, \`condition\`, description, status, approved_at, approved_by)
       VALUES (?, ?, 'auction', ?, 'mint', ?, 'active', NOW(), (SELECT id FROM users WHERE role='admin' LIMIT 1))`,
      [sellerId, cardId, a.buy_now, a.description]
    );
    const [[lRow]] = await pool.execute(
      'SELECT id FROM listings WHERE seller_id = ? AND card_id = ? AND `type`=\'auction\' ORDER BY created_at DESC LIMIT 1',
      [sellerId, cardId]
    );

    await pool.execute(
      `INSERT INTO auctions (listing_id, seller_id, card_id, start_price, reserve_price, current_price, buy_now_price, min_increment, status, starts_at, ends_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?)`,
      [lRow.id, sellerId, cardId, a.start, a.start * 0.9, a.current, a.buy_now, a.min_inc, a.ends, a.featured ? 1 : 0]
    );

    const [[aRow]] = await pool.execute(
      'SELECT id FROM auctions WHERE seller_id = ? AND card_id = ? ORDER BY created_at DESC LIMIT 1',
      [sellerId, cardId]
    );

    // Seed bids — multiple rounds per auction
    const bidders = Object.values(userIds).filter(id => id !== sellerId);
    let currentBid = a.start;
    const bidCount = rand(4, 10);

    for (let i = 0; i < bidCount; i++) {
      const bidder = bidders[i % bidders.length];
      currentBid += a.min_inc * rand(1, 4);
      const isLast = i === bidCount - 1;
      if (isLast) currentBid = a.current;

      await pool.execute(
        `INSERT INTO bids (auction_id, bidder_id, amount, is_winning)
         VALUES (?, ?, ?, ?)`,
        [aRow.id, bidder, currentBid, isLast ? 1 : 0]
      );
    }

    await pool.execute('UPDATE auctions SET bid_count = ? WHERE id = ?', [bidCount, aRow.id]);
  }
  console.log(`  ✓ ${AUCTIONS_DATA.length} auctions created with bid history`);

  // ── 6. Summary ────────────────────────────────────────────────────────────
  const [[colCount]]    = await pool.execute('SELECT COUNT(*) AS n FROM collections');
  const [[cardCount]]   = await pool.execute('SELECT COUNT(*) AS n FROM cards');
  const [[userCount]]   = await pool.execute('SELECT COUNT(*) AS n FROM users');
  const [[listCount]]   = await pool.execute('SELECT COUNT(*) AS n FROM listings');
  const [[auctCount]]   = await pool.execute('SELECT COUNT(*) AS n FROM auctions');
  const [[ucCount]]     = await pool.execute('SELECT COUNT(*) AS n FROM user_cards');

  console.log('\n  ═══════════════════════════════');
  console.log('  ✅  Seed complete!');
  console.log(`     Collections : ${colCount.n}`);
  console.log(`     Cards       : ${cardCount.n}`);
  console.log(`     Users       : ${userCount.n}`);
  console.log(`     User cards  : ${ucCount.n}`);
  console.log(`     Listings    : ${listCount.n}`);
  console.log(`     Auctions    : ${auctCount.n}`);
  console.log('  ═══════════════════════════════\n');
  console.log('  Test accounts (password: Pass@1234):');
  for (const u of USERS) {
    console.log(`    ${u.email.padEnd(28)} → ${u.username}`);
  }
  console.log('  Admin: admin@cardmatch.io / Admin@CardMatch1\n');

  pool.end();
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
