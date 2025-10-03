from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    """Transaction types"""
    PAYMENT = "payment"
    TRANSFER = "transfer"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"
    REFUND = "refund"


class Transaction(BaseModel):
    """Transaction model"""
    transaction_id: str
    user_id: str
    amount: float
    currency: str = "USD"
    transaction_type: TransactionType
    merchant_id: Optional[str] = None
    merchant_category: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None


class FraudScore(BaseModel):
    """Fraud detection result"""
    transaction_id: str
    fraud_probability: float
    risk_level: str  # low, medium, high, critical
    is_fraud: bool
    features: Dict[str, float]
    model_used: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FraudExplanation(BaseModel):
    """AI-generated explanation for fraud detection"""
    transaction_id: str
    fraud_score: float
    risk_level: str
    explanation: str
    risk_factors: List[str]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    redis_connected: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Stats(BaseModel):
    """System statistics"""
    total_transactions: int
    fraud_detected: int
    fraud_rate: float
    avg_risk_score: float
    model_type: str
    uptime_seconds: float
