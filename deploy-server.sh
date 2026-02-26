#!/bin/bash

set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

APP_DIR="/root/gitserver-app"
# Frontend статика: /var/www/tabinvestproject.ru/frontend (копируется локальным deploy.sh)

echo "📥 Updating repository..."
cd "$APP_DIR"
git pull origin main

echo "📦 Installing backend dependencies only..."
cd "$APP_DIR/backend"
npm ci --omit=dev

echo "♻ Restarting backend..."
pm2 restart render-start

echo "✅ Server deploy complete"
