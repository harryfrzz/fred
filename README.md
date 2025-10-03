# AI-Powered Fraud Risk Score for APIs

A real-time fraud detection system with AI-powered anomaly detection and a beautiful TUI dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Go TUI Dashboard                         │
│  (Bubble Tea + Lipgloss + Charts & Graphs)                  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ WebSocket/HTTP
             │
┌────────────┴────────────────────────────────────────────────┐
│                    Python ML Backend                         │
│  - Fraud Detection (XGBoost/LightGBM/PyTorch)               │
│  - Feature Extraction                                        │
│  - GPT-OSS-20B Reasoning (HuggingFace)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Redis Stream
             │
┌────────────┴────────────────────────────────────────────────┐
│              Go Mock Transaction Generator                   │
│  (Gin Framework - Generates realistic API calls)            │
└─────────────────────────────────────────────────────────────┘
```

## Features

- ✨ **Real-time Fraud Detection**: XGBoost/LightGBM models for instant anomaly detection
- 🤖 **AI Reasoning**: GPT-OSS-20B provides human-readable explanations for fraud flags
- 📊 **Beautiful TUI**: Professional terminal interface with live charts and metrics
- 🔄 **Event Streaming**: Redis-based real-time transaction processing
- 🎯 **Mock Data**: Realistic transaction generator for demos
- 📈 **Live Metrics**: API call counts, fraud rates, risk scores, and more

## Tech Stack

### Backend (Python)
- **ML Framework**: XGBoost, LightGBM, PyTorch
- **API**: FastAPI
- **AI Reasoning**: HuggingFace Hub (GPT-OSS-20B)
- **Event Stream**: Redis

### Frontend (Go)
- **TUI Framework**: Bubble Tea, Bubbles, Lipgloss
- **Charts**: Custom ASCII/Unicode charts
- **HTTP Client**: Go standard library

### Mock Generator (Go)
- **Framework**: Gin
- **Data Generation**: Realistic transaction patterns

## Quick Start

### Prerequisites
- Python 3.9+
- Go 1.21+
- Redis
- Docker (optional)

### Using Docker Compose (Recommended)

```bash
docker-compose up
```

### Manual Setup

1. **Start Redis**
```bash
redis-server
```

2. **Start Python ML Backend**
```bash
cd python-backend
pip install -r requirements.txt
python main.py
```

3. **Start Mock Transaction Generator**
```bash
cd go-mock-api
go mod download
go run main.go
```

4. **Start TUI Dashboard**
```bash
cd go-frontend
go mod download
go run main.go
```

## Configuration

Create `.env` file:
```env
HUGGINGFACE_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
PYTHON_API_URL=http://localhost:8000
MOCK_API_URL=http://localhost:8080
```

## Usage

1. Start all services
2. The TUI dashboard will automatically connect and display live metrics
3. Mock transactions are generated automatically
4. Press 'q' to quit the dashboard

## Demo

The system includes pre-configured demo scenarios:
- Normal transactions
- Suspicious patterns (velocity attacks, amount anomalies)
- Known fraud patterns
- Edge cases

## License

MIT
