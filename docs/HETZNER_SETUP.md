# 🖥️ התקנת JDownloader על שרת Hetzner (Linux)

מדריך מלא להתקנת המערכת על שרת Linux שרץ 24/7.

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
# יצירת תיקייה לפרויקט
mkdir -p /opt/avimp4
cd /opt/avimp4

# שכפול או יצירת הקבצים
# אם יש לך git repo:
# git clone YOUR_REPO_URL .

# או העתקה ידנית של הקבצים מהמחשב שלך
```

### העלאת קבצים מהמחשב שלך:

ב-PowerShell על המחשב שלך:
```powershell
# העתקת כל הקבצים לשרת
scp -r C:\Users\Evgen\Desktop\AviMP4\* root@YOUR_SERVER_IP:/opt/avimp4/
```

### המשך על השרת:

```bash
cd /opt/avimp4

# התקנת dependencies
npm install

# יצירת קובץ .env
cat > .env << 'EOF'
# MyJDownloader
MYJD_EMAIL=YOUR_MYJD_EMAIL@example.com
MYJD_PASSWORD=YOUR_MYJD_PASSWORD
MYJD_DEVICE_NAME=HetznerServer

# Supabase
SUPABASE_URL=https://zhlrqnbfqcuqmnuqusyq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobHJxbmJmcWN1cW1udXF1c3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjI3OTEsImV4cCI6MjA3NzgzODc5MX0.cXmeFNhnI6BqumGa512P53DHMn-5tTQkA6rsWg6K7fw
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Downloads
DOWNLOAD_PATH=/opt/avimp4/downloads
EOF
```

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

```bash
# התקנת Nginx
apt install -y nginx

# הגדרת reverse proxy
cat > /etc/nginx/sites-available/avimp4 << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

# הפעלה
ln -s /etc/nginx/sites-available/avimp4 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔒 שלב 9: הגדרת SSL (אופציונלי אבל מומלץ)

```bash
# התקנת Certbot
apt install -y certbot python3-certbot-nginx

# קבלת תעודת SSL
certbot --nginx -d YOUR_DOMAIN.com

# חידוש אוטומטי
systemctl enable certbot.timer
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
├── jdownloader/           # JDownloader 2
│   ├── JDownloader.jar
│   ├── cfg/               # הגדרות
│   └── logs/              # לוגים
│
└── avimp4/                # ה-API שלנו
    ├── dist/              # קוד מקומפל
    ├── downloads/         # קבצים שהורדו
    ├── node_modules/
    ├── .env
    └── package.json
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
http://YOUR_SERVER_IP/api/downloads
```

עדכן את הפרונטאנד שלך להשתמש בכתובת הזו!


