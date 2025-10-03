#!/bin/bash

# Quick verification script for fraud detection system
# Shows that fraud detection is working correctly

echo "🔍 FRAUD DETECTION SYSTEM - QUICK VERIFICATION"
echo "=============================================="
echo ""

# Check if services are running
echo "1️⃣  Checking services..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "   ✅ Python Backend (port 8000)"
else
    echo "   ❌ Python Backend NOT running"
    exit 1
fi

if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo "   ✅ Mock API (port 8080)"
else
    echo "   ❌ Mock API NOT running"
    exit 1
fi

echo ""
echo "2️⃣  Current fraud detection stats..."
echo ""
curl -s http://localhost:8000/stats | python3 -m json.tool
echo ""

echo "3️⃣  Sending test fraud transactions..."
echo ""

# Send 3 test transactions
echo "   📤 Sending \$450 suspicious transaction..."
curl -s -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "amount": 450.00,
    "merchant": "SUSPICIOUS-MERCHANT",
    "transaction_type": "purchase"
  }' > /dev/null

sleep 1

echo "   📤 Sending \$800 FRAUD transaction..."
curl -s -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_002",
    "amount": 800.00,
    "merchant": "CRYPTO-EXCHANGE",
    "transaction_type": "cryptocurrency"
  }' > /dev/null

sleep 1

echo "   📤 Sending \$120 normal transaction..."
curl -s -X POST http://localhost:8080/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_003",
    "amount": 120.00,
    "merchant": "GROCERY-STORE",
    "transaction_type": "purchase"
  }' > /dev/null

sleep 2

echo ""
echo "4️⃣  Updated fraud detection stats..."
echo ""
curl -s http://localhost:8000/stats | python3 -m json.tool
echo ""

echo ""
echo "✅ VERIFICATION COMPLETE!"
echo ""
echo "Expected Results:"
echo "  • Total transactions should have increased by 3"
echo "  • Fraud detected should have increased by 1-2"
echo "  • Average risk score should be 50-70%"
echo ""
echo "Open the FRED dashboard to see fraud visualization!"
echo "Run: ./start.sh (if not already running)"
