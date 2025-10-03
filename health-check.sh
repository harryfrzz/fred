#!/bin/bash

# Comprehensive health check script for the fraud detection system

echo "🏥 Fraud Detection System Health Check"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 is installed"
        return 0
    else
        echo "❌ $1 is NOT installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check service
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ $name is running ($url)"
        return 0
    else
        echo "❌ $name is NOT responding ($url)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo "✅ Port $port is in use ($name)"
        return 0
    else
        echo "⚠️  Port $port is free ($name not running?)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "1️⃣  Checking Prerequisites..."
echo "----------------------------"
check_command python3
check_command go
check_command redis-server
check_command redis-cli
check_command curl
check_command jq
echo ""

echo "2️⃣  Checking Configuration..."
echo "----------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found (using defaults)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f ".env" ] && grep -q "HUGGINGFACE_API_KEY=your_huggingface_api_key_here" .env; then
    echo "⚠️  HuggingFace API key not configured (AI explanations will use fallback)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "3️⃣  Checking Redis..."
echo "----------------------------"
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running and responding"
else
    echo "❌ Redis is not running"
    echo "   Try: redis-server --daemonize yes"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "4️⃣  Checking Ports..."
echo "----------------------------"
check_port 6379 "Redis"
check_port 8000 "Python Backend"
check_port 8080 "Mock API"
echo ""

echo "5️⃣  Checking Services..."
echo "----------------------------"
check_service "http://localhost:8000/health" "Python Backend"
check_service "http://localhost:8080/health" "Mock API"
echo ""

echo "6️⃣  Checking Python Dependencies..."
echo "----------------------------"
if [ -d "python-backend/venv" ]; then
    echo "✅ Python virtual environment exists"
    
    source python-backend/venv/bin/activate 2>/dev/null
    if python -c "import fastapi, xgboost, lightgbm, torch" 2>/dev/null; then
        echo "✅ Python packages are installed"
    else
        echo "⚠️  Some Python packages may be missing"
        WARNINGS=$((WARNINGS + 1))
    fi
    deactivate 2>/dev/null
else
    echo "⚠️  Python virtual environment not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "7️⃣  Checking Go Dependencies..."
echo "----------------------------"
if [ -f "go-mock-api/go.mod" ]; then
    echo "✅ go-mock-api/go.mod exists"
else
    echo "⚠️  go-mock-api/go.mod not found"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "go-frontend/go.mod" ]; then
    echo "✅ go-frontend/go.mod exists"
else
    echo "⚠️  go-frontend/go.mod not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "8️⃣  Checking Logs..."
echo "----------------------------"
if [ -d "logs" ]; then
    echo "✅ Logs directory exists"
    
    if [ -f "logs/python-backend.log" ]; then
        echo "✅ Python backend log exists"
        last_error=$(grep -i error logs/python-backend.log | tail -1)
        if [ ! -z "$last_error" ]; then
            echo "⚠️  Recent error in Python backend: $last_error"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    if [ -f "logs/mock-api.log" ]; then
        echo "✅ Mock API log exists"
    fi
else
    echo "⚠️  Logs directory not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "9️⃣  Testing API Endpoints..."
echo "----------------------------"
if curl -s http://localhost:8000/stats > /dev/null 2>&1; then
    stats=$(curl -s http://localhost:8000/stats)
    echo "✅ Python backend /stats endpoint working"
    echo "   $(echo $stats | jq -r '. | "Total Txns: \(.total_transactions), Fraud: \(.fraud_detected)"')"
else
    echo "⚠️  Cannot fetch stats from Python backend"
    WARNINGS=$((WARNINGS + 1))
fi

if curl -s http://localhost:8080/stats > /dev/null 2>&1; then
    echo "✅ Mock API /stats endpoint working"
else
    echo "⚠️  Cannot fetch stats from Mock API"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "🔟 Checking System Resources..."
echo "----------------------------"
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version)
    echo "✅ Python version: $python_version"
fi

if command -v go &> /dev/null; then
    go_version=$(go version)
    echo "✅ Go version: $go_version"
fi

# Check disk space
available_space=$(df -h . | awk 'NR==2 {print $4}')
echo "✅ Available disk space: $available_space"

# Check memory
if command -v free &> /dev/null; then
    available_mem=$(free -h | awk 'NR==2 {print $7}')
    echo "✅ Available memory: $available_mem"
fi
echo ""

echo "======================================"
echo "📊 Health Check Summary"
echo "======================================"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! System is healthy."
    echo ""
    echo "Ready to run:"
    echo "  ./start.sh   - Start all services"
    echo "  ./demo.sh    - Run demo scenarios"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  System is functional but has $WARNINGS warning(s)."
    echo ""
    echo "You can still run the system, but consider addressing warnings."
    exit 0
else
    echo "❌ System has $ERRORS error(s) that need to be fixed."
    echo ""
    echo "Common fixes:"
    echo "  - Install missing prerequisites"
    echo "  - Start Redis: redis-server --daemonize yes"
    echo "  - Install Python deps: cd python-backend && pip install -r requirements.txt"
    echo "  - Run setup: ./start.sh"
    exit 1
fi
