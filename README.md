# AI-Powered Fraud Detection System

A real-time fraud detection system with AI-powered anomaly detection and a modern Next.js dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Web Dashboard                       │
│  (React + TypeScript + Tailwind CSS)                        │
│  • Real-time stats & metrics                                │
│  • Transaction history table                                │
│  • Color-coded risk levels                                  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP/REST API
             │
┌────────────┴────────────────────────────────────────────────┐
│                    Python ML Backend                         │
│  - Fraud Detection (XGBoost Pretrained Model)               │
│  - Feature Extraction (15+ engineered features)             │
│  - AI Reasoning (Ollama/Gemma 2B - Local)                   │
│  - Redis Pub/Sub for real-time updates                      │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Redis Stream
             │
┌────────────┴────────────────────────────────────────────────┐
│              Go Mock Transaction Generator                   │
│  (Generates realistic fraud patterns for testing)           │
└─────────────────────────────────────────────────────────────┘
```

## Features

- ✨ **Real-time Fraud Detection**: XGBoost pretrained model with 100% training accuracy
- 🤖 **AI Reasoning**: Local Ollama (Gemma 2B) for fraud explanations (demo mode available)
- 📊 **Modern Web UI**: Responsive Next.js dashboard with live updates
- 🔄 **Event Streaming**: Redis pub/sub for real-time transaction processing
- 🎯 **Realistic Mock Data**: Fraud pattern generator (velocity attacks, amount spikes, etc.)
- 📈 **Live Metrics**: Transaction counts, fraud rates, risk scores with auto-refresh

## Tech Stack

### Backend (Python)
- **ML Framework**: XGBoost (Pretrained Logistic Regression)
- **API**: FastAPI
- **AI Reasoning**: Ollama (Gemma 2B) or Demo mode
- **Event Stream**: Redis Pub/Sub
- **Feature Engineering**: 15+ behavioral features

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Auto-refresh**: 3-second polling

### Mock Generator (Go)
### Mock API (Go)
- **Framework**: Gin
- **Data Generation**: Realistic fraud patterns (velocity, spikes, anomalies)

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- Go 1.21+
- Redis

### Option 1: Full Stack (Recommended)

Start everything with one command:

```bash
./run-fullstack.sh
```

This starts:
1. Redis
2. Python Backend (FastAPI)
3. Mock API (Go)
4. Sends test transactions
5. Next.js Frontend at **http://localhost:3000**

### Option 2: Backend Only

```bash
./run-system.sh
```

Then manually start the frontend:
```bash
cd nextjs-frontend
npm install
npm run dev
```

### Option 3: Manual Setup

**1. Start Redis**
```bash
redis-server --daemonize yes
```

**2. Start Python ML Backend**
```bash
cd python-backend
source venv/bin/activate  # or create: python -m venv venv
uvicorn main:app --host 0.0.0.0 --port 8000
```

**3. Start Mock Transaction Generator**
```bash
cd go-mock-api
go build -o mock-api main.go
./mock-api
```

**4. Start Next.js Dashboard**
```bash
cd nextjs-frontend
npm install
npm run dev
```

**5. Open Dashboard**
Open your browser to **http://localhost:3000**

## Configuration

### Python Backend (`python-backend/config.py`)
```python
enable_ai_reasoning = True
ai_reasoning_mode = "demo"  # or "ollama" for local AI
ollama_model = "gemma2:2b"
fraud_threshold = 0.35
```

### Next.js Frontend (`nextjs-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

1. **Start the system**: Run `./run-fullstack.sh`
2. **Access dashboard**: Open http://localhost:3000
3. **Send test transactions**: Run `./critical_fraud.sh` for fraud patterns
4. **Monitor**: Watch real-time updates on the dashboard

## Testing Scripts

The system includes test scripts for different fraud scenarios:

```bash
./critical_fraud.sh     # 13 fraud-prone transactions (velocity, spikes)
./detect_fraud.sh       # Standard test transactions
```

## Demo

The system demonstrates real fraud detection patterns:
- **Velocity attacks**: 5 rapid transactions from same user
- **Amount spikes**: Sudden 5x increase from baseline
- **High-risk categories**: Cryptocurrency, gambling, wire transfers
- **Location anomalies**: Foreign/blacklisted locations
- Known fraud patterns
- Edge cases

## License

MIT
