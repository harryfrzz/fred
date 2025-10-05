#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Fraud Detection System...${NC}"
echo ""

# Stop Docker containers
echo -e "Stopping Docker containers (PostgreSQL, pgAdmin)..."
docker-compose down 2>/dev/null
echo -e "${GREEN}✅ Docker containers stopped${NC}"

# Stop backend processes
echo -e "Stopping backend processes..."
pkill -9 -f "python main.py" 2>/dev/null || true
pkill -9 -f "uvicorn main:app" 2>/dev/null || true
echo -e "${GREEN}✅ Backend stopped${NC}"

# Stop frontend
echo -e "Stopping frontend..."
pkill -9 -f "next dev" 2>/dev/null || true
echo -e "${GREEN}✅ Frontend stopped${NC}"

# Stop mock API
echo -e "Stopping mock API..."
pkill -9 -f "mock-api" 2>/dev/null || true
echo -e "${GREEN}✅ Mock API stopped${NC}"

echo ""
echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo -e "${YELLOW}Note: Redis is left running (system service)${NC}"

