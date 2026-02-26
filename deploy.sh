#!/bin/bash

set -e

APP_DIR="/root/gitserver-app"
FRONT_BUILD_DIR="/var/www/tabinvestproject.ru/frontend"

echo "📥 Updating repository..."
cd $APP_DIR
git pull origin main

echo "📦 Installing dependencies..."
npm install --workspaces

echo "🏗 Building frontend..."
cd $APP_DIR/frontend
npm run build

echo "📂 Deploying frontend..."
rm -rf $FRONT_BUILD_DIR/*
cp -r dist/* $FRONT_BUILD_DIR/

echo "♻ Restarting backend..."
pm2 restart render-start

echo "✅ Deploy complete"
