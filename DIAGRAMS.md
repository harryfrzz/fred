# System Diagrams

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                         👤 USER / DEMO                               │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ Terminal UI
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                   🖥️  GO TUI DASHBOARD (Bubble Tea)                 │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Real-time   │  │   Charts &   │  │ Transaction  │              │
│  │  Statistics  │  │   Graphs     │  │  Alerts      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  Features: Line charts, bar charts, gauges, color-coded alerts      │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ HTTP REST API
                                │ WebSocket (future)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                  🐍 PYTHON ML BACKEND (FastAPI)                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Feature Extraction Engine                                  │    │
│  │  - User behavior patterns                                   │    │
│  │  - Transaction velocity                                     │    │
│  │  - Amount anomalies                                         │    │
│  │  - IP/Device analysis                                       │    │
│  │  - Temporal features                                        │    │
│  │  → 18+ engineered features                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ML Model Ensemble                                          │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   XGBoost    │  │  LightGBM    │  │   PyTorch    │    │    │
│  │  │   Gradient   │  │   Gradient   │  │ Autoencoder  │    │    │
│  │  │   Boosting   │  │   Boosting   │  │   Anomaly    │    │    │
│  │  │              │  │              │  │  Detection   │    │    │
│  │  │  (Default)   │  │   (Fast)     │  │  (Deep)      │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  │                                                              │    │
│  │  → Fraud Probability (0.0 - 1.0)                           │    │
│  │  → Risk Level (Low/Medium/High/Critical)                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  AI Reasoning Engine                                        │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────┐          │    │
│  │  │  HuggingFace API (GPT-OSS-20B)               │          │    │
│  │  │  - Generates human-readable explanations     │          │    │
│  │  │  - Identifies risk factors                   │          │    │
│  │  │  - Provides recommendations                  │          │    │
│  │  │                                                │          │    │
│  │  │  Fallback: Rule-based explanations           │          │    │
│  │  └──────────────────────────────────────────────┘          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Endpoints: /health, /stats, /predict, /explain                     │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ Redis Pub/Sub
                                │ (Real-time Event Streaming)
                                │
                                ▼
                    ┌───────────────────────┐
                    │                       │
                    │   📮 REDIS SERVER     │
                    │                       │
                    │  Channels:            │
                    │  - transactions       │
                    │  - fraud_results      │
                    │  - fraud_explanations │
                    │                       │
                    └───────────┬───────────┘
                                │
                                │ Pub/Sub
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│           🔄 GO MOCK TRANSACTION GENERATOR (Gin)                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Transaction Patterns                                       │    │
│  │                                                              │    │
│  │  ✅ Normal Transactions (85%)                              │    │
│  │  - Typical amounts ($5-$500)                               │    │
│  │  - Regular times                                            │    │
│  │  - Consistent IPs                                           │    │
│  │  - Known devices                                            │    │
│  │                                                              │    │
│  │  🚨 Fraudulent Patterns (15%)                              │    │
│  │  1. High Amount Anomaly ($1000-$5000)                      │    │
│  │  2. Velocity Attack (rapid succession)                     │    │
│  │  3. Multiple IPs (same user, different locations)          │    │
│  │  4. Unusual Time (2-5 AM transactions)                     │    │
│  │  5. Account Takeover (new device + location)               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Configuration:                                                       │
│  - Rate: 10 transactions/second (configurable)                      │
│  - Fraud Rate: 15% (configurable)                                   │
│  - 15 unique users, 10 merchants                                    │
│                                                                       │
│  Endpoints: /health, /stats, /transaction, /transactions/batch,     │
│             /start-generation                                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌──────────────┐
│  Mock API    │  1. Generate Transaction
│              │     (Normal or Fraud Pattern)
└──────┬───────┘
       │
       │ 2. Publish to Redis
       │    Channel: "transactions"
       ▼
┌──────────────┐
│    Redis     │
│   Pub/Sub    │
└──────┬───────┘
       │
       │ 3. Subscribe & Receive
       ▼
┌──────────────┐
│   Python     │  4. Extract Features
│   Backend    │     (18+ features)
│              │
│              │  5. ML Model Prediction
│              │     XGBoost/LightGBM/PyTorch
│              │
│              │  6. Calculate Risk Score
│              │     & Risk Level
└──────┬───────┘
       │
       │ 7. Publish Results
       │    Channel: "fraud_results"
       ▼
┌──────────────┐
│    Redis     │
│   Pub/Sub    │
└──────┬───────┘
       │
       │ 8. Subscribe & Receive
       ▼
┌──────────────┐
│  Frontend    │  9. Update Dashboard
│     TUI      │     - Charts
│              │     - Metrics
│              │     - Alerts
└──────────────┘

       │
       │ (For High-Risk Only)
       │
       ▼
┌──────────────┐
│   Python     │  10. AI Reasoning
│   Backend    │      GPT-OSS-20B
│              │
│              │  11. Generate Explanation
└──────┬───────┘
       │
       │ 12. Publish Explanation
       │     Channel: "fraud_explanations"
       ▼
┌──────────────┐
│    Redis     │
└──────┬───────┘
       │
       │ 13. Display in TUI
       ▼
┌──────────────┐
│  Frontend    │
│     TUI      │
└──────────────┘
```

## 📊 Feature Engineering Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Transaction Input                      │
│                                                           │
│  - transaction_id                                         │
│  - user_id                                                │
│  - amount                                                 │
│  - timestamp                                              │
│  - merchant_id                                            │
│  - ip_address                                             │
│  - device_id                                              │
│  - location                                               │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Feature Extractor                           │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Basic     │  │    User     │  │  Velocity   │
│  Features   │  │  Features   │  │  Features   │
│             │  │             │  │             │
│ • amount    │  │ • avg_amt   │  │ • txns_hr   │
│ • hour      │  │ • std_amt   │  │ • txns_day  │
│ • day       │  │ • max_amt   │  │ • time_diff │
│ • weekend   │  │ • min_amt   │  │             │
│ • type      │  │ • amt_ratio │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
        │                │                │
        │                │                │
        ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Merchant   │  │     IP      │  │   Custom    │
│  Features   │  │  Features   │  │  Features   │
│             │  │             │  │             │
│ • merch_avg │  │ • ip_count  │  │ • is_first  │
│ • merch_std │  │ • unique_u  │  │ • ... more  │
│             │  │ • ip_ratio  │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   18+ Feature Vector Array     │
        │                                │
        │  [0.5, 12, 3, 0, 1, 125.5, ... │
        └────────────────┬───────────────┘
                         │
                         ▼
                ┌────────────────┐
                │   ML Models    │
                │                │
                │  Fraud Score   │
                └────────────────┘
```

## 🎨 TUI Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  🛡️  AI-Powered Fraud Detection Dashboard                         │
├────────────────────────────────────────────────────────────────────┤
│  Last Update: 15:04:23 | Total: 1,523 | Model: xgboost            │
│                                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────┐│
│  │    Total      │ │     Fraud     │ │  Avg Risk     │ │ Uptime ││
│  │ Transactions  │ │   Detected    │ │    Score      │ │        ││
│  │               │ │               │ │               │ │        ││
│  │    1,523      │ │      234      │ │    23.5%      │ │  360s  ││
│  │               │ │   15.4% rate  │ │    [▃▅▇█]     │ │   ●    ││
│  └───────────────┘ └───────────────┘ └───────────────┘ └────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Risk Score Trend (Last 50 Transactions)              │ │
│  │                                                               │ │
│  │  1.0 ┤                        ●                               │ │
│  │      │                   ●    ●                               │ │
│  │  0.8 ┤              ●   ●  ●  ● ●                            │ │
│  │      │         ●   ●  ● ●    ● ●●                            │ │
│  │  0.6 ┤    ●   ●  ● ● ● ●  ●●  ●  ●                          │ │
│  │      │  ● ● ● ● ●● ● ● ●●  ●●●    ●●                        │ │
│  │  0.4 ┤ ●  ●● ●● ● ●  ● ● ●● ● ●●  ●  ●●                     │ │
│  │      │●●● ●  ●  ●● ●●  ●● ●  ● ●●●  ● ●●●                   │ │
│  │  0.2 ┤  ●● ●● ●  ● ●●● ● ●●● ●● ●   ●  ●  ●●               │ │
│  │      │                                                        │ │
│  │  0.0 └────────────────────────────────────────────────────   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────┐ ┌────────────────────────────┐   │
│  │ Transaction Volume by Hour │ │ Fraud Detections by Hour   │   │
│  │                            │ │                            │   │
│  │  14:00  ████████████ 123  │ │  14:00  ████ 12           │   │
│  │  15:00  ███████████████ 156│ │  15:00  ██████ 18         │   │
│  │  16:00  ██████████ 98     │ │  16:00  ███ 9             │   │
│  │  17:00  ████████ 87       │ │  17:00  ██ 7              │   │
│  └────────────────────────────┘ └────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Recent High-Risk Transactions                    │ │
│  │                                                               │ │
│  │  Time      Transaction ID        Risk      Status            │ │
│  │  ────────────────────────────────────────────────────────   │ │
│  │  15:04:23  txn-abc123...        87.3%     🚨 CRITICAL       │ │
│  │  15:04:20  txn-def456...        72.1%     ⚠️  HIGH          │ │
│  │  15:04:18  txn-ghi789...        65.4%     ⚠️  HIGH          │ │
│  │  15:04:15  txn-jkl012...        58.9%     ⚡ MEDIUM         │ │
│  │  15:04:12  txn-mno345...        54.2%     ⚡ MEDIUM         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Press 'r' to refresh | 'q' to quit                                │
└────────────────────────────────────────────────────────────────────┘
```

## 🔐 Security & Privacy Flow

```
┌─────────────────┐
│   Transaction   │
│      Data       │
└────────┬────────┘
         │
         │ In-Memory Only
         │ No Persistent Storage
         ▼
┌─────────────────┐
│   Processing    │  • Feature extraction
│     Layer       │  • Model inference
│                 │  • Real-time only
└────────┬────────┘
         │
         │ Results Only
         │ No PII Stored
         ▼
┌─────────────────┐
│   Dashboard     │  • Display metrics
│      TUI        │  • Truncated IDs
│                 │  • No raw data
└─────────────────┘

Privacy Features:
✅ No database persistence
✅ In-memory processing
✅ Configurable data retention
✅ PII anonymization ready
✅ Secure API communication
```

## 📈 Performance Characteristics

```
Component              Latency    Throughput    Memory
─────────────────────────────────────────────────────────
Feature Extraction     < 5ms      500 TPS       50 MB
ML Inference (XGB)     < 10ms     200 TPS       300 MB
ML Inference (LGBM)    < 8ms      250 TPS       250 MB
ML Inference (PyTorch) < 15ms     100 TPS       500 MB
AI Reasoning (GPT)     1-3s       10 RPS        -
Redis Pub/Sub          < 2ms      10K msg/s     100 MB
Go TUI                 < 16ms     60 FPS        50 MB
Mock API               < 5ms      1K TPS        50 MB
─────────────────────────────────────────────────────────
Total System          < 50ms      100+ TPS      ~1 GB
```

## 🎯 Risk Score Classification

```
┌──────────────────────────────────────────────────────┐
│                Risk Score Scale                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  0%                    50%                   100%    │
│  │──────────────────────│──────────────────────│    │
│  │          │           │           │          │    │
│  │   LOW    │  MEDIUM   │   HIGH    │ CRITICAL │    │
│  │          │           │           │          │    │
│  │  0-30%   │  30-60%   │  60-85%   │  85-100% │    │
│  │          │           │           │          │    │
│  │    ✓     │     ⚡    │     ⚠️     │    🚨    │    │
│  │  Allow   │  Review   │   Hold    │   Block  │    │
│                                                       │
└──────────────────────────────────────────────────────┘

Actions by Risk Level:
┌──────────┬─────────────────────────────────────────┐
│   LOW    │ ✅ Allow transaction                    │
│          │ ✅ Standard monitoring                  │
└──────────┴─────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────┐
│  MEDIUM  │ ⚡ Manual review recommended            │
│          │ ⚡ Consider step-up auth                │
│          │ ⚡ Enhanced monitoring                   │
└──────────┴─────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────┐
│   HIGH   │ ⚠️  Hold transaction                    │
│          │ ⚠️  Require additional verification     │
│          │ ⚠️  Flag account for review             │
└──────────┴─────────────────────────────────────────┘
┌──────────┬─────────────────────────────────────────┐
│ CRITICAL │ 🚨 Block transaction immediately        │
│          │ 🚨 Alert fraud team                     │
│          │ 🚨 Notify user                          │
│          │ 🚨 Conduct investigation                │
└──────────┴─────────────────────────────────────────┘
```
