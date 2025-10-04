#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Full-Stack Fraud Detection System${NC}"
echo "=================================================="

# 1. Start Redis
echo -e "\n${YELLOW}1️⃣  Starting Redis...${NC}"
redis-server --daemonize yes
sleep 2
if redis-cli PING > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis started${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

# 2. Start Python Backend
echo -e "\n${YELLOW}2️⃣  Starting Python Backend...${NC}"
cd /workspaces/anthropic-hackathon-proj/python-backend
pkill -9 -f "uvicorn main:app" 2>/dev/null
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/python-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "   Backend PID: $BACKEND_PID"

# Wait for backend
echo -e "   Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo -e "${GREEN}✅ Python Backend started${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
done

# 3. Start Mock API
echo -e "\n${YELLOW}3️⃣  Starting Mock API...${NC}"
cd /workspaces/anthropic-hackathon-proj/go-mock-api
pkill -9 -f "mock-api" 2>/dev/null
if [ ! -f "./mock-api" ]; then
    echo "   Building mock API..."
    go build -o mock-api main.go
fi
nohup ./mock-api > ../logs/mock-api.log 2>&1 &
MOCK_PID=$!
sleep 2
echo -e "${GREEN}✅ Mock API started (PID: $MOCK_PID)${NC}"

# 4. Send test transactions
echo -e "\n${YELLOW}4️⃣  Sending test transactions...${NC}"
cd /workspaces/anthropic-hackathon-proj
./critical_fraud.sh
echo -e "${GREEN}✅ Test transactions sent${NC}"

# 5. Install Next.js dependencies if needed
echo -e "\n${YELLOW}5️⃣  Setting up Next.js Frontend...${NC}"
cd /workspaces/anthropic-hackathon-proj/nextjs-frontend
if [ ! -d "node_modules" ]; then
    echo -e "   Installing dependencies..."
    npm install
fi

# 6. Start Next.js Frontend
echo -e "\n${YELLOW}6️⃣  Starting Next.js Frontend...${NC}"
pkill -9 -f "next dev" 2>/dev/null

echo -e "\n${BLUE}=================================================="
echo -e "✨ All services running!"
echo -e "=================================================="
echo -e "${GREEN}📊 Services:${NC}"
echo -e "   - Redis:          localhost:6379"
echo -e "   - Python Backend: http://localhost:8000"
echo -e "   - Mock API:       http://localhost:8080"
echo -e "   - Next.js UI:     http://localhost:3000"
echo ""
echo -e "${YELLOW}🌐 Starting Next.js Dashboard...${NC}"
echo -e "   Open your browser to: ${GREEN}http://localhost:3000${NC}"
echo -e "   Press Ctrl+C to stop all services"
echo -e "=================================================="
echo ""

# Start Next.js in foreground (so Ctrl+C stops everything)
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev

# Cleanup on exit
echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "uvicorn main:app" 2>/dev/null
pkill -9 -f "mock-api" 2>/dev/null
echo -e "${GREEN}✅ All services stopped${NC}"
