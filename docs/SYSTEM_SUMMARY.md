# 📋 סיכום מערכת AviMP4

## 🎯 תיאור המערכת

**AviMP4** היא מערכת להורדת וידאו/אודיו מ-YouTube, Facebook, TikTok ועוד 1000+ אתרים באמצעות JDownloader.

### ארכיטקטורה
```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│   │  React   │───▶│   Express    │───▶│   MyJDownloader     │   │
│   │ Frontend │◀───│   Backend    │◀───│   Cloud API         │   │
│   └──────────┘    └──────────────┘    └─────────────────────┘   │
│        │                │                       │               │
│        │                │                       │               │
│        │                ▼                       ▼               │
│        │          ┌──────────┐          ┌─────────────┐         │
│        │          │ Supabase │          │ JDownloader │         │
│        └─────────▶│ Database │          │   Client    │         │
│                   └──────────┘          └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 מבנה קבצים

| קובץ/תיקייה | תפקיד |
|-------------|--------|
| `src/index.ts` | שרת Express ראשי |
| `src/lib/jdownloader/` | מודול JDownloader API |
| `src/services/download-service.ts` | לוגיקת הורדות |
| `src/routes/downloads.ts` | API endpoints |
| `frontend/components/VideoDownloader.tsx` | קומפוננטת React |
| `docs/` | תיעוד (4 קבצים) |

---

## 🔐 אבטחה והצפנה

### אלגוריתמים בשימוש:

| אלגוריתם | שימוש |
|----------|-------|
| SHA256 | יצירת secrets ו-tokens |
| AES-128-CBC | הצפנת תקשורת |
| HMAC-SHA256 | חתימות דיגיטליות |

### זרימת אימות:
```
1. יצירת loginSecret = SHA256(email + password + "server")
2. התחברות עם חתימת HMAC על query
3. קבלת sessionToken מהשרת
4. יצירת encryptionTokens לשרת ולמכשיר
5. כל תקשורת מוצפנת ב-AES וחתומה ב-HMAC
```

---

## 📡 API Endpoints

### Download API

| Method | Endpoint | תיאור |
|--------|----------|--------|
| POST | `/api/downloads` | שליחת הורדה חדשה |
| GET | `/api/downloads/:id` | סטטוס הורדה |
| GET | `/api/downloads/user/:userId` | הורדות של משתמש |
| POST | `/api/downloads/:id/cancel` | ביטול הורדה |
| POST | `/api/downloads/:id/retry` | ניסיון חוזר |

### דוגמת בקשה:
```json
POST /api/downloads
{
  "url": "https://youtube.com/watch?v=xxx",
  "mediaType": "video",
  "preferredQuality": "1080p"
}
```

### דוגמת תגובה:
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "pending",
    "sourceUrl": "...",
    "sourcePlatform": "youtube"
  }
}
```

---

## ⚙️ הגדרות נדרשות

### משתני סביבה (.env):
```env
# MyJDownloader (חובה)
MYJD_EMAIL=your@email.com
MYJD_PASSWORD=your_password
MYJD_DEVICE_NAME=device_name

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Server
PORT=3001
CORS_ORIGIN=https://your-domain.com
DOWNLOAD_PATH=/path/to/downloads
```

---

## 📊 סטטוסי הורדה

| סטטוס | תיאור |
|-------|--------|
| `pending` | ממתין בתור |
| `crawling` | מנתח קישור |
| `ready` | מוכן להורדה |
| `downloading` | מוריד |
| `completed` | הושלם בהצלחה |
| `failed` | נכשל |
| `cancelled` | בוטל |

---

## 🖥️ פלטפורמות נתמכות

- YouTube (videos, playlists, channels)
- Facebook (videos, reels)
- Vimeo
- TikTok
- Instagram (posts, reels, stories)
- Twitter/X
- Twitch (VODs, clips)
- Dailymotion
- + עוד 1000 אתרים

---

## 🚀 התקנה מהירה

### פיתוח מקומי:
```bash
# 1. שכפול
git clone https://github.com/ZyrticX/MP4.git
cd MP4

# 2. התקנה
npm install

# 3. הגדרות
cp env.template .env
# ערוך את .env עם הפרטים שלך

# 4. הרצה
npm run dev
```

### פרודקשן (Hetzner):
```bash
# ראה docs/HETZNER_SETUP.md למדריך מלא
```

---

## 🐛 דיבוג בעיות חתימות

### בדוק בלוגים:
```
createSignature - query: /my/listdevices?rid=xxx&sessiontoken=yyy
createSignature - token (hex): abc123...
createSignature - signature: def456...
```

### בעיות נפוצות:

1. **AUTH_FAILED**: בדוק email ב-lowercase
2. **TOKEN_INVALID**: וודא sessiontoken ב-query
3. **Decryption error**: בדוק סדר IV/Key
4. **Device error**: בדוק signature על devicePath

---

## 📚 קבצי תיעוד

| קובץ | תוכן |
|------|------|
| `SETUP_GUIDE_HE.md` | מדריך התקנה מפורט (עברית) |
| `HETZNER_SETUP.md` | התקנה על שרת Linux |
| `JDOWNLOADER_API_SUMMARY.md` | סיכום MyJDownloader API |
| `CODEBASE_STRUCTURE.md` | מבנה הקוד |
| `CRYPTO_SIGNATURES.md` | הסבר הצפנות וחתימות |
| `SYSTEM_SUMMARY.md` | סיכום כללי (קובץ זה) |

---

## 🔗 קישורים חשובים

- **GitHub**: https://github.com/ZyrticX/MP4
- **MyJDownloader**: https://my.jdownloader.org
- **JDownloader**: https://jdownloader.org/jdownloader2
- **API Docs**: ראה `jdownloader.md` בפרויקט

---

## 📞 פתרון בעיות

### JDownloader לא מתחבר:
1. וודא JDownloader פועל
2. בדוק חיבור ב-Settings → My.JDownloader
3. וודא credentials נכונים ב-.env

### שגיאות חתימה:
1. ראה `CRYPTO_SIGNATURES.md`
2. הוסף לוגים ל-`crypto.ts`
3. בדוק אורכי buffers (צריך להיות 32)

### הורדות תקועות:
1. בדוק JDownloader UI
2. יתכן captcha
3. יתכן קישור לא נתמך

