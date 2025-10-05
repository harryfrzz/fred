#!/bin/bash
set -e

echo "🚀 Starting Fraud Detection System with PostgreSQL"
echo "=================================================="

# Start PostgreSQL and Redis with Docker Compose
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec fraud_detection_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 1
done

# Wait for Redis
echo "⏳ Waiting for Redis..."
sleep 2
echo "✅ Redis is ready!"

echo ""
echo "📊 Database Information:"
echo "  PostgreSQL: localhost:5432"
echo "  Database: fraud_detection"
echo "  Username: postgres"
echo "  Password: postgres"
echo ""
echo "  pgAdmin UI: http://localhost:5050"
echo "  Email: admin@fraud.local"
echo "  Password: admin"
echo ""
echo "  Redis: localhost:6379"
echo ""

# Install dependencies if needed
if [ ! -d "python-backend/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd python-backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Python environment already set up"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend:      cd python-backend && python main.py"
echo "2. Start the frontend:     cd nextjs-frontend && npm run dev"
echo "3. Generate transactions:  ./detect_fraud.sh"
echo ""
echo "To stop services: docker-compose down"
echo "To reset data: docker-compose down -v"
