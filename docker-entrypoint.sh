#!/bin/sh
set -e

# Create data directory for SQLite
mkdir -p /data

# Start FastAPI server in the background
echo "🐍 Starting FastAPI WebSocket server on port 8000..."
uvicorn main:create_app --factory --host 0.0.0.0 --port 8000 --log-level info &

# Give the FastAPI server a moment to initialise
sleep 2

# Start nginx in the foreground (keeps the container alive)
echo "🌐 Starting nginx on port 80..."
nginx -g "daemon off;"
