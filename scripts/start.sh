#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit push || echo "Migration failed, continuing..."

echo "Starting application..."
exec node server.js
