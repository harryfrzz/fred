# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Prerequisites

**macOS:**
```bash
brew install python@3.11 go redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3.11 python3-pip redis-server
# Install Go from https://go.dev/dl/
```

### Step 2: Configure Environment

```bash
cd anthropic-hackathon-proj

# Create environment file
cp .env.example .env

# (Optional) Add your HuggingFace API key to .env
# This enables AI-powered fraud explanations
nano .env
```

### Step 3: Run the System

```bash
# This starts everything automatically!
./start.sh
```

🎉 **That's it!** The beautiful TUI dashboard will appear showing real-time fraud detection.

## 🎬 Demo Mode

Want to see impressive fraud detection scenarios? In another terminal:

```bash
./demo.sh
```

This generates:
- Normal transactions
- Velocity attacks
- High-value fraudulent transactions
- Account takeover attempts
- Mixed realistic scenarios

## 📊 What You'll See

The TUI dashboard displays:

```
┌─────────────────────────────────────────────────────────────┐
│     🛡️  AI-Powered Fraud Detection Dashboard               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Total      │  │    Fraud     │  │  Avg Risk    │    │
│  │Transactions  │  │   Detected   │  │    Score     │    │
│  │              │  │              │  │              │    │
│  │    1,523     │  │     234      │  │    23.5%     │    │
│  │              │  │  15.4% rate  │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Risk Score Trend (Last 50 Txns)             │  │
│  │  1.0 ┤                                               │  │
│  │      │              ●        ●●                      │  │
│  │  0.5 ┤     ●   ●●  ●  ●●   ●  ●●                    │  │
│  │      │  ●●  ●●●  ●●  ●  ●●●    ●  ●●●              │  │
│  │  0.0 └──────────────────────────────────────────   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │      Recent High-Risk Transactions                   │  │
│  │                                                       │  │
│  │  15:04:23  txn-abc123...  87.3%  🚨 CRITICAL        │  │
│  │  15:04:20  txn-def456...  72.1%  ⚠️  HIGH           │  │
│  │  15:04:18  txn-ghi789...  65.4%  ⚠️  HIGH           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Press 'r' to refresh | 'q' to quit                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### 1. Real-Time Fraud Detection
- **3 ML Models**: XGBoost, LightGBM, PyTorch Autoencoder
- **18+ Features**: User behavior, velocity, amount patterns, IP analysis
- **4 Risk Levels**: Low, Medium, High, Critical
- **<50ms Latency**: Real-time predictions

### 2. AI-Powered Explanations
- Uses **GPT-OSS-20B** via HuggingFace
- Human-readable fraud reasoning
- Actionable recommendations
- Risk factor identification

### 3. Beautiful Terminal UI
- **Live Charts**: Line charts, bar charts, gauges, sparklines
- **Color-Coded**: Risk levels clearly indicated
- **Responsive**: Auto-adjusts to terminal size
- **Professional**: Built with Lipgloss styling

### 4. Realistic Mock Data
- **5 Fraud Patterns**: Velocity, high amount, unusual time, etc.
- **Configurable**: Adjust fraud rate and transaction volume
- **Continuous**: Auto-generates realistic traffic

## 🔧 Advanced Usage

### Run Individual Services

```bash
# Development mode - run one service at a time
./dev.sh redis      # Start Redis only
./dev.sh python     # Start Python backend (with hot reload)
./dev.sh mock       # Start mock transaction generator
./dev.sh frontend   # Start TUI dashboard
./dev.sh test       # Test all services
```

### Test Specific Fraud Scenarios

```bash
# High amount anomaly
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-001",
    "user_id": "user_001",
    "amount": 5000.0,
    "currency": "USD",
    "transaction_type": "payment",
    "timestamp": "2025-10-03T12:00:00Z"
  }'

# Check the results in the TUI dashboard!
```

### Change ML Model

Edit `.env`:
```env
MODEL_TYPE=xgboost   # or lightgbm or pytorch
```

Restart Python backend:
```bash
./stop.sh
./start.sh
```

### Adjust Transaction Rate

Edit `.env`:
```env
TRANSACTION_RATE=50  # 50 transactions per second
FRAUD_RATE=0.25      # 25% fraud rate
```

## 📱 API Examples

### Python Backend (Port 8000)

```bash
# Health check
curl http://localhost:8000/health

# Get statistics
curl http://localhost:8000/stats

# Predict fraud
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d @transaction.json
```

### Mock API (Port 8080)

```bash
# Generate single transaction
curl -X POST http://localhost:8080/transaction

# Generate batch
curl -X POST http://localhost:8080/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'

# Start continuous generation
curl -X POST http://localhost:8080/start-generation
```

## 🐛 Troubleshooting

### Services won't start?
```bash
# Check if ports are in use
lsof -i :6379   # Redis
lsof -i :8000   # Python
lsof -i :8080   # Mock API

# Kill conflicting processes
./stop.sh
```

### No data in dashboard?
```bash
# Verify services are running
curl http://localhost:8000/health
curl http://localhost:8080/health
redis-cli ping

# Generate some transactions
./demo.sh
```

### Python dependencies issues?
```bash
cd python-backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Go build errors?
```bash
cd go-mock-api
go mod tidy
go mod download

cd ../go-frontend
go mod tidy
go mod download
```

## 🛑 Stopping the System

```bash
./stop.sh
```

This gracefully stops all services.

## 📚 More Information

- **Full Installation Guide**: See [INSTALL.md](INSTALL.md)
- **Architecture Details**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Testing Guide**: See [TESTING.md](TESTING.md)
- **Project Documentation**: See [README.md](README.md)

## 💡 Tips for Best Demo

1. **Start with clean slate**: `./stop.sh && ./start.sh`
2. **Let it warm up**: Wait 10 seconds after starting
3. **Run demo script**: `./demo.sh` in another terminal
4. **Watch the magic**: Dashboard updates in real-time
5. **Try manual tests**: Send custom transactions via API
6. **Press 'r'**: Refresh stats anytime
7. **Resize terminal**: UI adapts automatically

## 🎓 Understanding the Results

### Risk Levels

| Icon | Level | Action |
|------|-------|--------|
| ✓ | LOW (0-30%) | Allow transaction |
| ⚡ | MEDIUM (30-60%) | Review recommended |
| ⚠️ | HIGH (60-85%) | Require verification |
| 🚨 | CRITICAL (85-100%) | Block immediately |

### What Makes a Transaction Suspicious?

1. **High Amount**: Significantly above user's average
2. **High Velocity**: Many transactions in short time
3. **Multiple IPs**: Same user from different locations
4. **Unusual Time**: Transactions at 2-5 AM
5. **New Device**: Different device/location than usual

## 🚀 Next Steps

1. ✅ Get the system running (`./start.sh`)
2. ✅ Run demo scenarios (`./demo.sh`)
3. ✅ Explore the TUI dashboard
4. ✅ Try the API endpoints
5. ✅ Test different ML models
6. ✅ Customize fraud patterns
7. ✅ Add your own features

## 🤝 Support

Having issues? Check:
- Logs in `./logs/` directory
- Error messages in terminal
- Service health: `./dev.sh test`

## 📄 License

MIT License - Free to use and modify!

---

**Enjoy detecting fraud with AI! 🛡️🤖**
