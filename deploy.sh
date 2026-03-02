#!/bin/bash

set -e

# Настройте под ваш сервер (или задайте через env: DEPLOY_SSH, DEPLOY_FRONT_DIR)
DEPLOY_SSH="${DEPLOY_SSH:-root@vm-b4e2c1b6.na4u.ru}"
DEPLOY_FRONT_DIR="${DEPLOY_FRONT_DIR:-/var/www/tabinvestproject.ru/frontend}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🏗 Building frontend..."
cd "$SCRIPT_DIR"
npm run build:frontend

echo "📂 Deploying frontend to server..."
rsync -avz --delete --exclude='uploads/' "$SCRIPT_DIR/frontend/dist/" "$DEPLOY_SSH:$DEPLOY_FRONT_DIR/"

echo "🚀 Running server deploy (backend)..."
ssh "$DEPLOY_SSH" "cd /root/gitserver-app && bash deploy-server.sh"

echo "✅ Deploy complete"
