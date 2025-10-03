#!/bin/bash

# Development script - run individual services for testing

SERVICE=$1

case $SERVICE in
  redis)
    echo "Starting Redis..."
    redis-server
    ;;
  
  python)
    echo "Starting Python Backend..."
    cd python-backend
    source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
    pip install -q -r requirements.txt
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ;;
  
  mock)
    echo "Starting Mock API..."
    cd go-mock-api
    go run main.go
    ;;
  
  frontend)
    echo "Starting Frontend..."
    cd go-frontend
    go run main.go charts.go
    ;;
  
  test)
    echo "Running tests..."
    
    # Test Python backend
    echo "Testing Python backend..."
    curl http://localhost:8000/health
    echo ""
    
    # Test Mock API
    echo "Testing Mock API..."
    curl http://localhost:8080/health
    echo ""
    
    # Test stats
    echo "Testing stats endpoint..."
    curl http://localhost:8000/stats
    echo ""
    
    # Generate test transaction
    echo "Generating test transaction..."
    curl -X POST http://localhost:8080/transaction
    echo ""
    ;;
  
  *)
    echo "Usage: ./dev.sh [redis|python|mock|frontend|test]"
    echo ""
    echo "Commands:"
    echo "  redis     - Start Redis server"
    echo "  python    - Start Python ML backend"
    echo "  mock      - Start Mock transaction generator"
    echo "  frontend  - Start TUI dashboard"
    echo "  test      - Test all services"
    ;;
esac
