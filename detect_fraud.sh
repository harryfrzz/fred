#!/bin/bash

# BALANCED FRAUD DETECTION SCRIPT
# Generates realistic fraud patterns with moderate amounts (not triggering everything as fraud)

set -e

API_URL="http://localhost:8080"

echo "========================================="
echo "� BALANCED FRAUD DETECTION SCRIPT �"
echo "========================================="
echo ""

# Check if services are running
if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo "❌ Error: Mock API is not running on port 8080"
    echo "   Run ./start.sh first"
    exit 1
fi

echo "✅ Mock API is running"
echo "📊 Testing with realistic amounts"
echo ""

# First, send baseline normal transactions
echo "📝 Step 1: Establishing baseline (normal transactions)..."
for i in {1..5}; do
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"baseline_user_$i\",
        \"amount\": $((60 + i * 15)),
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"retail\",
        \"location\": \"USA\",
        \"ip_address\": \"192.168.1.$i\"
      }" 2>/dev/null
    echo -n "."
    sleep 0.3
done
echo " ✓ Baseline established ($60-135)"

sleep 1

# Now send moderate FRAUD transactions ($300-550 range for balanced detection)
echo ""
echo "🚨 Step 2: Sending FRAUD transactions (moderate amounts)..."
echo ""

# Fraud 1: $420 cryptocurrency (high risk merchant + moderate amount)
echo "1️⃣  $420 Cryptocurrency transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_001",
    "amount": 420,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "cryptocurrency",
    "location": "Unknown",
    "ip_address": "0.0.0.0"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Fraud 2: $480 gambling transaction
echo "2️⃣  $480 Gambling transaction..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_002",
    "amount": 480,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "gambling",
    "location": "Foreign",
    "ip_address": "1.1.1.1"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Fraud 3: $550 wire transfer
echo "3️⃣  $550 Wire transfer..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "fraud_user_003",
    "amount": 550,
    "currency": "USD",
    "transaction_type": "transfer",
    "merchant_category": "wire_transfer",
    "location": "International",
    "ip_address": "10.0.0.1"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Fraud 4: Velocity attack - 6 rapid transactions from same user
echo "4️⃣  Velocity attack (6 rapid $350-500 transactions)..."
for i in {1..6}; do
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"velocity_attacker\",
        \"amount\": $((350 + i * 25)),
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"cryptocurrency\",
        \"location\": \"Unknown\",
        \"ip_address\": \"192.168.99.$i\"
      }" 2>/dev/null
    echo -n "."
    sleep 0.15
done
echo " ✓"

sleep 0.5

# Fraud 5: Baseline user suddenly does $500 (moderate jump)
echo "5️⃣  Baseline deviation attack ($75 → $500 jump)..."
curl -X POST "${API_URL}/transaction/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "baseline_user_1",
    "amount": 500,
    "currency": "USD",
    "transaction_type": "purchase",
    "merchant_category": "cryptocurrency",
    "location": "Foreign",
    "ip_address": "8.8.8.8"
  }' 2>/dev/null
echo " ✓"

sleep 0.5

# Fraud 6: Multiple users same suspicious IP
echo "6️⃣  Multiple users from same suspicious IP..."
for i in {1..3}; do
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"suspicious_user_$i\",
        \"amount\": $((380 + i * 35)),
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"gambling\",
        \"location\": \"Unknown\",
        \"ip_address\": \"13.37.13.37\"
      }" 2>/dev/null
    echo -n "."
    sleep 0.2
done
echo " ✓"

sleep 0.5

# Some medium-risk transactions (should be SUSPICIOUS, not FRAUD)
echo ""
echo "⚡ Step 3: Sending SUSPICIOUS transactions..."
echo ""

for i in {1..4}; do
    amount=$((200 + i * 40))
    echo "$i. $${amount} transaction..."
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"medium_user_$i\",
        \"amount\": ${amount},
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"electronics\",
        \"location\": \"USA\",
        \"ip_address\": \"192.168.2.$i\"
      }" 2>/dev/null
    echo " ✓"
    sleep 0.3
done

# Add some more normal transactions
echo ""
echo "✓ Step 4: Sending NORMAL transactions..."
echo ""

for i in {1..3}; do
    amount=$((80 + i * 25))
    echo "$i. $${amount} normal purchase..."
    curl -X POST "${API_URL}/transaction/custom" \
      -H "Content-Type: application/json" \
      -d "{
        \"user_id\": \"normal_user_$i\",
        \"amount\": ${amount},
        \"currency\": \"USD\",
        \"transaction_type\": \"purchase\",
        \"merchant_category\": \"grocery\",
        \"location\": \"USA\",
        \"ip_address\": \"192.168.10.$i\"
      }" 2>/dev/null
    echo " ✓"
    sleep 0.3
done

echo ""
echo "========================================="
echo "✅ BALANCED FRAUD DETECTION COMPLETE"
echo "========================================="
echo ""
echo "Generated:"
echo "  • 5 baseline normal transactions ($60-135)"
echo "  • 12 FRAUD transactions ($350-550)"
echo "  • 4 SUSPICIOUS transactions ($200-320)"
echo "  • 3 NORMAL transactions ($80-155)"
echo "  • Total: 24 transactions"
echo ""
echo "Expected Results:"
echo "  🚨 FRAUD: ~8-12 transactions (35-55% risk)"
echo "  ⚠️  SUSPICIOUS/CAUTION: ~6-8 transactions (20-35% risk)"
echo "  ✓  LEGITIMATE: ~4-8 transactions (risk < 20%)"
echo ""
echo "Fraud Patterns:"
echo "  • Moderate amounts ($350-550)"
echo "  • High-risk merchants (crypto, gambling)"
echo "  • Velocity attacks (6 rapid transactions)"
echo "  • Baseline deviation (5-7x amount jump)"
echo "  • Multiple users, same IP"
echo ""
echo "Check your FRED dashboard now! 🎯"
echo ""
