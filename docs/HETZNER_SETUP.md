# 🖥️ התקנת JDownloader על שרת Hetzner (Linux)

מדריך מלא להתקנת המערכת על שרת Linux שרץ 24/7.

**GitHub Repo:** https://github.com/ZyrticX/MP4.git

## 📋 דרישות מקדימות

- שרת Hetzner עם Ubuntu 22.04 / Debian 12
- גישת SSH לשרת
- חשבון MyJDownloader (נרשמים ב-[my.jdownloader.org](https://my.jdownloader.org))

---

## 🚀 שלב 1: התחברות לשרת

```bash
ssh root@YOUR_SERVER_IP
```

---

## 🔧 שלב 2: התקנת דרישות

```bash
# עדכון המערכת
apt update && apt upgrade -y

# התקנת Java (נדרש ל-JDownloader)
apt install -y openjdk-17-jre-headless

# התקנת Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# בדיקה
java -version
node --version
npm --version
```

---

## 📥 שלב 3: התקנת JDownloader 2

```bash
# יצירת תיקייה
mkdir -p /opt/jdownloader
cd /opt/jdownloader

# הורדת JDownloader
wget http://installer.jdownloader.org/JDownloader.jar

# הרצה ראשונה (יוריד קבצים נוספים)
java -jar JDownloader.jar -norestart
# המתן עד שתראה "JDownloader 2 started"
# לחץ Ctrl+C לעצירה
```

---

## 🔐 שלב 4: הגדרת MyJDownloader

```bash
# יצירת קובץ הגדרות
mkdir -p /opt/jdownloader/cfg

cat > /opt/jdownloader/cfg/org.jdownloader.api.myjdownloader.MyJDownloaderSettings.json << 'EOF'
{
  "email" : "YOUR_MYJD_EMAIL@example.com",
  "password" : "YOUR_MYJD_PASSWORD",
  "devicename" : "HetznerServer",
  "autoconnectenabledv2" : true
}
EOF
```

**חשוב:** החלף את:
- `YOUR_MYJD_EMAIL@example.com` - האימייל שלך
- `YOUR_MYJD_PASSWORD` - הסיסמה שלך
- `HetznerServer` - שם שתרצה לראות

---

## 🔄 שלב 5: הגדרת JDownloader כשירות

```bash
# יצירת קובץ שירות systemd
cat > /etc/systemd/system/jdownloader.service << 'EOF'
[Unit]
Description=JDownloader 2
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jdownloader
ExecStart=/usr/bin/java -Djava.awt.headless=true -jar /opt/jdownloader/JDownloader.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# הפעלת השירות
systemctl daemon-reload
systemctl enable jdownloader
systemctl start jdownloader

# בדיקת סטטוס
systemctl status jdownloader
```

תראה משהו כזה:
```
● jdownloader.service - JDownloader 2
     Active: active (running)
```

---

## 📦 שלב 6: התקנת AviMP4 API

```bash
# מעבר לתיקיית opt
cd /opt

# שכפול הפרויקט מ-GitHub
git clone https://github.com/ZyrticX/MP4.git avimp4

# מעבר לתיקייה
cd avimp4

# התקנת dependencies
npm install

# יצירת תיקיית הורדות
mkdir -p downloads
```

### יצירת קובץ .env:

```bash
nano .env
```

### העתק את התוכן הבא (החלף את הערכים המסומנים!):

```env
# ═══════════════════════════════════════════════════════════════════
# MyJDownloader - הפרטים מהחשבון שלך ב-my.jdownloader.org
# ═══════════════════════════════════════════════════════════════════
MYJD_EMAIL=YOUR_EMAIL@example.com
MYJD_PASSWORD=YOUR_PASSWORD
MYJD_DEVICE_NAME=HetznerServer

# ═══════════════════════════════════════════════════════════════════
# Supabase - streemix.com
# ═══════════════════════════════════════════════════════════════════
SUPABASE_URL=https://jdyekwizsviuyklsrsky.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY

# API Secret - לאימות בקשות (חייב להיות זהה למה שב-Edge Function!)
DOWNLOAD_API_SECRET=e977d952339bb0fcda0def1be3d78a608240b93adf1360b93c2ef12f10fe9e45

# ═══════════════════════════════════════════════════════════════════
# Server
# ═══════════════════════════════════════════════════════════════════
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://streemmix.com

# ═══════════════════════════════════════════════════════════════════
# Downloads
# ═══════════════════════════════════════════════════════════════════
DOWNLOAD_PATH=/opt/avimp4/downloads
```

**שמור:** `Ctrl+X` → `Y` → `Enter`

---

## 🔄 שלב 7: הגדרת API כשירות

```bash
# יצירת שירות systemd
cat > /etc/systemd/system/avimp4-api.service << 'EOF'
[Unit]
Description=AviMP4 Download API
After=network.target jdownloader.service
Requires=jdownloader.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/avimp4
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# בנייה והפעלה
cd /opt/avimp4
npm run build

systemctl daemon-reload
systemctl enable avimp4-api
systemctl start avimp4-api

# בדיקה
systemctl status avimp4-api
```

---

## 🌐 שלב 8: הגדרת Nginx (Reverse Proxy)

**IP השרת שלך:** `77.42.29.11`

```bash
# התקנת Nginx (אם לא מותקן)
apt install -y nginx

# הגדרת reverse proxy
cat > /etc/nginx/sites-available/avimp4 << 'EOF'
server {
    listen 80;
    server_name 77.42.29.11;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# הפעלה
ln -sf /etc/nginx/sites-available/avimp4 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 🔒 שלב 9: הגדרת SSL (אופציונלי)

**אם תרצה subdomain עם SSL** (כמו `api.streemmix.com`):

1. צור A Record ב-DNS: `api.streemmix.com` → `77.42.29.11`
2. אז תריץ:

```bash
# עדכון nginx לדומיין
sed -i 's/77.42.29.11/api.streemmix.com/' /etc/nginx/sites-available/avimp4
nginx -t && systemctl restart nginx

# התקנת SSL
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.streemmix.com
systemctl enable certbot.timer
```

**בינתיים אפשר להשתמש ב-HTTP עם IP:**
```
http://77.42.29.11/api/downloads
```

---

## ✅ שלב 10: בדיקה סופית

```bash
# בדיקת כל השירותים
systemctl status jdownloader
systemctl status avimp4-api
systemctl status nginx

# בדיקת ה-API
curl http://localhost:3001/health

# בדיקה מבחוץ (מהמחשב שלך)
curl http://YOUR_SERVER_IP/health
```

---

## 📊 פקודות שימושיות

```bash
# צפייה בלוגים של JDownloader
journalctl -u jdownloader -f

# צפייה בלוגים של ה-API
journalctl -u avimp4-api -f

# הפעלה מחדש
systemctl restart jdownloader
systemctl restart avimp4-api

# בדיקת שימוש בדיסק
df -h /opt/avimp4/downloads
```

---

## 🗂️ מבנה התיקיות בשרת

```
/opt/
├── jdownloader/              # JDownloader 2
│   ├── JDownloader.jar
│   ├── cfg/                  # הגדרות
│   └── logs/                 # לוגים
│
└── avimp4/                   # ה-API שלנו (מ-GitHub)
    ├── src/                  # קוד מקור
    │   ├── index.ts
    │   ├── lib/
    │   │   ├── jdownloader/  # לקוח JDownloader
    │   │   └── supabase.ts
    │   ├── routes/
    │   └── services/
    ├── dist/                 # קוד מקומפל (נוצר אחרי npm run build)
    ├── downloads/            # קבצים שהורדו
    ├── docs/                 # תיעוד
    ├── .env                  # הגדרות (לא ב-Git!)
    ├── env.template          # תבנית להגדרות
    ├── package.json
    └── tsconfig.json
```

---

## ⚠️ טיפים חשובים

1. **תיקיית הורדות**: וודא שיש מספיק מקום בדיסק
   ```bash
   # בדיקת מקום
   df -h
   ```

2. **ניקוי אוטומטי**: הוסף cron job למחיקת קבצים ישנים
   ```bash
   # מחיקת קבצים מעל 7 ימים
   crontab -e
   # הוסף שורה:
   0 3 * * * find /opt/avimp4/downloads -mtime +7 -delete
   ```

3. **Firewall**: פתח רק את הפורטים הנדרשים
   ```bash
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

---

## 🎉 סיום!

עכשיו יש לך:
- ✅ JDownloader רץ 24/7 על השרת
- ✅ API להורדות זמין תמיד
- ✅ הכל מתחיל אוטומטית אחרי restart

**כתובת ה-API שלך:**
```
http://77.42.29.11/api/downloads
```

(או `https://api.streemmix.com/api/downloads` אם הגדרת SSL)

---

## 📝 סיכום מהיר - רק הפקודות:

```bash
# 1. Clone the repo
cd /opt
git clone https://github.com/ZyrticX/MP4.git avimp4
cd avimp4

# 2. Install
npm install
mkdir -p downloads

# 3. Create .env (edit with your values!)
nano .env

# 4. Build
npm run build

# 5. Create systemd service
cat > /etc/systemd/system/avimp4-api.service << 'EOF'
[Unit]
Description=AviMP4 Download API
After=network.target jdownloader.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/avimp4
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 6. Start service
systemctl daemon-reload
systemctl enable avimp4-api
systemctl start avimp4-api

# 7. Check status
systemctl status avimp4-api
curl http://localhost:3001/health
```
