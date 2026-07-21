#!/bin/bash
set -e

SERVER_USER="ubuntu"
SERVER_HOST="124.222.88.69"
REMOTE_DIR="/home/ubuntu/travel"
PROJECT_NAME="travel"

echo "=== Travel App Deployment ==="
echo ""

echo "[1/5] Building Docker image locally..."
docker build -t ${PROJECT_NAME}:latest .

echo ""
echo "[2/5] Saving Docker image..."
docker save ${PROJECT_NAME}:latest | gzip > /tmp/${PROJECT_NAME}.tar.gz
echo "Image saved: $(du -h /tmp/${PROJECT_NAME}.tar.gz | cut -f1)"

echo ""
echo "[3/5] Uploading to server..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}"
scp /tmp/${PROJECT_NAME}.tar.gz ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/
scp docker-compose.yml ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/
scp .env.production ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/.env
scp nginx/travel.conf ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/

echo ""
echo "[4/5] Loading image and starting services on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'REMOTE_SCRIPT'
cd /home/ubuntu/travel

echo "Loading Docker image..."
docker load < travel.tar.gz

echo "Stopping old containers..."
docker compose down 2>/dev/null || true

echo "Starting services..."
docker compose up -d

echo "Setting up nginx config..."
sudo cp travel.conf /etc/nginx/sites-available/travel
sudo ln -sf /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/travel
sudo nginx -t && sudo systemctl reload nginx

echo "Waiting for health check..."
sleep 10
for i in $(seq 1 12); do
    if curl -sf http://127.0.0.1:3002/api/health > /dev/null 2>&1; then
        echo "Health check passed!"
        break
    fi
    if [ "$i" -eq 12 ]; then
        echo "Health check failed after 60s"
        docker compose logs --tail=50 app
        exit 1
    fi
    sleep 5
done

rm -f travel.tar.gz
REMOTE_SCRIPT

rm -f /tmp/${PROJECT_NAME}.tar.gz

echo ""
echo "[5/5] Verifying deployment..."
echo ""
echo "=== Deployment Complete ==="
echo "Site: https://zilky7777.cn"
echo "Health: https://zilky7777.cn/api/health"
