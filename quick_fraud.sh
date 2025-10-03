#!/bin/bash

# Quick Fraud Generator
# Run this in a separate terminal while the main system is running

echo "🚨 Quick Fraud Attack Generator"
echo "================================"
echo ""

# Quick check with timeout
HEALTH_CHECK=$(timeout 2 curl -s http://localhost:8080/health 2>&1)
if [[ ! "$HEALTH_CHECK" =~ "healthy" ]]; then
    echo "⚠️  Warning: Mock API might not be running."
    echo "   Response: $HEALTH_CHECK"
    echo "   Continuing anyway..."
    echo ""
fi

echo "Generating CRITICAL fraud patterns in 3 seconds..."
sleep 1
echo "3..."
sleep 1
echo "2..."
sleep 1
echo "1..."
echo ""
echo "🔥 ATTACK STARTED!"
echo ""

# Rapid-fire velocity attack
echo "⚡ Velocity Attack: 50 transactions in 5 seconds..."
for i in {1..50}; do
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"FRAUDSTER_001\",
            \"amount\": $((5000 + RANDOM % 10000)),
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"merchant_category\": \"electronics\",
            \"ip_address\": \"192.168.1.$((RANDOM % 255))\"
        }" > /dev/null 2>&1 &
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "   💥 $i transactions sent..."
    fi
done

wait
echo "✅ Attack complete!"
echo ""
echo "📊 Check your dashboard - it should show:"
echo "   - HIGH transaction volume spike"
echo "   - CRITICAL risk scores (>0.7)"
echo "   - Multiple fraud alerts"
echo ""
echo "Press 'r' in the dashboard to refresh!"
