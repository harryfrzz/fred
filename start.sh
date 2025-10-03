#!/bin/bash

# AI-Powered Fraud Detection - Quick Start Script
# This script starts all services locally

set -e

echo "🚀 Starting AI-Powered Fraud Detection System"
echo "=============================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi
echo "✅ Python 3 found"

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go is required but not installed."
    exit 1
fi
echo "✅ Go found"

# Check Redis
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis not found. Please install Redis or use Docker."
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    exit 1
fi
echo "✅ Redis found"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your HuggingFace API key"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "🔧 Setting up services..."
echo ""

# Start Redis in background
echo "1️⃣  Starting Redis..."
# Check if running in a container (no systemd)
if ! pidof systemd > /dev/null 2>&1; then
    # Dev container or Docker - use service command
    sudo service redis-server start > /dev/null 2>&1 || redis-server --daemonize yes
else
    # Native Linux with systemd
    redis-server --daemonize yes
fi
sleep 2
echo "✅ Redis started"

# Setup Python backend
echo ""
echo "2️⃣  Setting up Python ML Backend..."
cd python-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "   Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Start Python backend in background
echo "   Starting Python backend..."
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/python-backend.log 2>&1 &
PYTHON_PID=$!
echo "✅ Python backend started (PID: $PYTHON_PID)"

cd ..

# Setup Go mock API
echo ""
echo "3️⃣  Setting up Go Mock Transaction Generator..."
cd go-mock-api

# Download Go dependencies
echo "   Downloading Go dependencies..."
go mod download

# Build
echo "   Building mock API..."
go build -o mock-api

# Start in background
echo "   Starting mock API..."
nohup ./mock-api > ../logs/mock-api.log 2>&1 &
MOCK_PID=$!
echo "✅ Mock API started (PID: $MOCK_PID)"

cd ..

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Transaction generation disabled - run manually with:
# ./critical_fraud.sh or ./quick_fraud.sh or ./simulate_fraud.sh
echo ""
echo "💡 Transaction generation is DISABLED by default"
echo "   To generate transactions, run:"
echo "   • ./critical_fraud.sh    (fraud matching model training)"
echo "   • ./quick_fraud.sh       (quick test transactions)"
echo "   • ./simulate_fraud.sh    (large volume simulation)"
echo ""

# Setup and run Go frontend
echo ""
echo "5️⃣  Starting Beautiful TUI Dashboard..."
cd go-frontend

# Download Go dependencies if needed
if [ ! -f "go-frontend" ]; then
    echo "   Downloading Go dependencies..."
    go mod download
    
    # Build
    echo "   Building frontend..."
    go build -o go-frontend .
fi

echo ""
echo "=============================================="
echo "✨ All services are running!"
echo ""
echo "📊 Services:"
echo "   - Redis:          localhost:6379"
echo "   - Python Backend: http://localhost:8000"
echo "   - Mock API:       http://localhost:8080"
echo ""
echo "📝 Logs are in ./logs/"
echo ""
echo "🎯 Starting TUI Dashboard..."
echo "   (Press 'q' to quit the dashboard)"
echo "=============================================="
echo ""

# Run the frontend (this will block)
./go-frontend

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill Python backend
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null || true
    fi
    
    # Kill Mock API
    if [ ! -z "$MOCK_PID" ]; then
        kill $MOCK_PID 2>/dev/null || true
    fi
    
    # Stop Redis
    redis-cli shutdown 2>/dev/null || true
    
    echo "✅ All services stopped"
}

# Register cleanup on exit
trap cleanup EXIT
