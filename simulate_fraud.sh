#!/bin/bash

# Fraud Simulation Script
# This script generates high-risk transaction patterns to trigger fraud detection

echo "🚨 Starting Fraud Simulation..."
echo "================================"
echo ""

# Check if services are running with timeout
HEALTH_CHECK=$(timeout 2 curl -s http://localhost:8080/health 2>&1)
if [[ ! "$HEALTH_CHECK" =~ "healthy" ]]; then
    echo "⚠️  Warning: Mock API might not be running."
    echo "   Continuing anyway..."
    echo ""
fi

# Simulate high-risk patterns
echo ""
echo "1️⃣  Simulating HIGH RISK fraud patterns..."
echo ""

# Pattern 1: Rapid transactions from same user (velocity fraud)
echo "   📊 Pattern 1: Velocity Attack (Rapid transactions from same user)"
USER_ID="user_fraud_001"
for i in {1..20}; do
    AMOUNT=$((RANDOM % 5000 + 1000))
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"amount\": $AMOUNT,
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"merchant_id\": \"merchant_$((RANDOM % 100))\",
            \"merchant_category\": \"electronics\",
            \"location\": \"New York, US\",
            \"ip_address\": \"192.168.1.$((RANDOM % 255))\"
        }" > /dev/null 2>&1
    
    if [ $((i % 5)) -eq 0 ]; then
        echo "   ✓ Sent $i rapid transactions..."
    fi
    sleep 0.1
done
echo "   ✅ Velocity attack simulated (20 transactions in 2 seconds)"

sleep 2

# Pattern 2: Large unusual amounts
echo ""
echo "   📊 Pattern 2: Unusual Large Amounts"
USER_ID="user_fraud_002"
for i in {1..10}; do
    AMOUNT=$((RANDOM % 50000 + 10000))  # $10k-$60k
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"amount\": $AMOUNT,
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"merchant_id\": \"merchant_999\",
            \"merchant_category\": \"jewelry\",
            \"location\": \"Miami, US\"
        }" > /dev/null 2>&1
    
    if [ $((i % 3)) -eq 0 ]; then
        echo "   ✓ Sent $i large transactions..."
    fi
    sleep 0.2
done
echo "   ✅ Large amount fraud simulated (10 transactions $10k-$60k)"

sleep 2

# Pattern 3: Multiple locations in short time (location hopping)
echo ""
echo "   📊 Pattern 3: Location Hopping (Impossible travel)"
USER_ID="user_fraud_003"
LOCATIONS=("New York, US" "London, UK" "Tokyo, JP" "Sydney, AU" "Moscow, RU" "Dubai, UAE")
IPS=("192.168.1.100" "10.0.0.50" "172.16.0.1" "203.0.113.0" "198.51.100.0" "8.8.8.8")

for i in {0..5}; do
    AMOUNT=$((RANDOM % 3000 + 500))
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"amount\": $AMOUNT,
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"location\": \"${LOCATIONS[$i]}\",
            \"ip_address\": \"${IPS[$i]}\",
            \"merchant_category\": \"travel\"
        }" > /dev/null 2>&1
    
    echo "   ✓ Transaction from ${LOCATIONS[$i]}"
    sleep 0.5
done
echo "   ✅ Location hopping simulated (6 continents in 3 seconds)"

sleep 2

# Pattern 4: Unusual merchant categories in sequence
echo ""
echo "   📊 Pattern 4: Unusual Category Switching"
USER_ID="user_fraud_004"
CATEGORIES=("gambling" "cryptocurrency" "adult_content" "money_transfer" "wire_transfer" "cash_advance")

for i in {0..5}; do
    AMOUNT=$((RANDOM % 5000 + 1000))
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"amount\": $AMOUNT,
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"merchant_category\": \"${CATEGORIES[$i]}\"
        }" > /dev/null 2>&1
    
    echo "   ✓ ${CATEGORIES[$i]} transaction"
    sleep 0.3
done
echo "   ✅ High-risk category pattern simulated"

sleep 2

# Pattern 5: Multiple failed transactions followed by success (testing fraud)
echo ""
echo "   📊 Pattern 5: Testing Pattern (Multiple attempts)"
USER_ID="user_fraud_005"
for i in {1..15}; do
    AMOUNT=$((RANDOM % 2000 + 500))
    DEVICE_ID="device_$((RANDOM % 5))"
    
    curl -s -X POST http://localhost:8080/transaction/custom \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$USER_ID\",
            \"amount\": $AMOUNT,
            \"currency\": \"USD\",
            \"transaction_type\": \"purchase\",
            \"device_id\": \"$DEVICE_ID\",
            \"merchant_category\": \"electronics\"
        }" > /dev/null 2>&1
    
    if [ $((i % 5)) -eq 0 ]; then
        echo "   ✓ Sent $i test transactions with different devices..."
    fi
    sleep 0.15
done
echo "   ✅ Testing pattern simulated (15 transactions, 5 different devices)"

# Summary
echo ""
echo "================================"
echo "✅ Fraud Simulation Complete!"
echo ""
echo "📊 Generated:"
echo "   - 20 rapid velocity transactions"
echo "   - 10 unusually large amount transactions"
echo "   - 6 impossible location hops"
echo "   - 6 high-risk category switches"
echo "   - 15 device testing attempts"
echo ""
echo "   Total: ~67 HIGH-RISK transactions"
echo ""
echo "🎯 Check your TUI dashboard for fraud alerts!"
echo "   Press 'r' to refresh the dashboard"
echo ""
