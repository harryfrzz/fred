#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Fraud Detection System${NC}"
echo "========================================"

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

# Wait for backend to be ready
echo -e "   Waiting for backend to be healthy..."
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

# 5. Check stats
echo -e "\n${YELLOW}📊 Current Statistics:${NC}"
sleep 2
curl -s http://localhost:8000/stats | jq '{total: .total_transactions, fraud: .fraud_detected, avg_risk: .avg_risk_score}'

echo -e "\n${BLUE}========================================"
echo -e "✨ Backend services running!"
echo -e "========================================"
echo -e "${GREEN}📊 Services:${NC}"
echo -e "   - Redis:          localhost:6379"
echo -e "   - Python Backend: http://localhost:8000"
echo -e "   - Mock API:       http://localhost:8080"
echo ""
echo -e "${YELLOW}💡 To start the Next.js frontend:${NC}"
echo -e "   Run: ${GREEN}./run-fullstack.sh${NC}"
echo -e "   Or manually: ${GREEN}cd nextjs-frontend && npm run dev${NC}"
echo ""
echo -e "${GREEN}✅ System ready!${NC}"
echo -e "========================================"
