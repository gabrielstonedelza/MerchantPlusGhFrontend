#!/bin/bash
# Start the Merchant+ frontend (Next.js dev server)
# Safely kills any existing process on port 3000 before starting.

set -e

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3000

echo "==> Checking port $PORT..."
PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "==> Killing existing process(es) on port $PORT: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "==> Starting Next.js dev server on port $PORT..."
cd "$FRONTEND_DIR"
exec npm run dev
