#!/bin/bash
# ============================================
# SoundWave - Quick Start Script
# Run this script to set up and start the app
# Usage: bash start.sh
# ============================================

echo "🎵 ================================"
echo "   SOUNDWAVE - Quick Start"
echo "🎵 ================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed!"
  echo "👉 Download it from: https://nodejs.org"
  exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if MongoDB is running
if ! mongosh --eval "db.runCommand({ ping: 1 })" &>/dev/null; then
  echo "⚠️  MongoDB might not be running."
  echo "👉 Start MongoDB:"
  echo "   Windows: Services → Start MongoDB"
  echo "   Mac: brew services start mongodb-community"
  echo "   Linux: sudo systemctl start mongod"
  echo ""
fi

# Go to backend directory
cd "$(dirname "$0")/backend"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from example..."
  cp .env.example .env
  echo "⚠️  Please edit backend/.env with your settings!"
fi

# Create upload directories
mkdir -p ../uploads/songs ../uploads/thumbnails ../uploads/profiles
echo "📁 Upload directories ready"

echo ""
echo "🚀 Starting SoundWave backend..."
echo "   Server: http://localhost:5000"
echo "   Frontend: Open frontend/index.html in browser"
echo ""

npm run dev
