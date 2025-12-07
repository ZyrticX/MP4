# 📚 סיכום MyJDownloader API

## 🔗 מידע בסיסי

| פרט | ערך |
|-----|-----|
| **API Endpoint** | `https://api.jdownloader.org` |
| **פרוטוקול** | REST (GET/POST) |
| **הצפנה** | AES-128-CBC |
| **חתימה** | HMAC-SHA256 |
| **פורמט** | JSON |

---

## 🔐 תהליך האימות (Authentication Flow)

```
┌─────────────────┐     1. /my/connect        ┌─────────────────┐
│                 │  ───────────────────────▶ │                 │
│   Client        │                           │   MyJD Server   │
│                 │  ◀─────────────────────── │                 │
└─────────────────┘     2. sessionToken       └─────────────────┘
        │
        │ 3. Update tokens
        ▼
┌─────────────────┐     4. /my/listdevices    ┌─────────────────┐
│   Client with   │  ───────────────────────▶ │                 │
│   new tokens    │                           │   MyJD Server   │
│                 │  ◀─────────────────────── │                 │
└─────────────────┘     5. device list        └─────────────────┘
        │
        │ 6. Select device
        ▼
┌─────────────────┐     7. /t_xxx_yyy/action  ┌─────────────────┐
│   Client        │  ───────────────────────▶ │   JDownloader   │
│                 │                           │   (via Server)  │
│                 │  ◀─────────────────────── │                 │
└─────────────────┘     8. encrypted response └─────────────────┘
```

---

## 🔑 יצירת מפתחות

### 1. Login Secret
```
loginSecret = SHA256(email.toLowerCase() + password + "server")
```
**שימוש:** חתימה על בקשת `/my/connect`

### 2. Device Secret  
```
deviceSecret = SHA256(email.toLowerCase() + password + "device")
```
**שימוש:** הצפנה/פענוח תקשורת עם JDownloader

### 3. Server Encryption Token
```
serverEncryptionToken = SHA256(loginSecret + hexToBytes(sessionToken))
```
**שימוש:** הצפנה/פענוח בקשות לשרת, חתימות לשרת

### 4. Device Encryption Token
```
deviceEncryptionToken = SHA256(deviceSecret + hexToBytes(sessionToken))
```
**שימוש:** הצפנה/פענוח בקשות למכשיר, חתימות למכשיר

---

## 🔒 הצפנה AES-128-CBC

### מבנה טוקן (32 bytes):
```
Token (32 bytes):
├── IV (bytes 0-15)   - Initialization Vector
└── Key (bytes 16-31) - AES Key
```

### הצפנה:
```typescript
function encrypt(data: string, token: Buffer): string {
  const iv = token.subarray(0, 16);
  const key = token.subarray(16, 32);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  return cipher.update(data, 'utf8', 'base64') + cipher.final('base64');
}
```

### פענוח:
```typescript
function decrypt(encryptedData: string, token: Buffer): string {
  const iv = token.subarray(0, 16);
  const key = token.subarray(16, 32);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  return decipher.update(encryptedData, 'base64', 'utf8') + decipher.final('utf8');
}
```

---

## ✍️ חתימות (Signatures)

### יצירת חתימה:
```typescript
function createSignature(query: string, token: Buffer): string {
  return crypto.createHmac('sha256', token)
    .update(query, 'utf8')
    .digest('hex');
}
```

### עבור קריאות שרת:
```
query = "/my/listdevices?rid=1234567890&sessiontoken=abc123"
signature = HMAC-SHA256(query, serverEncryptionToken)
url = API_ENDPOINT + query + "&signature=" + signature
```

### עבור קריאות מכשיר:
```
action = "/linkgrabberv2/addLinks"
signature = HMAC-SHA256(action, deviceEncryptionToken)
url = API_ENDPOINT + "/t_" + sessionToken + "_" + deviceId + action + "?signature=" + signature
```

---

## 📝 Request ID (rid)

- **חובה** בכל בקשה
- מספר שמוסיף מבקשה לבקשה
- ניתן להשתמש ב-timestamp (milliseconds)
- השרת מחזיר את ה-rid בתגובה לאימות

```typescript
function generateRequestId(): number {
  return Date.now();
}
```

---

## 🔄 סוגי קריאות

### קריאות לשרת (Server Calls)
| Endpoint | תיאור |
|----------|--------|
| `/my/connect` | התחברות וקבלת session token |
| `/my/disconnect` | ניתוק |
| `/my/listdevices` | רשימת מכשירים מחוברים |
| `/my/reconnect` | התחברות מחדש עם regain token |

### קריאות למכשיר (Device Calls)
| Namespace | תיאור |
|-----------|--------|
| `/linkgrabberv2/*` | ניהול Link Grabber |
| `/downloadsV2/*` | ניהול הורדות |
| `/downloadcontroller/*` | שליטה בהורדות (start/stop) |
| `/device/*` | פעולות מכשיר |
| `/jd/*` | מידע על JDownloader |

---

## 📊 Content-Type Headers

| סוג בקשה | Content-Type |
|----------|--------------|
| GET (לא מוצפן) | לא נדרש |
| POST (JSON רגיל) | `application/json; charset=utf-8` |
| POST (מוצפן) | `application/aesjson-jd; charset=utf-8` |

---

## ⚠️ שגיאות נפוצות

### HTTP 403 - AUTH_FAILED
**סיבות:**
- אימייל/סיסמה שגויים
- אימייל לא ב-lowercase
- חתימה שגויה

**פתרון:**
1. וודא אימייל ב-lowercase
2. בדוק שהסיסמה נכונה
3. בדוק חישוב החתימה

### HTTP 403 - TOKEN_INVALID
**סיבות:**
- Session token פג תוקף
- Encryption token שגוי

**פתרון:**
1. התחבר מחדש (`/my/connect`)
2. חשב מחדש את ה-encryption tokens

### HTTP 504 - OFFLINE
**סיבות:**
- JDownloader לא מחובר
- בעיית רשת

**פתרון:**
1. וודא JDownloader פועל
2. בדוק חיבור MyJDownloader בהגדרות

---

## 🛠️ Best Practices

1. **שמור tokens בזיכרון** - אל תחשב מחדש בכל בקשה
2. **טפל ב-reconnect** - אם token פג, התחבר מחדש אוטומטית
3. **השתמש ב-rid עולה** - timestamp הכי פשוט
4. **וודא lowercase email** - תמיד המר ל-lowercase
5. **לוגים מפורטים** - עוזר מאוד בדיבוג crypto

---

## 📁 קבצי קוד רלוונטיים

| קובץ | תפקיד |
|------|-------|
| `src/lib/jdownloader/client.ts` | לקוח API ראשי |
| `src/lib/jdownloader/crypto.ts` | פונקציות הצפנה וחתימות |
| `src/lib/jdownloader/types.ts` | טיפוסי TypeScript |
| `src/lib/jdownloader/index.ts` | ייצוא מודולים |

