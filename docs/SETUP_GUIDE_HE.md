# 📖 מדריך הגדרה מלא - מערכת הורדת סרטונים עם JDownloader

## 📋 תוכן עניינים

1. [דרישות מקדימות](#-דרישות-מקדימות)
2. [שלב 1: התקנת JDownloader](#-שלב-1-התקנת-jdownloader)
3. [שלב 2: הגדרת MyJDownloader](#-שלב-2-הגדרת-myjdownloader)
4. [שלב 3: הגדרת השרת](#-שלב-3-הגדרת-השרת)
5. [שלב 4: שילוב בפרונטאנד](#-שלב-4-שילוב-בפרונטאנד)
6. [שלב 5: הרצה ובדיקה](#-שלב-5-הרצה-ובדיקה)
7. [פתרון בעיות](#-פתרון-בעיות)

---

## 📦 דרישות מקדימות

### תוכנות נדרשות:
- ✅ **Node.js 18+** - [להורדה](https://nodejs.org/)
- ✅ **JDownloader 2** - [להורדה](https://jdownloader.org/jdownloader2)
- ✅ **חשבון MyJDownloader** - [הרשמה](https://my.jdownloader.org/login.html#register)

### בדיקה שהכל מותקן:
```powershell
# בדוק גרסת Node.js
node --version
# צריך להציג v18.0.0 או יותר

# בדוק npm
npm --version
```

---

## 🖥️ שלב 1: התקנת JDownloader

### 1.1 הורדה והתקנה

1. היכנס ל-[jdownloader.org/jdownloader2](https://jdownloader.org/jdownloader2)
2. הורד את הגרסה ל-Windows
3. הפעל את ההתקנה ועקוב אחרי ההוראות

### 1.2 הפעלה ראשונה

לאחר ההתקנה, JDownloader יפתח אוטומטית. תן לו להשלים את העדכון הראשוני.

---

## 🔐 שלב 2: הגדרת MyJDownloader

### 2.1 יצירת חשבון

1. היכנס ל-[my.jdownloader.org](https://my.jdownloader.org/login.html#register)
2. לחץ על **Register**
3. מלא את הפרטים:
   - **Email**: האימייל שלך
   - **Password**: סיסמה חזקה (שמור אותה!)
4. אשר את האימייל שתקבל

### 2.2 חיבור JDownloader לחשבון

1. פתח את **JDownloader 2**
2. עבור ל: **Settings** → **My.JDownloader**
3. הזן את פרטי החשבון:
   - **Email**: האימייל שנרשמת איתו
   - **Password**: הסיסמה
4. לחץ **Connect**
5. המתן עד שהסטטוס יהיה **✅ Connected**

### 2.3 שמירת שם המכשיר

**חשוב!** שים לב לשם המכשיר (Device Name) - תצטרך אותו בהמשך.

```
📍 מיקום: Settings → My.JDownloader → Device Name
📝 דוגמה: "DESKTOP-ABC123@jd2"
```

---

## ⚙️ שלב 3: הגדרת השרת

### 3.1 התקנת Dependencies

פתח PowerShell בתיקיית הפרויקט והרץ:

```powershell
cd C:\Users\Evgen\Desktop\AviMP4
npm install
```

### 3.2 יצירת קובץ הגדרות

צור קובץ `.env` בתיקייה הראשית:

```powershell
# צור את הקובץ
New-Item -Path ".env" -ItemType File
```

פתח את הקובץ והוסף את ההגדרות:

```env
# ═══════════════════════════════════════════════════════
# הגדרות MyJDownloader (חובה!)
# ═══════════════════════════════════════════════════════
MYJD_EMAIL=האימייל_שלך@example.com
MYJD_PASSWORD=הסיסמה_שלך
MYJD_DEVICE_NAME=שם_המכשיר_מ_JDownloader

# ═══════════════════════════════════════════════════════
# הגדרות Supabase (מהפרויקט שלך)
# ═══════════════════════════════════════════════════════
SUPABASE_URL=https://zhlrqnbfqcuqmnuqusyq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobHJxbmJmcWN1cW1udXF1c3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjI3OTEsImV4cCI6MjA3NzgzODc5MX0.cXmeFNhnI6BqumGa512P53DHMn-5tTQkA6rsWg6K7fw

# Service Role Key - קח מ: Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=המפתח_הסודי_שלך

# ═══════════════════════════════════════════════════════
# הגדרות שרת
# ═══════════════════════════════════════════════════════
PORT=3001
NODE_ENV=development

# ═══════════════════════════════════════════════════════
# תיקיית הורדות
# ═══════════════════════════════════════════════════════
DOWNLOAD_PATH=C:/Downloads/AviMP4
```

### 3.3 מציאת Service Role Key

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. עבור ל: **Settings** → **API**
4. תחת **Project API keys** העתק את **service_role (secret)**

⚠️ **אזהרה**: המפתח הזה סודי! אל תשתף אותו בקוד פומבי.

---

## 🎨 שלב 4: שילוב בפרונטאנד

### 4.1 הוספת קומפוננטת הורדה

צור קובץ חדש בפרויקט React שלך:

**מיקום**: `src/components/VideoDownloader.tsx`

העתק את הקומפוננטה מ: `frontend/components/VideoDownloader.tsx`

### 4.2 שילוב בדף הראשי

הוסף את הקומפוננטה לדף שלך:

```tsx
// src/pages/Index.tsx או כל דף אחר
import { VideoDownloader } from '@/components/VideoDownloader';

function DownloadPage() {
  const handleDownloadComplete = (job) => {
    console.log('הורדה הושלמה!', job);
    // כאן תוכל לעדכן את הוידאו ב-database
  };

  const handleError = (error) => {
    toast.error(error); // הצג הודעת שגיאה
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">הורדת סרטונים</h1>
      
      <VideoDownloader
        userId={currentUser?.id}
        onDownloadComplete={handleDownloadComplete}
        onError={handleError}
      />
    </div>
  );
}
```

### 4.3 הגדרת משתנה סביבה בפרונטאנד

הוסף לקובץ `.env` של הפרונטאנד:

```env
VITE_DOWNLOAD_API_URL=http://localhost:3001/api
```

---

## 🚀 שלב 5: הרצה ובדיקה

### 5.1 וודא ש-JDownloader פועל

1. פתח את **JDownloader 2**
2. בדוק שהסטטוס **Connected** ב-Settings → My.JDownloader

### 5.2 הפעל את השרת

```powershell
cd C:\Users\Evgen\Desktop\AviMP4
npm run dev
```

צריך לראות:
```
🔄 Connecting to JDownloader...
✅ Connected to JDownloader: DESKTOP-ABC123@jd2
🚀 Server running on http://localhost:3001
📡 API endpoint: http://localhost:3001/api/downloads
```

### 5.3 בדיקה ידנית

פתח את הקובץ `frontend/index.html` בדפדפן, או השתמש ב-cURL:

```powershell
# בדיקת חיבור
curl http://localhost:3001/health

# שליחת הורדה
curl -X POST http://localhost:3001/api/downloads `
  -H "Content-Type: application/json" `
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "mediaType": "video", "preferredQuality": "720p"}'
```

---

## 🔧 פתרון בעיות

### בעיה: "No JDownloader devices found"

**פתרון:**
1. וודא ש-JDownloader פועל
2. בדוק את החיבור ב: Settings → My.JDownloader
3. אם הסטטוס "Disconnected" - לחץ Connect מחדש
4. המתן כ-30 שניות ונסה שוב

### בעיה: "Connection failed: AUTH_FAILED"

**פתרון:**
1. בדוק שהאימייל כתוב **באותיות קטנות** בקובץ `.env`
2. וודא שהסיסמה נכונה
3. נסה להתחבר ידנית ב-my.jdownloader.org

### בעיה: "Link crawling timed out"

**פתרון:**
1. הקישור לא נתמך או לא תקין
2. JDownloader עמוס - נסה שוב
3. בדוק אם יש Captcha ב-JDownloader

### בעיה: הורדה תקועה על "crawling"

**פתרון:**
1. פתח את JDownloader ובדוק את ה-LinkGrabber
2. יכול להיות שצריך לפתור Captcha
3. נסה קישור אחר לבדיקה

### בעיה: שגיאת CORS בפרונטאנד

**פתרון:**
עדכן את `CORS_ORIGIN` בקובץ `.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

---

## 📊 מעקב אחרי הורדות

ניתן לראות את כל ההורדות בטבלה `download_jobs` ב-Supabase:

```sql
-- הצגת הורדות אחרונות
SELECT 
  id,
  source_platform,
  title,
  status,
  progress,
  file_size,
  created_at
FROM download_jobs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔒 אבטחה

### המלצות לפרודקשן:

1. **הגדר CORS ספציפי:**
   ```env
   CORS_ORIGIN=https://your-domain.com
   ```

2. **השתמש ב-HTTPS** - חובה בפרודקשן

3. **הגבל גישה** - הוסף אימות למסלולי ה-API

4. **אל תחשוף את Service Role Key** - שמור אותו רק בצד שרת

---

## 🎯 שלבים הבאים

לאחר שהמערכת עובדת, ניתן להוסיף:

- [ ] העלאה אוטומטית ל-Supabase Storage
- [ ] שילוב עם טבלת `uploaded_files` הקיימת
- [ ] Webhook להודעות בסיום הורדה
- [ ] תור הורדות מרובות

---

## 📞 עזרה נוספת

אם נתקלת בבעיות:
1. בדוק את הלוגים של השרת
2. בדוק את ה-Console של JDownloader
3. וודא שכל הפרטים בקובץ `.env` נכונים


