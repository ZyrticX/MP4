# ═══════════════════════════════════════════════════════════════════
# AviMP4 Downloader - Setup Script (PowerShell)
# סקריפט התקנה אוטומטי
# ═══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "       AviMP4 - Video Downloader Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green

# Check npm
Write-Host ""
Write-Host "[2/4] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "[3/4] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Check/Create .env file
Write-Host ""
Write-Host "[4/4] Checking configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env"
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "   IMPORTANT: You need to edit the .env file!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Open .env and fill in:" -ForegroundColor Yellow
    Write-Host "  - MYJD_EMAIL: Your MyJDownloader email" -ForegroundColor White
    Write-Host "  - MYJD_PASSWORD: Your MyJDownloader password" -ForegroundColor White
    Write-Host "  - MYJD_DEVICE_NAME: Your JDownloader device name" -ForegroundColor White
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY: From Supabase Dashboard" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure JDownloader 2 is running and connected" -ForegroundColor White
Write-Host "  2. Edit .env file with your credentials" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "The server will start at: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""




