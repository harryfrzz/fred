# Architecture Documentation

## System Overview

The AI-Powered Fraud Detection system is a distributed architecture consisting of multiple microservices working together to detect fraudulent transactions in real-time.

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     Go TUI Dashboard                          │
│                  (Bubble Tea Framework)                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │  Real-time  │  │   Charts &   │  │  Transaction    │    │
│  │  Metrics    │  │   Graphs     │  │  Monitoring     │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP/WebSocket
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Python ML Backend (FastAPI)                  │
│                                                               │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  Feature         │  │  ML Models      │  │ AI         │ │
│  │  Extraction      │  │  - XGBoost      │  │ Reasoning  │ │
│  │                  │  │  - LightGBM     │  │ (GPT-OSS)  │ │
│  │  18+ Features    │  │  - PyTorch      │  │            │ │
│  └──────────────────┘  └─────────────────┘  └────────────┘ │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │ Redis Pub/Sub
                            │
                            ▼
                    ┌───────────────┐
                    │     Redis     │
                    │  Event Stream │
                    └───────┬───────┘
                            │
                            │ Pub/Sub
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Go Mock Transaction Generator (Gin)                 │
│                                                               │
│  Generates realistic transactions with:                       │
│  - Normal patterns                                            │
│  - Fraud scenarios (velocity, high amount, etc.)              │
│  - Configurable fraud rate                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Go TUI Dashboard (`go-frontend/`)

**Technology:** Go, Bubble Tea, Bubbles, Lipgloss

**Responsibilities:**
- Display real-time fraud detection metrics
- Show interactive charts and graphs
- Monitor transaction flow
- Display risk levels and alerts

**Key Features:**
- Real-time updates via Redis pub/sub
- Beautiful terminal UI with colors and styling
- Multiple chart types (bar, line, gauge, sparkline)
- Responsive layout

**Files:**
- `main.go` - Main TUI application logic
- `charts.go` - Chart rendering functions

### 2. Python ML Backend (`python-backend/`)

**Technology:** FastAPI, XGBoost, LightGBM, PyTorch, HuggingFace

**Responsibilities:**
- Feature extraction from transactions
- Fraud prediction using ML models
- AI-powered explanations for fraud decisions
- Statistics tracking

**Key Features:**
- Multiple ML model support (XGBoost, LightGBM, PyTorch Autoencoder)
- 18+ engineered features per transaction
- Real-time predictions via REST API
- Integration with HuggingFace for AI reasoning

**Files:**
- `main.py` - FastAPI application
- `fraud_detector.py` - ML model management
- `feature_extractor.py` - Feature engineering
- `ai_reasoner.py` - AI explanation generation
- `models.py` - Data models (Pydantic)
- `config.py` - Configuration management

### 3. Go Mock Transaction Generator (`go-mock-api/`)

**Technology:** Go, Gin Framework

**Responsibilities:**
- Generate realistic transaction data
- Simulate various fraud patterns
- Publish transactions to Redis
- Provide HTTP API for transaction generation

**Fraud Scenarios:**
1. **High Amount Anomaly** - Unusually large transactions
2. **Velocity Attack** - Rapid successive transactions
3. **Multiple IPs** - Same account from different IPs
4. **Unusual Time** - Transactions at odd hours (2-5 AM)
5. **Account Takeover** - Different device and location

**Files:**
- `main.go` - Gin server and transaction generation

### 4. Redis Event Streaming

**Purpose:** Real-time event distribution between services

**Channels:**
- `transactions` - New transaction events
- `fraud_results` - Fraud detection results
- `fraud_explanations` - AI explanations

## Data Flow

### Transaction Processing Flow

1. **Transaction Generation**
   ```
   Mock API generates transaction
   ↓
   Publishes to Redis 'transactions' channel
   ```

2. **Fraud Detection**
   ```
   Python backend receives transaction
   ↓
   Extract features (18+ features)
   ↓
   ML model prediction (XGBoost/LightGBM/PyTorch)
   ↓
   Risk scoring and classification
   ↓
   Publish results to Redis 'fraud_results' channel
   ```

3. **AI Reasoning** (for high-risk transactions)
   ```
   High-risk transaction detected (>50% probability)
   ↓
   Generate prompt with transaction details
   ↓
   Call HuggingFace API (GPT-OSS-20B)
   ↓
   Receive human-readable explanation
   ↓
   Publish to Redis 'fraud_explanations' channel
   ```

4. **Dashboard Display**
   ```
   Frontend subscribes to all Redis channels
   ↓
   Receives real-time updates
   ↓
   Updates charts and metrics
   ↓
   Displays to user
   ```

## Feature Engineering

The system extracts 18+ features from each transaction:

### Basic Features
- `amount` - Transaction amount
- `hour_of_day` - Hour (0-23)
- `day_of_week` - Day (0-6)
- `is_weekend` - Weekend flag
- `transaction_type` - Type encoding

### User-based Features
- `user_avg_amount` - User's average transaction amount
- `user_std_amount` - Standard deviation of amounts
- `user_max_amount` - Maximum amount
- `user_min_amount` - Minimum amount
- `amount_vs_avg` - Current amount vs user average ratio

### Velocity Features
- `txns_last_hour` - Transactions in last hour
- `txns_last_day` - Transactions in last 24 hours
- `time_since_last_txn` - Time since last transaction (hours)

### Merchant Features
- `merchant_avg_amount` - Merchant's average amount
- `merchant_std_amount` - Standard deviation

### IP-based Features
- `ip_txn_count` - Total transactions from IP
- `ip_unique_users` - Number of unique users from IP
- `ip_user_ratio` - User diversity ratio

## ML Models

### 1. XGBoost (Default)
- **Type:** Gradient Boosting
- **Use Case:** General-purpose fraud detection
- **Advantages:** Fast, interpretable, handles imbalanced data well

### 2. LightGBM
- **Type:** Gradient Boosting
- **Use Case:** Large-scale datasets
- **Advantages:** Faster than XGBoost, lower memory usage

### 3. PyTorch Autoencoder
- **Type:** Deep Learning Anomaly Detection
- **Use Case:** Detecting novel fraud patterns
- **Advantages:** Can detect unknown fraud types, unsupervised learning

## Risk Levels

Transactions are classified into 4 risk levels based on fraud probability:

| Risk Level | Probability Range | Action |
|-----------|------------------|--------|
| **LOW** | 0% - 30% | Allow transaction |
| **MEDIUM** | 30% - 60% | Review recommended |
| **HIGH** | 60% - 85% | Hold for verification |
| **CRITICAL** | 85% - 100% | Block immediately |

## API Endpoints

### Python Backend (`http://localhost:8000`)

- `GET /` - Service info
- `GET /health` - Health check
- `GET /stats` - System statistics
- `POST /predict` - Predict fraud for transaction
- `POST /explain` - Get AI explanation

### Mock API (`http://localhost:8080`)

- `GET /health` - Health check
- `GET /stats` - Generator statistics
- `POST /transaction` - Generate single transaction
- `POST /transactions/batch` - Generate batch
- `POST /start-generation` - Start continuous generation

## Configuration

### Environment Variables

```env
# HuggingFace
HUGGINGFACE_API_KEY=your_key

# Redis
REDIS_URL=redis://localhost:6379

# Services
PYTHON_API_URL=http://localhost:8000
MOCK_API_URL=http://localhost:8080

# ML
MODEL_TYPE=xgboost
FRAUD_THRESHOLD=0.7

# Generation
TRANSACTION_RATE=10
FRAUD_RATE=0.15
```

## Performance Considerations

### Throughput
- **Transaction Processing:** ~100-500 TPS (single instance)
- **Model Inference:** <10ms per transaction
- **Feature Extraction:** <5ms per transaction

### Scalability
- Python backend can be horizontally scaled
- Redis handles pub/sub for multiple instances
- Mock API can generate configurable load

### Resource Usage
- **Python Backend:** ~500MB RAM (with models loaded)
- **Go Services:** ~50MB RAM each
- **Redis:** ~100MB RAM

## Monitoring & Observability

### Metrics Tracked
- Total transactions processed
- Fraud detection rate
- Average risk score
- Model performance
- System uptime

### Logs
- Transaction events
- Fraud predictions
- API requests
- Errors and exceptions

## Security Considerations

### Data Privacy
- No PII stored permanently
- In-memory processing only
- Configurable data retention

### API Security
- CORS enabled for development
- Rate limiting recommended for production
- API key authentication for HuggingFace

## Future Enhancements

1. **Additional ML Models**
   - Isolation Forest
   - One-Class SVM
   - Neural networks

2. **More Features**
   - Geolocation analysis
   - Device fingerprinting
   - Transaction graph analysis

3. **Enhanced UI**
   - Web dashboard
   - Mobile notifications
   - Detailed transaction drill-down

4. **Production Features**
   - Model versioning
   - A/B testing
   - Model monitoring
   - Automated retraining
