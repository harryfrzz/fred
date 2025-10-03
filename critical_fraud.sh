#!/bin/bash

# Moderate Fraud Transaction Generator
# Generates realistic fraud patterns without triggering everything as fraud

set -e

API_URL="http://localhost:8080"

echo "========================================="
echo "⚠️  MODERATE FRAUD GENERATOR ⚠️"
echo "========================================="
echo ""

# Check if services are running
if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo "❌ Error: Mock API is not running on port 8080"
    echo "   Run ./start.sh first"
    exit 1
fi

echo "✅ Mock API is running"
echo ""

# Generate fraud transactions with moderate amounts
# Model: Normal ~$60-150, Fraud ~$300-600 (moderate range)
echo "Generating MODERATE FRAUD transactions (amounts: $250-$600)..."
echo ""

# Transaction 1: Moderate amount cryptocurrency ($380)
echo "1️⃣  Sending $380 cryptocurrency transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_001",
    "amount": 380,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "cryptocurrency",
    "location": "Unknown",
    "ip_address": "0.0.0.0"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Transaction 2: $450 gambling 
echo "2️⃣  Sending $450 gambling transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_002",
    "amount": 450,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "gambling",
    "location": "Foreign",
    "ip_address": "1.1.1.1"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Transaction 3: $520 wire transfer
echo "3️⃣  Sending $520 wire transfer..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_003",
    "amount": 520,
    "currency": "USD",
    "transaction_type": "transfer",
    "merchant_category": "wire_transfer",
    "location": "International",
    "ip_address": "10.0.0.1"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Transaction 4: Rapid velocity - same user, multiple $300-450 transactions
echo "4️⃣  Sending rapid-fire transactions (velocity attack)..."
for i in {1..5}; do
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"fraud_user_velocity\",
        \"amount\": $((320 + i * 25)),
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"cryptocurrency\",
        \"location\": \"Unknown\",
        \"ip_address\": \"192.168.1.$i\"
      }" 2>/dev/null
    echo -n "."
    sleep 0.2
done
echo " ✓"

sleep 0.5

# Transaction 5: $480 high-risk merchant
echo "5️⃣  Sending $480 high-risk transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_005",
    "amount": 480,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "gambling",
    "location": "Blacklisted",
    "ip_address": "13.37.13.37"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Transaction 6: Establishing baseline for new user
echo "6️⃣  Sending baseline transaction for new user..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "baseline_user_001",
    "amount": 90,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "retail",
    "location": "US",
    "ip_address": "192.168.1.100"
  }' 2>/dev/null
echo " ✓"

sleep 0.3

# Transaction 7: Same user, now $480 (5x jump from baseline)
echo "7️⃣  Sending 5x amount jump from baseline..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "baseline_user_001",
    "amount": 480,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "cryptocurrency",
    "location": "Foreign",
    "ip_address": "8.8.8.8"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Transaction 8: Normal baseline transaction
echo "8️⃣  Sending normal transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "normal_user_001",
    "amount": 125,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "grocery",
    "location": "US",
    "ip_address": "192.168.1.50"
  }' 2>/dev/null
echo " ✓"

echo ""
echo "========================================="
echo "✅ MODERATE FRAUD GENERATION COMPLETE"
echo "========================================="
echo ""
echo "Generated transactions:"
echo "  • 13 transactions total"
echo "  • Amounts: $90 - $520 (realistic fraud range)"
echo "  • High-risk categories: Cryptocurrency, Gambling, Wire Transfer"
echo "  • Velocity attacks (5 rapid transactions)"
echo "  • Amount deviation (5x baseline jump)"
echo ""
echo "Expected fraud scores:"
echo "  • Normal ($90-150): LOW risk (5-15%)"
echo "  • Suspicious ($250-350): MEDIUM risk (25-40%)"
echo "  • Fraudulent ($380-520): MEDIUM-HIGH risk (40-60%)"
echo ""
echo "Check your dashboard for fraud alerts! ⚠️"
echo ""
