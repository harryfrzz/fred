#!/bin/bash

# Quick test script to verify fraud detection is working

echo "🧪 Testing Fraud Detection System"
echo "=================================="
echo ""

# Test if services are running
echo "1. Checking services..."
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "   ❌ Mock API not running"
    exit 1
fi
echo "   ✅ Mock API is running"

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ❌ Python Backend not running"
    exit 1
fi
echo "   ✅ Python Backend is running"

echo ""
echo "2. Sending test fraud transaction..."

RESPONSE=$(curl -s -X POST http://localhost:8080/transaction/custom \
    -H "Content-Type: application/json" \
    -d '{
        "user_id": "test_fraudster",
        "amount": 15000,
        "currency": "USD",
        "transaction_type": "purchase",
        "merchant_category": "gambling",
        "ip_address": "192.168.1.100"
    }')

echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "submitted"; then
    echo "   ✅ Transaction submitted successfully!"
else
    echo "   ❌ Failed to submit transaction"
    exit 1
fi

echo ""
echo "3. Waiting for processing..."
sleep 2

echo ""
echo "4. Checking stats..."
STATS=$(curl -s http://localhost:8000/stats)
echo "   $STATS"

echo ""
echo "=================================="
echo "✅ Test complete!"
echo ""
echo "Now run ./quick_fraud.sh to generate a fraud attack!"
