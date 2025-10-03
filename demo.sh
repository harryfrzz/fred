#!/bin/bash

# Demo script - generates interesting fraud scenarios

echo "🎬 Starting Fraud Detection Demo"
echo "================================="
echo ""

MOCK_API="http://localhost:8080"

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 3

echo "📊 Generating demo transaction scenarios..."
echo ""

# Scenario 1: Normal transactions
echo "1️⃣  Generating normal transactions..."
curl -s -X POST "$MOCK_API/transactions/batch" \
  -H "Content-Type: application/json" \
  -d '{"count": 10}' > /dev/null
echo "   ✅ Generated 10 normal transactions"
sleep 2

# Scenario 2: High velocity attack
echo ""
echo "2️⃣  Simulating velocity attack (rapid transactions)..."
for i in {1..8}; do
  curl -s -X POST "$MOCK_API/transaction" > /dev/null
  sleep 0.1
done
echo "   ✅ Generated 8 rapid transactions"
sleep 2

# Scenario 3: High amount transactions
echo ""
echo "3️⃣  Simulating high-value transactions..."
curl -s -X POST "$MOCK_API/transactions/batch" \
  -H "Content-Type: application/json" \
  -d '{"count": 5}' > /dev/null
echo "   ✅ Generated 5 potentially fraudulent transactions"
sleep 2

# Scenario 4: Mixed batch
echo ""
echo "4️⃣  Generating mixed transaction batch..."
curl -s -X POST "$MOCK_API/transactions/batch" \
  -H "Content-Type: application/json" \
  -d '{"count": 20}' > /dev/null
echo "   ✅ Generated 20 mixed transactions"
sleep 2

# Scenario 5: Continuous generation
echo ""
echo "5️⃣  Starting continuous transaction generation..."
curl -s -X POST "$MOCK_API/start-generation" > /dev/null
echo "   ✅ Continuous generation started"

echo ""
echo "================================="
echo "✨ Demo scenarios complete!"
echo ""
echo "📊 The TUI dashboard should now show:"
echo "   - Transaction volume trends"
echo "   - Fraud detection rates"
echo "   - Risk score analysis"
echo "   - Real-time alerts"
echo ""
echo "💡 Transactions are continuously being generated"
echo "   at 10 transactions/second with ~15% fraud rate"
echo "================================="
