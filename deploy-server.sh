#!/bin/bash

set -e

APP_DIR="/root/gitserver-app"
# Frontend статика: /var/www/tabinvestproject.ru/frontend (копируется локальным deploy.sh)

echo "📥 Updating repository..."
cd "$APP_DIR"
git pull origin main

echo "🐳 Building and starting app container..."
docker compose build --no-cache app
docker compose up -d app

echo "✅ Server deploy complete"
