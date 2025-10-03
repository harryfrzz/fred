# 🚀 Getting Started Checklist

Use this checklist to get your fraud detection system up and running!

## ✅ Prerequisites Installation

### macOS Users
- [ ] Install Homebrew (if not already): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] Install Python: `brew install python@3.11`
- [ ] Install Go: `brew install go`
- [ ] Install Redis: `brew install redis`
- [ ] Start Redis: `brew services start redis`

### Linux (Ubuntu/Debian) Users
- [ ] Update packages: `sudo apt-get update`
- [ ] Install Python: `sudo apt-get install python3.11 python3-pip python3.11-venv`
- [ ] Install Go: Download from https://go.dev/dl/ and install
- [ ] Install Redis: `sudo apt-get install redis-server`
- [ ] Start Redis: `sudo systemctl start redis`

### Verify Installation
- [ ] Check Python: `python3 --version` (should be 3.9+)
- [ ] Check Go: `go version` (should be 1.21+)
- [ ] Check Redis: `redis-cli ping` (should return PONG)

## ✅ Project Setup

- [ ] Navigate to project: `cd /Users/harryfrz/anthropic-hackathon-proj`
- [ ] Create environment file: `cp .env.example .env`
- [ ] (Optional) Edit .env and add HuggingFace API key for AI explanations
- [ ] Make scripts executable: `chmod +x *.sh`
- [ ] Run health check: `./health-check.sh`

## ✅ First Run

### Quick Start (Recommended)
- [ ] Run the start script: `./start.sh`
- [ ] Wait for all services to initialize (~10-15 seconds)
- [ ] You should see the TUI dashboard appear
- [ ] In another terminal, run demo: `./demo.sh`
- [ ] Watch the dashboard update with fraud detection!

### Docker Alternative
- [ ] Install Docker Desktop
- [ ] Run: `docker-compose up`
- [ ] Access services as usual

## ✅ Verify Everything Works

### Service Health Checks
- [ ] Python Backend: `curl http://localhost:8000/health`
  - Should return: `{"status":"healthy","model_loaded":true,"redis_connected":true}`
- [ ] Mock API: `curl http://localhost:8080/health`
  - Should return: `{"status":"healthy","service":"Mock Transaction Generator"}`
- [ ] Redis: `redis-cli ping`
  - Should return: `PONG`

### Test Transaction
- [ ] Generate test transaction: `curl -X POST http://localhost:8080/transaction`
- [ ] Check stats: `curl http://localhost:8000/stats`
- [ ] You should see transaction count > 0

## ✅ Demo Scenarios

Run these to see impressive fraud detection:

- [ ] Run demo script: `./demo.sh`
- [ ] Watch normal transactions appear (green/low risk)
- [ ] Watch velocity attacks get flagged (yellow/orange)
- [ ] Watch high-amount fraud get blocked (red/critical)
- [ ] Observe real-time charts updating
- [ ] Check recent transactions table

## ✅ Explore Features

### TUI Dashboard Features
- [ ] View total transaction count
- [ ] See fraud detection rate
- [ ] Watch risk score trend (line chart)
- [ ] Observe transaction volume by hour (bar chart)
- [ ] Monitor fraud distribution (bar chart)
- [ ] Review recent high-risk transactions
- [ ] Press 'r' to refresh stats
- [ ] Press 'q' to quit

### API Testing
- [ ] Send normal transaction:
  ```bash
  curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d '{
      "transaction_id": "test-001",
      "user_id": "user_001",
      "amount": 50.0,
      "currency": "USD",
      "transaction_type": "payment",
      "timestamp": "2025-10-03T12:00:00Z"
    }'
  ```
- [ ] Send fraudulent transaction:
  ```bash
  curl -X POST http://localhost:8000/predict \
    -H "Content-Type: application/json" \
    -d '{
      "transaction_id": "test-002",
      "user_id": "user_001",
      "amount": 5000.0,
      "currency": "USD",
      "transaction_type": "payment",
      "timestamp": "2025-10-03T03:00:00Z"
    }'
  ```
- [ ] Compare the fraud probabilities!

## ✅ Advanced Testing

### Try Different ML Models
- [ ] Edit `.env` and set `MODEL_TYPE=xgboost`
- [ ] Restart: `./stop.sh && ./start.sh`
- [ ] Test transactions and note fraud scores
- [ ] Try `MODEL_TYPE=lightgbm`
- [ ] Try `MODEL_TYPE=pytorch`
- [ ] Compare results!

### Adjust Transaction Generation
- [ ] Edit `.env` and set `TRANSACTION_RATE=50` (50 TPS)
- [ ] Edit `.env` and set `FRAUD_RATE=0.25` (25% fraud)
- [ ] Restart and observe higher volume

### Monitor System
- [ ] Watch Python logs: `tail -f logs/python-backend.log`
- [ ] Watch Mock API logs: `tail -f logs/mock-api.log`
- [ ] Monitor Redis: `redis-cli monitor`
- [ ] Check system resources: `top` or `htop`

## ✅ Understanding Results

### Risk Levels
- [ ] Understand LOW (0-30%): Green ✓ - Allow transaction
- [ ] Understand MEDIUM (30-60%): Yellow ⚡ - Review recommended
- [ ] Understand HIGH (60-85%): Orange ⚠️ - Hold for verification
- [ ] Understand CRITICAL (85-100%): Red 🚨 - Block immediately

### Fraud Indicators
- [ ] High amount vs user average
- [ ] Rapid succession of transactions
- [ ] Multiple IPs for same user
- [ ] Transactions at unusual hours (2-5 AM)
- [ ] New device/location for user

## ✅ Documentation Review

- [ ] Read [QUICKSTART.md](QUICKSTART.md) - Quick 3-step guide
- [ ] Read [README.md](README.md) - Project overview
- [ ] Browse [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [ ] Check [TESTING.md](TESTING.md) - Testing scenarios
- [ ] View [DIAGRAMS.md](DIAGRAMS.md) - Visual architecture
- [ ] Review [INSTALL.md](INSTALL.md) - Detailed setup

## ✅ Troubleshooting

If something doesn't work:

- [ ] Run health check: `./health-check.sh`
- [ ] Check if all prerequisites are installed
- [ ] Verify Redis is running: `redis-cli ping`
- [ ] Check port availability: `lsof -i :6379 -i :8000 -i :8080`
- [ ] Review logs in `logs/` directory
- [ ] Stop and restart: `./stop.sh && ./start.sh`
- [ ] Check Docker containers (if using Docker): `docker-compose ps`

## ✅ Stop the System

When you're done:
- [ ] Press 'q' in the TUI dashboard to quit
- [ ] Run stop script: `./stop.sh`
- [ ] Verify services stopped: `./health-check.sh`

## 🎉 Success Criteria

You've successfully completed setup when you can:

✅ Start all services with one command (`./start.sh`)  
✅ See the TUI dashboard with live updates  
✅ Run demo scenarios (`./demo.sh`)  
✅ Observe fraud detection in real-time  
✅ See charts updating with transaction data  
✅ Generate custom transactions via API  
✅ Stop all services cleanly (`./stop.sh`)  

## 🚀 Next Steps

Once everything works:

1. **Customize**: Modify fraud patterns in `go-mock-api/main.go`
2. **Enhance**: Add new features in `python-backend/feature_extractor.py`
3. **Experiment**: Try different ML models and thresholds
4. **Integrate**: Connect to your own transaction sources
5. **Extend**: Add new charts to the TUI dashboard
6. **Deploy**: Use Docker Compose for production deployment

## 📞 Quick Commands Reference

```bash
# Start everything
./start.sh

# Run demo
./demo.sh

# Health check
./health-check.sh

# Stop everything
./stop.sh

# Development mode
./dev.sh python    # Python backend only
./dev.sh mock      # Mock API only
./dev.sh frontend  # TUI only
./dev.sh test      # Test all services

# Manual testing
curl http://localhost:8000/health
curl http://localhost:8080/health
curl http://localhost:8000/stats
curl -X POST http://localhost:8080/transaction
```

## 💡 Tips

- **Terminal Size**: Make your terminal fullscreen for best TUI experience
- **Multiple Terminals**: Use multiple terminals to run services and monitor logs
- **HuggingFace Key**: Add your API key to `.env` for better AI explanations
- **Demo First**: Always run `./demo.sh` to populate data for an impressive view
- **Logs**: Check `logs/` directory if something goes wrong
- **Redis**: Keep Redis running - it's the backbone of real-time updates

## 🎯 Success!

If you've checked all the boxes above, congratulations! 🎉

You now have a fully functional AI-powered fraud detection system running on your machine!

**Enjoy detecting fraud with machine learning!** 🛡️🤖
