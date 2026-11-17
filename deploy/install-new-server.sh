#!/bin/bash
set -e

echo "=========================================="
echo " Köz Xəzər Dönər POS - Server Quraşdırılması"
echo "=========================================="

# 1. Paketləri yenilə və tələb olunan alətləri quraşdır
apt update -y
apt install -y unzip curl ufw

# 2. Node.js 20 quraşdır (əgər yoxdursa)
if ! command -v node &> /dev/null; then
    echo "Node.js 20 quraşdırılır..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js artıq mövcuddur: $(node -v)"
fi

# 3. PM2 quraşdır (əgər yoxdursa)
if ! command -v pm2 &> /dev/null; then
    echo "PM2 quraşdırılır..."
    npm install -g pm2
else
    echo "PM2 artıq mövcuddur: $(pm2 -v)"
fi

# 4. Qovluğu yarat və arxivdən çıxart
mkdir -p /var/www/pos-system
if [ -f "/root/pos-server-deploy.zip" ]; then
    echo "Arxiv /var/www/pos-system qovluğuna çıxarılır..."
    unzip -o /root/pos-server-deploy.zip -d /var/www/pos-system
fi

# 5. Sistemi PM2 ilə işə sal
cd /var/www/pos-system
pm2 delete koz-doner-pos 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 6. Firewall port 3001-i aç
ufw allow 3001/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 3001 -j ACCEPT 2>/dev/null || true

echo "=========================================="
echo "✅ TƏBRİKLƏR! POS Sistemi uğurla işə salındı!"
echo "Server Portu: 3001"
echo "Status yoxlamaq üçün: pm2 status"
echo "=========================================="
