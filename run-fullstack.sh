#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Fraud Detection System - Full Stack Startup Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$MOCK_API_PID" ]; then
        kill $MOCK_API_PID 2>/dev/null || true
    fi
    
    # NOTE: We keep PostgreSQL and pgAdmin running in the background
    # Use ./stop.sh to stop all services including Docker containers
    
    echo -e "${GREEN}✅ All services stopped (PostgreSQL still running)${NC}"
    echo -e "${CYAN}ℹ️  To stop PostgreSQL: docker-compose down${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT SIGTERM

# Cleanup any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -9 -f "python main.py" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "mock-api" 2>/dev/null || true
sleep 1

# Step 1: Start PostgreSQL and pgAdmin
echo -e "${BLUE}📦 Step 1/5: Starting PostgreSQL and pgAdmin...${NC}"
docker-compose up -d postgres pgadmin 2>/dev/null || docker-compose up -d postgres pgadmin

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker exec fraud_detection_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

echo ""

# Step 2: Ensure Redis is running
echo -e "${BLUE}📦 Step 2/5: Checking Redis...${NC}"
if redis-cli PING > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is already running${NC}"
else
    echo -e "${YELLOW}Starting Redis...${NC}"
    redis-server --daemonize yes
    sleep 2
    if redis-cli PING > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis started${NC}"
    else
        echo -e "${RED}❌ Redis failed to start${NC}"
        exit 1
    fi
fi

echo ""

# Step 3: Install Python dependencies if needed
echo -e "${BLUE}📦 Step 3/5: Checking Python dependencies...${NC}"
cd /workspaces/anthropic-hackathon-proj/python-backend
if ! python -c "import sqlalchemy" 2>/dev/null; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -q -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Step 4: Start Backend (Python FastAPI)
echo -e "${BLUE}🐍 Step 4/5: Starting Backend (FastAPI)...${NC}"
cd /workspaces/anthropic-hackathon-proj/python-backend
pkill -9 -f "python main.py" 2>/dev/null || true
pkill -9 -f "uvicorn main:app" 2>/dev/null || true
python main.py > ../logs/python-backend-fullstack.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..20}; do
    if curl -s http://localhost:8000/stats > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running on http://localhost:8000${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs/python-backend-fullstack.log${NC}"
        tail -20 ../logs/python-backend-fullstack.log
        cleanup
    fi
    sleep 1
done

echo ""

# Step 5: Start Frontend (Next.js)
echo -e "${BLUE}⚛️  Step 5/5: Starting Frontend (Next.js)...${NC}"
cd /workspaces/anthropic-hackathon-proj/nextjs-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (this may take a minute)...${NC}"
    npm install --silent
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Start Next.js dev server
pkill -9 -f "next dev" 2>/dev/null || true
npm run dev > ../logs/nextjs-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check logs/nextjs-frontend.log${NC}"
        cleanup
    fi
    sleep 1
done

echo ""

# Optional: Start Mock API (Transaction Generator)
echo -e "${BLUE}🔧 Optional: Starting Mock API (Transaction Generator)...${NC}"
cd /workspaces/anthropic-hackathon-proj/go-mock-api
if [ -f "mock-api" ]; then
    pkill -9 -f "mock-api" 2>/dev/null || true
    ./mock-api > ../logs/mock-api-fullstack.log 2>&1 &
    MOCK_API_PID=$!
    sleep 1
    echo -e "${GREEN}✅ Mock API is running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️  Mock API binary not found. Build with: cd go-mock-api && go build${NC}"
    MOCK_API_PID=""
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 All Services Running!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Service URLs:${NC}"
echo -e "  ${GREEN}➜${NC} Frontend:         ${YELLOW}http://localhost:3000${NC}"
echo -e "  ${GREEN}➜${NC} Backend API:      ${YELLOW}http://localhost:8000${NC}"
echo -e "  ${GREEN}➜${NC} API Docs:         ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "  ${GREEN}➜${NC} pgAdmin:          ${YELLOW}http://localhost:5050${NC}"
echo ""
echo -e "${CYAN}🗄️  Database Info:${NC}"
echo -e "  ${GREEN}➜${NC} PostgreSQL:       ${YELLOW}localhost:5432${NC}"
echo -e "  ${GREEN}➜${NC} Database:         ${YELLOW}fraud_detection${NC}"
echo -e "  ${GREEN}➜${NC} User/Pass:        ${YELLOW}postgres/postgres${NC}"
echo -e "  ${GREEN}➜${NC} Redis:            ${YELLOW}localhost:6379${NC}"
echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo -e "  ${GREEN}➜${NC} Backend:          ${YELLOW}tail -f logs/python-backend-fullstack.log${NC}"
echo -e "  ${GREEN}➜${NC} Frontend:         ${YELLOW}tail -f logs/nextjs-frontend.log${NC}"
echo -e "  ${GREEN}➜${NC} Mock API:         ${YELLOW}tail -f logs/mock-api-fullstack.log${NC}"
echo ""
echo -e "${CYAN}💡 Quick Commands:${NC}"
echo -e "  ${GREEN}➜${NC} Generate transactions: ${YELLOW}./detect_fraud.sh${NC}"
echo -e "  ${GREEN}➜${NC} Stop all services:     ${YELLOW}Press Ctrl+C${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running and monitor services
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend stopped unexpectedly!${NC}"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend stopped unexpectedly!${NC}"
        cleanup
    fi
    
    sleep 5
done
