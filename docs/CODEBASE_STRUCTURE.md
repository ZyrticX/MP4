# 📁 מבנה הפרויקט - AviMP4

סיכום מלא של כל הקבצים במערכת ותפקידיהם.

---

## 🗂️ מבנה תיקיות

```
AviMP4/
├── 📄 package.json           # הגדרות npm והתלויות
├── 📄 tsconfig.json          # הגדרות TypeScript
├── 📄 env.template           # תבנית משתני סביבה
├── 📄 README.md              # תיעוד ראשי
├── 📄 jdownloader.md         # תיעוד API מקורי של MyJDownloader
│
├── 📁 src/                   # קוד מקור TypeScript
│   ├── 📄 index.ts           # נקודת כניסה לשרת
│   │
│   ├── 📁 lib/               # ספריות
│   │   ├── 📄 supabase.ts    # לקוח Supabase
│   │   │
│   │   └── 📁 jdownloader/   # מודול JDownloader
│   │       ├── 📄 index.ts   # ייצוא מודולים
│   │       ├── 📄 client.ts  # לקוח API ראשי
│   │       ├── 📄 crypto.ts  # הצפנה וחתימות
│   │       └── 📄 types.ts   # טיפוסי TypeScript
│   │
│   ├── 📁 routes/            # נתיבי API
│   │   └── 📄 downloads.ts   # API endpoints להורדות
│   │
│   └── 📁 services/          # לוגיקה עסקית
│       └── 📄 download-service.ts  # שירות הורדות
│
├── 📁 frontend/              # קבצי Frontend
│   ├── 📄 index.html         # דף בדיקה בסיסי
│   └── 📁 components/
│       └── 📄 VideoDownloader.tsx  # קומפוננטת React
│
├── 📁 docs/                  # תיעוד
│   ├── 📄 SETUP_GUIDE_HE.md  # מדריך התקנה בעברית
│   ├── 📄 HETZNER_SETUP.md   # מדריך התקנה על שרת
│   ├── 📄 JDOWNLOADER_API_SUMMARY.md  # סיכום API
│   └── 📄 CODEBASE_STRUCTURE.md      # קובץ זה
│
└── 📁 scripts/               # סקריפטים
    └── 📄 setup.ps1          # סקריפט התקנה (PowerShell)
```

---

## 📄 פירוט קבצים

### `src/index.ts` - נקודת כניסה

**תפקיד:** שרת Express ראשי

**תכולה:**
- הגדרת Express server
- Middleware (CORS, JSON parsing)
- Health check endpoint (`/health`)
- חיבור routes
- Error handling
- Graceful shutdown

**Endpoints:**
- `GET /health` - בדיקת תקינות
- `POST /api/downloads` - שליחת הורדה
- `GET /api/downloads/:id` - סטטוס הורדה
- וכו'

---

### `src/lib/jdownloader/client.ts` - לקוח JDownloader

**תפקיד:** תקשורת עם MyJDownloader API

**Class: `JDownloaderClient`**

**מתודות ציבוריות:**

| מתודה | תיאור |
|-------|--------|
| `connect()` | התחברות ל-MyJDownloader |
| `disconnect()` | ניתוק |
| `listDevices()` | רשימת מכשירים |
| `selectDevice(name?)` | בחירת מכשיר |
| `addLinks(query)` | הוספת קישורים ל-LinkGrabber |
| `isCollecting()` | האם עדיין סורק קישורים |
| `queryCrawledLinks(query?)` | שאילתת קישורים בLinkGrabber |
| `moveToDownloadList(linkIds, packageIds)` | העברה לרשימת הורדות |
| `startDownloads()` | התחלת הורדות |
| `stopDownloads()` | עצירת הורדות |
| `pauseDownloads(pause)` | השהיה |
| `getDownloadState()` | סטטוס נוכחי |
| `getSpeed()` | מהירות הורדה |
| `queryDownloadLinks(query?)` | שאילתת הורדות |
| `queryDownloadPackages(query?)` | שאילתת חבילות |

**מתודות פרטיות:**

| מתודה | תיאור |
|-------|--------|
| `callServer(path, params?)` | קריאה לשרת MyJD |
| `callDevice(action, params?)` | קריאה למכשיר JDownloader |

---

### `src/lib/jdownloader/crypto.ts` - פונקציות קריפטוגרפיה

**תפקיד:** הצפנה, פענוח, וחתימות

**פונקציות:**

| פונקציה | תיאור | פרמטרים |
|---------|--------|----------|
| `createLoginSecret(email, password)` | יצירת login secret | email + password + "server" |
| `createDeviceSecret(email, password)` | יצירת device secret | email + password + "device" |
| `updateEncryptionToken(currentToken, serverToken)` | עדכון encryption token | SHA256(current + serverHex) |
| `encrypt(data, token)` | הצפנת AES-128-CBC | data → base64 |
| `decrypt(encryptedData, token)` | פענוח AES-128-CBC | base64 → string |
| `createSignature(query, token)` | יצירת HMAC-SHA256 | query → hex |
| `generateRequestId()` | Request ID (timestamp) | Date.now() |

**⚠️ חשוב:**
- IV = bytes 0-15 של הטוקן
- Key = bytes 16-31 של הטוקן

---

### `src/lib/jdownloader/types.ts` - טיפוסים

**תפקיד:** הגדרות TypeScript

**ממשקים עיקריים:**

```typescript
interface JDDevice {
  id: string;
  name: string;
  type: string;
}

interface JDSession {
  sessionToken: string;
  regainToken: string;
  serverEncryptionToken: Buffer;
  deviceEncryptionToken: Buffer;
}

interface AddLinksQuery {
  links: string;
  packageName?: string;
  destinationFolder?: string;
  autostart?: boolean;
  // ...
}

interface CrawledLink {
  uuid: number;
  name: string;
  availability: AvailableLinkState;
  bytesTotal: number;
  // ...
}

interface DownloadLink {
  uuid: number;
  name: string;
  finished: boolean;
  bytesLoaded: number;
  bytesTotal: number;
  speed?: number;
  // ...
}
```

---

### `src/lib/supabase.ts` - לקוח Supabase

**תפקיד:** חיבור לדאטאבייס

**תכולה:**
- יצירת Supabase client
- Mock client כשאין הגדרות
- הגדרות טיפוסי `DownloadJob`

**פונקציונליות Mock:**
- שומר jobs בזיכרון (`Map`)
- מדמה פעולות insert/update/select
- מאפשר פיתוח ללא Supabase

---

### `src/services/download-service.ts` - שירות הורדות

**תפקיד:** לוגיקת הורדות עיקרית

**Class: `DownloadService`**

**זרימת עבודה:**
```
submitDownload()
      │
      ▼
processDownload()
      │
      ├── ensureConnected()
      │
      ├── addLinks() → JDownloader
      │
      ├── waitForCrawling()
      │
      ├── selectQualityVariant()
      │
      ├── moveToDownloadList()
      │
      ├── startDownloads()
      │
      └── monitorDownload() ◄──┐
            │                  │
            └──────────────────┘
```

**מתודות עיקריות:**

| מתודה | תיאור |
|-------|--------|
| `connect()` | חיבור ל-JDownloader |
| `submitDownload(options)` | הגשת הורדה חדשה |
| `processDownload(job)` | עיבוד הורדה (async) |
| `waitForCrawling(jobId)` | המתנה לסיום סריקה |
| `selectQualityVariant(links, quality, mediaType)` | בחירת איכות |
| `monitorDownload(jobId, packageId, linkIds)` | מעקב התקדמות |
| `getProgress(jobId)` | קבלת סטטוס |
| `cancelJob(jobId)` | ביטול הורדה |
| `retryJob(jobId)` | ניסיון חוזר |

---

### `src/routes/downloads.ts` - נתיבי API

**תפקיד:** Express routes להורדות

**Endpoints:**

| Method | Path | תיאור |
|--------|------|--------|
| POST | `/api/downloads` | שליחת הורדה חדשה |
| GET | `/api/downloads/:jobId` | סטטוס הורדה ספציפית |
| GET | `/api/downloads/user/:userId` | הורדות של משתמש |
| POST | `/api/downloads/:jobId/cancel` | ביטול הורדה |
| POST | `/api/downloads/:jobId/retry` | ניסיון חוזר |

**וולידציה:**
- משתמש ב-Zod לוולידציה
- `url` - חייב להיות URL תקין
- `mediaType` - video/audio/both
- `preferredQuality` - ברירת מחדל 1080p

---

### `frontend/components/VideoDownloader.tsx` - קומפוננטת React

**תפקיד:** ממשק משתמש להורדות

**Props:**
```typescript
interface VideoDownloaderProps {
  userId?: string;
  onDownloadComplete?: (job: DownloadJob) => void;
  onError?: (error: string) => void;
  className?: string;
}
```

**State:**
- `url` - כתובת להורדה
- `mediaType` - סוג מדיה
- `quality` - איכות
- `downloads` - רשימת הורדות
- `pollingIds` - מזהים לפולינג

**פונקציות:**
- `handleSubmit()` - שליחת הורדה
- `pollStatus()` - מעקב סטטוס (כל 2 שניות)
- `handleCancel()` - ביטול
- `handleRetry()` - ניסיון חוזר

---

### `env.template` - תבנית משתני סביבה

**משתנים נדרשים:**

```env
# MyJDownloader (חובה)
MYJD_EMAIL=
MYJD_PASSWORD=
MYJD_DEVICE_NAME=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Server
PORT=3001
NODE_ENV=development/production
CORS_ORIGIN=

# Downloads
DOWNLOAD_PATH=
```

---

## 🔄 זרימת נתונים

```
┌──────────────┐
│   Frontend   │
│  (Browser)   │
└──────┬───────┘
       │ POST /api/downloads
       ▼
┌──────────────┐
│   Express    │
│   Server     │
└──────┬───────┘
       │ submitDownload()
       ▼
┌──────────────┐     ┌──────────────┐
│  Download    │────▶│   Supabase   │
│   Service    │     │   Database   │
└──────┬───────┘     └──────────────┘
       │ addLinks()
       ▼
┌──────────────┐     ┌──────────────┐
│  JDownloader │────▶│ MyJDownloader│
│    Client    │     │    Server    │
└──────────────┘     └──────┬───────┘
                           │
                           ▼
                     ┌──────────────┐
                     │ JDownloader  │
                     │   (Device)   │
                     └──────────────┘
```

---

## 📝 סדר פיתוח מומלץ

1. **התקנה:** `npm install`
2. **הגדרות:** צור `.env` מתוך `env.template`
3. **בנייה:** `npm run build`
4. **פיתוח:** `npm run dev`
5. **בדיקה:** `curl http://localhost:3001/health`

