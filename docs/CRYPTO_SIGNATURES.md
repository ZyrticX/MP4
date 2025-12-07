# 🔐 סיכום חתימות והצפנות - MyJDownloader API

מדריך מפורט לכל מנגנוני ההצפנה והחתימות במערכת.

---

## 📋 סיכום מהיר

| רכיב | אלגוריתם | מפתח | שימוש |
|------|----------|------|-------|
| Login Secret | SHA256 | email+pass+"server" | חתימת /my/connect |
| Device Secret | SHA256 | email+pass+"device" | בסיס ל-deviceEncToken |
| Server Enc Token | SHA256 | loginSecret+sessionToken | הצפנה לשרת |
| Device Enc Token | SHA256 | deviceSecret+sessionToken | הצפנה למכשיר |
| הצפנה | AES-128-CBC | token[16-31] | הצפנת body |
| חתימה | HMAC-SHA256 | encToken | חתימת URL |

---

## 🔑 שלב 1: יצירת Secrets ראשוניים

### Login Secret
```typescript
// שימוש: חתימה על בקשת connect, בסיס ל-serverEncryptionToken
const loginSecret = SHA256(email.toLowerCase() + password + "server");
```

**דוגמה:**
```
email: "user@example.com"
password: "myPassword123"

input: "user@example.commyPassword123server"
output: Buffer 32 bytes (256 bits)
```

### Device Secret
```typescript
// שימוש: בסיס ל-deviceEncryptionToken
const deviceSecret = SHA256(email.toLowerCase() + password + "device");
```

**דוגמה:**
```
email: "user@example.com"  
password: "myPassword123"

input: "user@example.commyPassword123device"
output: Buffer 32 bytes (256 bits)
```

---

## 🔄 שלב 2: התחברות (/my/connect)

### בניית בקשה:
```typescript
const rid = Date.now();
const query = `/my/connect?email=${encodeURIComponent(email.toLowerCase())}&appkey=myjdapi&rid=${rid}`;
const signature = HMAC_SHA256(query, loginSecret).toHex();
const url = `https://api.jdownloader.org${query}&signature=${signature}`;
```

### תגובת שרת (מוצפנת):
```json
{
  "sessiontoken": "hex_string_64_chars",
  "regaintoken": "hex_string_64_chars"
}
```

**⚠️ הערה:** התגובה מוצפנת ב-AES עם `loginSecret` ויש לפענח אותה.

---

## 🔄 שלב 3: עדכון Encryption Tokens

### Server Encryption Token
```typescript
// sessionToken מגיע כ-hex string מהשרת
const sessionTokenBytes = Buffer.from(sessionToken, 'hex');
const serverEncryptionToken = SHA256(Buffer.concat([loginSecret, sessionTokenBytes]));
```

### Device Encryption Token
```typescript
const sessionTokenBytes = Buffer.from(sessionToken, 'hex');
const deviceEncryptionToken = SHA256(Buffer.concat([deviceSecret, sessionTokenBytes]));
```

---

## 🔐 שלב 4: הצפנה AES-128-CBC

### מבנה טוקן (32 bytes):
```
┌─────────────────┬─────────────────┐
│    IV (0-15)    │   Key (16-31)   │
│   16 bytes      │   16 bytes      │
└─────────────────┴─────────────────┘
```

### פונקציית הצפנה:
```typescript
function encrypt(plaintext: string, token: Buffer): string {
  // חילוץ IV ו-Key
  const iv = token.subarray(0, 16);   // bytes 0-15
  const key = token.subarray(16, 32); // bytes 16-31
  
  // יצירת cipher
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  
  // הצפנה
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // החזרה כ-Base64
  return encrypted.toString('base64');
}
```

### פונקציית פענוח:
```typescript
function decrypt(ciphertext: string, token: Buffer): string {
  // חילוץ IV ו-Key
  const iv = token.subarray(0, 16);   // bytes 0-15
  const key = token.subarray(16, 32); // bytes 16-31
  
  // המרה מ-Base64 ל-Buffer
  const encryptedBuffer = Buffer.from(ciphertext, 'base64');
  
  // יצירת decipher
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  
  // פענוח
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}
```

---

## ✍️ שלב 5: חתימות HMAC-SHA256

### פונקציית חתימה:
```typescript
function createSignature(query: string, token: Buffer): string {
  return crypto.createHmac('sha256', token)
    .update(query, 'utf8')
    .digest('hex');
}
```

### חתימה לקריאות שרת:
```typescript
// הquery כולל את כל הפרמטרים חוץ מ-signature
const query = `/my/listdevices?rid=${rid}&sessiontoken=${sessionToken}`;
const signature = createSignature(query, serverEncryptionToken);
const fullUrl = `${API_ENDPOINT}${query}&signature=${signature}`;
```

### חתימה לקריאות מכשיר:
```typescript
// החתימה על ה-path של ה-action
const action = `/linkgrabberv2/addLinks`;
const devicePath = `/t_${sessionToken}_${deviceId}${action}`;
const signature = createSignature(devicePath, deviceEncryptionToken);
const fullUrl = `${API_ENDPOINT}${devicePath}?signature=${signature}`;
```

---

## 📝 דוגמאות מלאות

### דוגמה 1: התחברות
```typescript
const email = "user@example.com";
const password = "secret123";

// שלב 1: יצירת login secret
const loginSecret = crypto.createHash('sha256')
  .update(email.toLowerCase() + password + 'server')
  .digest();
// Result: Buffer <32 bytes>

// שלב 2: בניית query
const rid = Date.now(); // 1702000000000
const query = `/my/connect?email=user%40example.com&appkey=myjdapi&rid=${rid}`;

// שלב 3: יצירת חתימה
const signature = crypto.createHmac('sha256', loginSecret)
  .update(query)
  .digest('hex');
// Result: "abc123def456..." (64 chars)

// שלב 4: שליחת בקשה
const response = await fetch(`https://api.jdownloader.org${query}&signature=${signature}`);
```

### דוגמה 2: רשימת מכשירים
```typescript
// אחרי התחברות מוצלחת
const rid = Date.now();
const query = `/my/listdevices?rid=${rid}&sessiontoken=${session.sessionToken}`;
const signature = createSignature(query, session.serverEncryptionToken);

const response = await fetch(`https://api.jdownloader.org${query}&signature=${signature}`);
const encrypted = await response.text();
const decrypted = decrypt(encrypted, session.serverEncryptionToken);
const devices = JSON.parse(decrypted);
```

### דוגמה 3: קריאה למכשיר
```typescript
const action = '/linkgrabberv2/addLinks';
const devicePath = `/t_${session.sessionToken}_${device.id}${action}`;
const signature = createSignature(devicePath, session.deviceEncryptionToken);

// בניית body
const requestBody = {
  url: `${action}?signature=${signature}`,
  params: [{ links: "https://youtube.com/watch?v=xxx" }],
  rid: Date.now(),
  apiVer: 1
};

// הצפנת body
const encryptedBody = encrypt(JSON.stringify(requestBody), session.deviceEncryptionToken);

// שליחה
const response = await fetch(`https://api.jdownloader.org${devicePath}?signature=${signature}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/aesjson-jd; charset=utf-8' },
  body: encryptedBody
});

// פענוח תגובה
const encryptedResponse = await response.text();
const decryptedResponse = decrypt(encryptedResponse, session.deviceEncryptionToken);
const result = JSON.parse(decryptedResponse);
```

---

## ⚠️ בעיות נפוצות וטיפים

### בעיה 1: AUTH_FAILED בהתחברות
**סיבות אפשריות:**
- אימייל לא ב-lowercase
- סיסמה שגויה
- חתימה חושבה על query שגוי

**פתרון:**
```typescript
// וודא lowercase
email = email.toLowerCase();

// וודא שה-query מכיל את כל הפרמטרים בסדר הנכון
const query = `/my/connect?email=${encodeURIComponent(email)}&appkey=myjdapi&rid=${rid}`;
```

### בעיה 2: TOKEN_INVALID בקריאות שרת
**סיבות אפשריות:**
- sessionToken לא נכלל ב-query לפני החתימה
- encryption token לא עודכן נכון

**פתרון:**
```typescript
// וודא שה-sessiontoken נכלל בחתימה
const query = `/my/listdevices?rid=${rid}&sessiontoken=${sessionToken}`;
const signature = createSignature(query, serverEncryptionToken);
```

### בעיה 3: שגיאת פענוח
**סיבות אפשריות:**
- IV/Key בסדר הפוך
- Token לא נכון

**פתרון:**
```typescript
// וודא את הסדר: IV קודם, Key שני
const iv = token.subarray(0, 16);   // NOT subarray(16, 32)
const key = token.subarray(16, 32); // NOT subarray(0, 16)
```

### בעיה 4: חתימה לא תואמת לקריאות מכשיר
**סיבות אפשריות:**
- החתימה צריכה להיות על ה-full device path
- צריך לכלול את החתימה גם ב-body.url

**פתרון:**
```typescript
const devicePath = `/t_${sessionToken}_${deviceId}${action}`;
const signature = createSignature(devicePath, deviceEncryptionToken);

// ה-body.url צריך לכלול את החתימה
const body = {
  url: `${action}?signature=${signature}`,  // חשוב!
  // ...
};
```

---

## 🧪 כלי דיבוג

### הוספת לוגים:
```typescript
console.log('loginSecret (hex):', loginSecret.toString('hex'));
console.log('sessionToken:', sessionToken);
console.log('serverEncToken (hex):', serverEncryptionToken.toString('hex'));
console.log('query for signature:', query);
console.log('signature:', signature);
```

### בדיקת ערכים:
```typescript
// וודא אורכי buffers
console.log('loginSecret length:', loginSecret.length); // צריך להיות 32
console.log('sessionToken length:', sessionToken.length); // צריך להיות 64 (hex)
console.log('sessionTokenBytes length:', sessionTokenBytes.length); // צריך להיות 32
```

---

## 📊 טבלת אורכים צפויים

| ערך | סוג | אורך |
|-----|-----|------|
| loginSecret | Buffer | 32 bytes |
| deviceSecret | Buffer | 32 bytes |
| sessionToken | Hex String | 64 chars |
| sessionTokenBytes | Buffer | 32 bytes |
| serverEncryptionToken | Buffer | 32 bytes |
| deviceEncryptionToken | Buffer | 32 bytes |
| signature | Hex String | 64 chars |
| IV | Buffer | 16 bytes |
| AES Key | Buffer | 16 bytes |

