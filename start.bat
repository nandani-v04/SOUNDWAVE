@echo off
REM ============================================
REM SoundWave - Quick Start (Windows)
REM Double-click this file to start the server
REM ============================================

echo.
echo ========================================
echo    SOUNDWAVE - Starting Server...
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed!
  echo Download from: https://nodejs.org
  pause
  exit /b
)

REM Go to backend directory
cd /d "%~dp0backend"

REM Install dependencies if needed
IF NOT EXIST "node_modules" (
  echo Installing dependencies...
  npm install
)

REM Copy .env if it doesn't exist
IF NOT EXIST ".env" (
  echo Creating .env file...
  copy .env.example .env
  echo IMPORTANT: Edit backend\.env with your settings!
  echo.
)

REM Create upload directories
mkdir "..\uploads\songs" 2>nul
mkdir "..\uploads\thumbnails" 2>nul
mkdir "..\uploads\profiles" 2>nul

echo Starting SoundWave server on http://localhost:5000
echo.
echo Open frontend\index.html in your browser to use the app!
echo.

npm run dev

pause
