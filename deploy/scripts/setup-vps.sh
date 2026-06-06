#!/bin/bash
# CardMatch — VPS initial setup (Ubuntu 22.04 / Hostinger)
# Run as root: bash setup-vps.sh

set -e
echo "=== CardMatch VPS Setup ==="

# ─── System update ────────────────────────────────────────────────────────────
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw build-essential software-properties-common

# ─── Node.js 20 LTS ──────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

# ─── MySQL 8.0 ───────────────────────────────────────────────────────────────
apt-get install -y mysql-server
mysql_secure_installation

# Create DB + user (run manually after setup)
echo "Run manually:"
echo "  mysql -u root -p"
echo "  CREATE DATABASE cardmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "  CREATE USER 'cardmatch_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';"
echo "  GRANT ALL PRIVILEGES ON cardmatch.* TO 'cardmatch_user'@'localhost';"
echo "  FLUSH PRIVILEGES;"

# ─── Nginx ───────────────────────────────────────────────────────────────────
apt-get install -y nginx
systemctl enable nginx

# ─── Certbot (SSL) ───────────────────────────────────────────────────────────
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# ─── Firewall ────────────────────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── Log directory ───────────────────────────────────────────────────────────
mkdir -p /var/log/cardmatch
mkdir -p /var/www/cardmatch

# ─── PM2 startup ─────────────────────────────────────────────────────────────
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Clone repo:  cd /var/www/cardmatch && git clone https://github.com/dariomigliaccio-new/efcards ."
echo "  2. Configure:   cp backend/.env.example backend/.env && nano backend/.env"
echo "  3. Install deps: cd backend && npm ci && cd ../frontend && npm ci"
echo "  4. Build:       cd frontend && npm run build"
echo "  5. DB migrate:  mysql -u cardmatch_user -p cardmatch < backend/database/schema.sql"
echo "  6. Nginx:       cp deploy/nginx/cardmatch.conf /etc/nginx/sites-available/cardmatch"
echo "               ln -s /etc/nginx/sites-available/cardmatch /etc/nginx/sites-enabled/"
echo "               certbot --nginx -d yourdomain.com -d api.yourdomain.com"
echo "               nginx -t && systemctl reload nginx"
echo "  7. Start:       pm2 start deploy/ecosystem.config.js --env production"
echo "               pm2 save"
