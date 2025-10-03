# Testing Guide

## Quick Demo

To see the system in action immediately:

```bash
# 1. Start all services
./start.sh

# 2. In another terminal, run demo scenarios
./demo.sh
```

The TUI dashboard will show real-time fraud detection with charts and metrics!

## Manual Testing

### Test Each Service Individually

#### 1. Test Redis
```bash
# Start Redis
redis-server --daemonize yes

# Test connection
redis-cli ping
# Expected: PONG

# Monitor Redis traffic
redis-cli monitor
```

#### 2. Test Python ML Backend

```bash
# Start the backend
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload &

# Wait a moment for startup
sleep 5

# Health check
curl http://localhost:8000/health | jq
# Expected: {"status":"healthy","model_loaded":true,"redis_connected":true}

# Get stats
curl http://localhost:8000/stats | jq
# Expected: Statistics object

# Test prediction with normal transaction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-001",
    "user_id": "user_001",
    "amount": 50.0,
    "currency": "USD",
    "transaction_type": "payment",
    "merchant_id": "merchant_amazon",
    "ip_address": "192.168.1.1",
    "timestamp": "2025-10-03T12:00:00Z"
  }' | jq
# Expected: Low risk score (~0.1-0.3)

# Test with suspicious transaction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-002",
    "user_id": "user_001",
    "amount": 5000.0,
    "currency": "USD",
    "transaction_type": "payment",
    "merchant_id": "merchant_unknown",
    "ip_address": "203.0.113.1",
    "timestamp": "2025-10-03T03:00:00Z"
  }' | jq
# Expected: High risk score (~0.7-0.9)
```

#### 3. Test Mock Transaction Generator

```bash
# Start mock API
cd go-mock-api
go run main.go &

# Wait for startup
sleep 3

# Health check
curl http://localhost:8080/health | jq
# Expected: {"status":"healthy","service":"Mock Transaction Generator"}

# Get stats
curl http://localhost:8080/stats | jq

# Generate single transaction
curl -X POST http://localhost:8080/transaction | jq

# Generate batch of 10 transactions
curl -X POST http://localhost:8080/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10}' | jq

# Start continuous generation (10 TPS, 15% fraud rate)
curl -X POST http://localhost:8080/start-generation | jq
# Expected: {"status":"started","rate":10,"fraud_rate":0.15}

# Monitor Redis to see transactions
redis-cli SUBSCRIBE transactions
# You should see transactions flowing in
```

#### 4. Test TUI Dashboard

```bash
cd go-frontend
go run main.go charts.go
```

**What you should see:**
- Real-time transaction metrics
- Risk score trends (line chart)
- Transaction volume by hour (bar chart)
- Fraud detections by hour (bar chart)
- Recent high-risk transactions table
- Live statistics boxes

**Keyboard Controls:**
- `r` - Refresh statistics
- `q` - Quit

## Integration Testing

### Full System Test

```bash
# 1. Start all services
./start.sh

# 2. In another terminal, verify services
curl http://localhost:8000/health
curl http://localhost:8080/health
redis-cli ping

# 3. Generate test transactions
./demo.sh

# 4. Watch the TUI dashboard update in real-time

# 5. Check logs
tail -f logs/python-backend.log
tail -f logs/mock-api.log

# 6. Stop all services
./stop.sh
```

### Performance Test

Test the system under load:

```bash
# Generate high transaction volume
for i in {1..100}; do
  curl -X POST http://localhost:8080/transaction &
done
wait

# Check stats
curl http://localhost:8000/stats | jq
```

## Testing Different Fraud Scenarios

### Scenario 1: Normal User Behavior
```bash
# Multiple small transactions from same user
for i in {1..5}; do
  curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d "{
      \"transaction_id\": \"normal-$i\",
      \"user_id\": \"user_001\",
      \"amount\": $((RANDOM % 100 + 10)),
      \"currency\": \"USD\",
      \"transaction_type\": \"payment\",
      \"merchant_id\": \"merchant_amazon\",
      \"ip_address\": \"192.168.1.1\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" | jq '.fraud_probability'
  sleep 1
done
# Expected: Low fraud probabilities (0.1-0.3)
```

### Scenario 2: Velocity Attack
```bash
# Rapid successive transactions
for i in {1..10}; do
  curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d "{
      \"transaction_id\": \"velocity-$i\",
      \"user_id\": \"user_002\",
      \"amount\": 100,
      \"currency\": \"USD\",
      \"transaction_type\": \"payment\",
      \"merchant_id\": \"merchant_online\",
      \"ip_address\": \"192.168.1.2\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" | jq '.fraud_probability'
  sleep 0.1
done
# Expected: Increasing fraud probabilities
```

### Scenario 3: High Amount Anomaly
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "high-amount-001",
    "user_id": "user_003",
    "amount": 9999.99,
    "currency": "USD",
    "transaction_type": "payment",
    "merchant_id": "merchant_unknown",
    "ip_address": "192.168.1.3",
    "timestamp": "2025-10-03T14:30:00Z"
  }' | jq
# Expected: High fraud probability (>0.7)
```

### Scenario 4: Unusual Time
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "unusual-time-001",
    "user_id": "user_004",
    "amount": 500,
    "currency": "USD",
    "transaction_type": "withdrawal",
    "merchant_id": null,
    "ip_address": "192.168.1.4",
    "timestamp": "2025-10-03T03:30:00Z"
  }' | jq
# Expected: Elevated fraud probability
```

### Scenario 5: Multiple IPs
```bash
# Same user, different IPs in short time
IPS=("192.168.1.1" "10.0.0.1" "172.16.0.1" "203.0.113.1")

for i in {0..3}; do
  curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d "{
      \"transaction_id\": \"multi-ip-$i\",
      \"user_id\": \"user_005\",
      \"amount\": 200,
      \"currency\": \"USD\",
      \"transaction_type\": \"payment\",
      \"merchant_id\": \"merchant_retail\",
      \"ip_address\": \"${IPS[$i]}\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" | jq '.fraud_probability'
  sleep 2
done
# Expected: Increasing fraud probability with each IP
```

## Testing ML Models

### Test Different Models

```bash
# Test with XGBoost (default)
export MODEL_TYPE=xgboost
./dev.sh python

# Test with LightGBM
export MODEL_TYPE=lightgbm
./dev.sh python

# Test with PyTorch Autoencoder
export MODEL_TYPE=pytorch
./dev.sh python
```

### Compare Model Performance

```python
# Use this Python script to test all models

import requests
import json

models = ['xgboost', 'lightgbm', 'pytorch']
test_transaction = {
    "transaction_id": "model-test-001",
    "user_id": "user_test",
    "amount": 1500.0,
    "currency": "USD",
    "transaction_type": "payment",
    "merchant_id": "merchant_test",
    "ip_address": "192.168.1.100",
    "timestamp": "2025-10-03T12:00:00Z"
}

for model in models:
    # Restart backend with different model
    print(f"\n=== Testing {model} ===")
    # Set environment and restart (manual step)
    
    response = requests.post(
        'http://localhost:8000/predict',
        json=test_transaction
    )
    result = response.json()
    print(f"Fraud Probability: {result['fraud_probability']:.3f}")
    print(f"Risk Level: {result['risk_level']}")
```

## Monitoring and Debugging

### Redis Monitoring
```bash
# Monitor all Redis activity
redis-cli monitor

# Subscribe to specific channel
redis-cli SUBSCRIBE transactions
redis-cli SUBSCRIBE fraud_results
redis-cli SUBSCRIBE fraud_explanations
```

### Log Monitoring
```bash
# Watch all logs
tail -f logs/*.log

# Python backend logs
tail -f logs/python-backend.log

# Mock API logs
tail -f logs/mock-api.log

# Search for errors
grep -i error logs/*.log
```

### Network Monitoring
```bash
# Check which ports are in use
lsof -i :6379  # Redis
lsof -i :8000  # Python backend
lsof -i :8080  # Mock API

# Monitor HTTP traffic
tcpdump -i lo0 -A 'tcp port 8000'
```

## Expected Results

### Normal Transaction
```json
{
  "transaction_id": "...",
  "fraud_probability": 0.15,
  "risk_level": "low",
  "is_fraud": false,
  "model_used": "xgboost"
}
```

### Fraudulent Transaction
```json
{
  "transaction_id": "...",
  "fraud_probability": 0.87,
  "risk_level": "critical",
  "is_fraud": true,
  "model_used": "xgboost"
}
```

### System Stats
```json
{
  "total_transactions": 1523,
  "fraud_detected": 234,
  "fraud_rate": 15.36,
  "avg_risk_score": 0.23,
  "model_type": "xgboost",
  "uptime_seconds": 3600.0
}
```

## Troubleshooting Tests

### Issue: Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server --daemonize yes

# Check Redis logs
tail -f /usr/local/var/log/redis.log
```

### Issue: Python Backend Not Responding
```bash
# Check if running
ps aux | grep uvicorn

# Check logs
tail -f logs/python-backend.log

# Restart
pkill -f uvicorn
cd python-backend && uvicorn main:app --reload &
```

### Issue: Mock API Port Conflict
```bash
# Find process using port 8080
lsof -ti:8080

# Kill it
lsof -ti:8080 | xargs kill -9

# Restart mock API
cd go-mock-api && go run main.go &
```

### Issue: Frontend Not Displaying Data
```bash
# Check if backend services are running
curl http://localhost:8000/health
curl http://localhost:8080/health

# Check Redis connection
redis-cli ping

# Generate some transactions
curl -X POST http://localhost:8080/start-generation

# Restart frontend
cd go-frontend && go run main.go charts.go
```

## Automated Test Script

```bash
#!/bin/bash
# automated-test.sh

echo "Running automated tests..."

# Test 1: Service health
echo "1. Testing service health..."
curl -s http://localhost:8000/health | jq -e '.status == "healthy"' || echo "FAIL: Python backend unhealthy"
curl -s http://localhost:8080/health | jq -e '.status == "healthy"' || echo "FAIL: Mock API unhealthy"
redis-cli ping | grep -q PONG || echo "FAIL: Redis not responding"

# Test 2: Generate transactions
echo "2. Generating test transactions..."
curl -s -X POST http://localhost:8080/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 10}' | jq -e '.count == 10' || echo "FAIL: Batch generation"

# Test 3: Check stats updated
echo "3. Checking stats..."
sleep 2
curl -s http://localhost:8000/stats | jq -e '.total_transactions > 0' || echo "FAIL: No transactions processed"

echo "Tests complete!"
```

## Performance Benchmarks

### Target Metrics
- **Latency:** <50ms per transaction (p99)
- **Throughput:** >100 TPS (single instance)
- **Accuracy:** >95% fraud detection rate
- **False Positives:** <5%

### Load Test
```bash
# Install Apache Bench (if not installed)
# brew install ab

# Test Python backend
ab -n 1000 -c 10 -p transaction.json -T application/json \
  http://localhost:8000/predict

# Test Mock API
ab -n 1000 -c 10 -p batch.json -T application/json \
  http://localhost:8080/transactions/batch
```

Save this test transaction as `transaction.json`:
```json
{
  "transaction_id": "load-test",
  "user_id": "user_load",
  "amount": 100,
  "currency": "USD",
  "transaction_type": "payment",
  "timestamp": "2025-10-03T12:00:00Z"
}
```

Save this as `batch.json`:
```json
{
  "count": 10
}
```
