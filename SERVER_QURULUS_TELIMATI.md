# 🚀 Köz Xəzər Dönər POS - Serverə Quraşdırma Təlimatı

Bu layihə tam olaraq həm **Frontend (React + Tailwind)**, həm də **Backend (Express + JSON Database)** vahid serverdə (`dist/server.cjs`) işləyəcək şəkildə hazırlanmışdır.

---

## 📁 1. Layihə Fayllarını Serverə Yükləmək

Layihəni serverinizə bir neçə üsulla yükləyə bilərsiniz:

### Metod A: Git ilə (Ən rahatı)
Serverinizdə terminal açıb layihə qovluğuna keçin:
```bash
git clone <sizin-repo-linkiniz> pos-sistemi
cd pos-sistemi
```

### Metod B: FileZilla / WinSCP / SCP ilə
Proyekt qovluğunu zip edib və ya birbaşa SFTP/SCP vasitəsilə serverinizə (məsələn: `/var/www/koz-doner-pos` ünvanına) yükləyin.

---

## ⚡ 2. Serverdə İşə Salma Variantları

Serveriniz üçün 2 ən asan və etibarlı üsul hazırlanıb:

---

### 🔹 VARIANT 1: Node.js + PM2 ilə (Tövsiyə olunan)

Serverdə **Node.js 20+** və **PM2** quraşdırılıbsa:

1. **PM2 quraşdırın (əgər yoxdursa):**
   ```bash
   sudo npm install -g pm2
   ```

2. **Proyekt qovluğuna keçin və avtomatik deploy skriptini işə salın:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   *Və ya əllə addım-addım:*
   ```bash
   npm install
   npm run build
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

3. **Statusu yoxlamaq və idarə etmək:**
   - Proseslərin vəziyyəti: `pm2 status`
   - Loglara canlı baxmaq: `pm2 logs koz-doner-pos`
   - Yenidən başlatmaq: `pm2 restart koz-doner-pos`
   - Dayandırmaq: `pm2 stop koz-doner-pos`

---

### 🔹 VARIANT 2: Docker & Docker Compose ilə

Əgər serverinizdə Docker varsa, tək bir əmrlə quraşdıra bilərsiniz:

```bash
docker compose up -d --build
```

- **Logları görmək:** `docker compose logs -f`
- **Dayandırmaq:** `docker compose down`
- **Yenidən build edib başlatmaq:** `docker compose up -d --build`

---

## 🌐 3. Nginx Reverse Proxy və Domain / SSL Quraşdırılması (İxtiyari)

Əgər proqramı `http://server_ip:3000` yerinə birbaşa domain və ya 80/443 portu ilə açmaq istəyirsinizsə:

1. **Nginx konfiqurasiyası yaradın:**
   ```bash
   sudo nano /etc/nginx/sites-available/pos.conf
   ```

2. **Aşağıdakı konfiqurasiyanı əlavə edin (domain adınızı və ya IP-nizi yazın):**
   ```nginx
   server {
       listen 80;
       server_name pos.sizin-domain.az; # və ya serverin IP ünvanı

       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

3. **Aktivləşdirin və Nginx-i yenidən başladın:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/pos.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Pulsuz SSL (HTTPS) əlavə etmək (Certbot ilə):**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d pos.sizin-domain.az
   ```

---

## 💾 4. Məlumat Bazası və Backup (`data.json`)

- Bütün məlumatlar (Menyu, Çeklər, Sifarişlər, Masa vəziyyətləri, Hesabatlar) proyektin ana qovluğundakı `data.json` faylında saxlanılır.
- **Ehtiyat nüsxə (Backup):** Sadəcə `data.json` faylını kopyalayıb saxlamağınız kifayətdir.
- İstəsəniz cronjob ilə hər gecə backup ala bilərsiniz:
  ```bash
  crontab -e
  # Hər gecə saat 04:00-da nüsxə çıxarır:
  0 4 * * * cp /var/www/pos-sistemi/data.json /var/backups/pos_data_$(date +\%Y\%m\%d).json
  ```

---

## ✅ Sistem Portları və Tələblər:
- **Port:** `3000` (dəyişmək üçün `.env` faylında `PORT=8080` qeyd edə bilərsiniz)
- **Node.js:** v18 və ya v20+
- **RAM:** Minimum 512MB - 1GB kifayətdir
