# Installation Guide

## Prerequisites

### macOS
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.11
brew install go
brew install redis

# Start Redis
brew services start redis
```

### Ubuntu/Debian
```bash
# Update packages
sudo apt-get update

# Install Python 3.11
sudo apt-get install python3.11 python3.11-venv python3-pip

# Install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Redis
sudo apt-get install redis-server
sudo systemctl start redis
```

## Quick Start

1. **Clone and setup**
```bash
cd anthropic-hackathon-proj

# Copy environment template
cp .env.example .env

# Edit .env and add your HuggingFace API key (optional but recommended)
nano .env
```

2. **Run with Docker (Easiest)**
```bash
docker-compose up
```

3. **Run Manually**
```bash
# This will start all services and open the TUI dashboard
./start.sh
```

## Manual Setup (Development)

### 1. Start Redis
```bash
redis-server --daemonize yes
```

### 2. Setup Python Backend
```bash
cd python-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload
```

### 3. Setup Mock Transaction Generator
```bash
cd go-mock-api

# Download dependencies
go mod download

# Run the service
go run main.go
```

### 4. Start Transaction Generation
```bash
# Trigger continuous generation
curl -X POST http://localhost:8080/start-generation
```

### 5. Run TUI Dashboard
```bash
cd go-frontend

# Download dependencies
go mod download

# Run the dashboard
go run main.go charts.go
```

## Running Demo Scenarios

After starting all services, run the demo script:

```bash
./demo.sh
```

This will generate various fraud scenarios to showcase the system.

## Development Commands

### Individual Services
```bash
# Start Redis only
./dev.sh redis

# Start Python backend only (with hot reload)
./dev.sh python

# Start Mock API only
./dev.sh mock

# Start Frontend only
./dev.sh frontend

# Test all services
./dev.sh test
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
redis-server --daemonize yes
```

### Python Backend Issues
```bash
# Check logs
tail -f logs/python-backend.log

# Verify endpoint
curl http://localhost:8000/health
```

### Go Services Issues
```bash
# Re-download dependencies
cd go-mock-api && go mod download
cd ../go-frontend && go mod download

# Check logs
tail -f logs/mock-api.log
```

### Port Already in Use
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

## Configuration

Edit `.env` file to customize:

```env
# HuggingFace API Key (for AI reasoning)
HUGGINGFACE_API_KEY=your_key_here

# Redis URL
REDIS_URL=redis://localhost:6379

# Service URLs
PYTHON_API_URL=http://localhost:8000
MOCK_API_URL=http://localhost:8080

# ML Model Configuration
MODEL_TYPE=xgboost  # Options: xgboost, lightgbm, pytorch
FRAUD_THRESHOLD=0.7

# Transaction Generation
TRANSACTION_RATE=10  # Transactions per second
FRAUD_RATE=0.15      # 15% fraud rate
```

## Testing

### Test Python API
```bash
# Health check
curl http://localhost:8000/health

# Get stats
curl http://localhost:8000/stats

# Test prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-123",
    "user_id": "user_001",
    "amount": 1500.0,
    "currency": "USD",
    "transaction_type": "payment",
    "timestamp": "2025-10-03T12:00:00Z"
  }'
```

### Test Mock API
```bash
# Health check
curl http://localhost:8080/health

# Generate single transaction
curl -X POST http://localhost:8080/transaction

# Generate batch
curl -X POST http://localhost:8080/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'

# Get stats
curl http://localhost:8080/stats
```

## Stopping Services

```bash
# Stop all services
./stop.sh

# Or manually
pkill -f uvicorn
pkill -f mock-api
redis-cli shutdown
```
