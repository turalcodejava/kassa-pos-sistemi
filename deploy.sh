#!/bin/bash
set -e

echo "🚀 [Köz Xəzər Dönər POS] Server yenilənməsi və işə salınması başlayır..."

# 1. Kodları yenilə (əgər git varsa)
if [ -d ".git" ]; then
  echo "📥 Git-dən ən son kodlar çəkilir..."
  git pull origin main || git pull
fi

# 2. Asılılıqları quraşdır
echo "📦 Asılılıqlar yoxlanılır və quraşdırılır..."
npm install

# 3. Layihəni build et (Frontend + Backend)
echo "⚙️ Layihə build edilir..."
npm run build

# 4. PM2 ilə işə sal / yenidən başlat
if command -v pm2 &> /dev/null; then
  echo "🔄 PM2 prosesi yenilənir..."
  pm2 describe koz-doner-pos > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    pm2 reload koz-doner-pos
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
  echo "✅ Sistem PM2 ilə uğurla işə salındı!"
else
  echo "⚠️ PM2 tapılmadı. Normal 'npm start' ilə işə salmaq üçün: npm start"
fi

echo "🎉 Hazırdır! Köz Xəzər Dönər POS serverdə aktivdir."
