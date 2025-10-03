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
redis-cli shutdown 2>/dev/null || true

echo "✅ All services stopped"
