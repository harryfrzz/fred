#!/bin/bash

# Stop all fraud detection services

echo "🛑 Stopping AI-Powered Fraud Detection System..."

# Stop Python backend
echo "Stopping Python backend..."
pkill -f "uvicorn main:app" || true

# Stop Mock API
echo "Stopping Mock API..."
pkill -f "mock-api" || true

# Stop Frontend
echo "Stopping Frontend..."
pkill -f "go-frontend" || true

# Stop Redis
echo "Stopping Redis..."
if ! pidof systemd > /dev/null 2>&1; then
    # Dev container or Docker - use service command
    sudo service redis-server stop > /dev/null 2>&1 || redis-cli shutdown 2>/dev/null || true
else
    # Native Linux with systemd or other platforms
    redis-cli shutdown 2>/dev/null || true
fi

echo "✅ All services stopped"
