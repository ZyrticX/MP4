# AviMP4 - Video Downloader Service

A video/audio download service that uses JDownloader to download content from YouTube, Facebook, Vimeo, TikTok, and 1000+ other sites.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Web Browser   │────▶│   Express API   │────▶│  MyJDownloader   │
│   (Frontend)    │     │   (Backend)     │     │   Cloud API      │
└─────────────────┘     └─────────────────┘     └──────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────┐          ┌─────────────┐
                        │  Supabase   │          │ JDownloader │
                        │  Database   │          │   Client    │
                        └─────────────┘          └─────────────┘
```

## Prerequisites

1. **JDownloader 2** installed and running on your machine
2. **MyJDownloader account** - Register at [my.jdownloader.org](https://my.jdownloader.org)
3. **Node.js 18+** installed
4. **Supabase project** (database already configured)

## Setup

### 1. Configure JDownloader

1. Open JDownloader 2
2. Go to **Settings** → **My.JDownloader**
3. Enter your MyJDownloader email and password
4. Connect and verify the status shows "Connected"
5. Note your **Device Name** (shown in the settings)

### 2. Install Dependencies

```bash
cd AviMP4
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# MyJDownloader Credentials
MYJD_EMAIL=your-email@example.com
MYJD_PASSWORD=your-myjdownloader-password
MYJD_DEVICE_NAME=your-jdownloader-device-name

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=development

# Download Configuration
DOWNLOAD_PATH=C:/Downloads/AviMP4
```

### 4. Run the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 5. Open the Frontend

Open `frontend/index.html` in your browser, or serve it with a static file server:

```bash
# Using npx serve
npx serve frontend
```

## API Endpoints

### Submit Download

```http
POST /api/downloads
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "mediaType": "video",       // "video" | "audio" | "both"
  "preferredQuality": "1080p" // "2160p" | "1080p" | "720p" | "480p" | "360p"
}
```

### Get Download Status

```http
GET /api/downloads/:jobId
```

### Get User Downloads

```http
GET /api/downloads/user/:userId?limit=20
```

### Cancel Download

```http
POST /api/downloads/:jobId/cancel
```

### Retry Failed Download

```http
POST /api/downloads/:jobId/retry
```

## Supported Platforms

The service supports 1000+ sites through JDownloader, including:

- **YouTube** - Videos, playlists, channels
- **Facebook** - Videos, reels
- **Vimeo** - Videos
- **TikTok** - Videos
- **Instagram** - Posts, reels, stories
- **Twitter/X** - Videos
- **Twitch** - VODs, clips
- **Dailymotion** - Videos
- And many more...

## Database Schema

The `download_jobs` table tracks all download requests:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who submitted (optional) |
| source_url | TEXT | Original video URL |
| source_platform | TEXT | Detected platform (youtube, facebook, etc.) |
| media_type | ENUM | video, audio, or both |
| preferred_quality | TEXT | Requested quality |
| status | ENUM | pending, crawling, ready, downloading, completed, failed, cancelled |
| progress | INT | 0-100 percentage |
| speed_bps | BIGINT | Current download speed |
| file_name | TEXT | Downloaded file name |
| file_size | BIGINT | File size in bytes |
| file_path | TEXT | Local path to downloaded file |
| title | TEXT | Video title |
| created_at | TIMESTAMP | When job was created |
| completed_at | TIMESTAMP | When download finished |

## Integration with Courses

To automatically add downloaded videos to your courses, include these optional fields:

```json
{
  "url": "https://youtube.com/...",
  "targetCourseId": "course-uuid",
  "targetChapterId": "chapter-uuid"
}
```

## Security Considerations

1. **Row Level Security (RLS)** is enabled - users can only see their own downloads
2. **Admin users** can see and manage all downloads
3. **Service role key** is used for backend operations only
4. **CORS** is configured - update `CORS_ORIGIN` for production

## Troubleshooting

### "No JDownloader devices found"

- Make sure JDownloader is running
- Check that MyJDownloader shows "Connected" in JDownloader settings
- Verify your device name matches `MYJD_DEVICE_NAME`

### "Connection failed: AUTH_FAILED"

- Check your MyJDownloader email and password
- Email must be lowercase in the config

### Downloads stuck on "crawling"

- Some sites may take longer to process
- Check if JDownloader shows any captchas or errors
- The URL might not be supported

### "Link crawling timed out"

- The URL might be invalid or not supported
- JDownloader might be overloaded
- Try increasing the timeout in `download-service.ts`

## License

MIT




