"""
CRUD operations for PostgreSQL database
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from database import TransactionDB
from models import Transaction, FraudScore


def create_transaction(db: Session, transaction: Transaction, fraud_result: FraudScore, 
                      ai_explanation: Optional[str] = None,
                      risk_factors: Optional[List] = None,
                      recommendations: Optional[List] = None) -> TransactionDB:
    """Create a new transaction record with fraud detection results"""
    db_transaction = TransactionDB(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        amount=transaction.amount,
        transaction_type=transaction.transaction_type,
        merchant_id=transaction.merchant_id,
        timestamp=datetime.fromisoformat(transaction.timestamp.replace('Z', '+00:00')) if isinstance(transaction.timestamp, str) else transaction.timestamp,
        
        # Fraud detection results
        fraud_probability=fraud_result.fraud_probability,
        risk_level=fraud_result.risk_level,
        is_fraud=fraud_result.is_fraud,
        model_used=fraud_result.model_used,
        
        # AI analysis (if available)
        ai_explanation=ai_explanation,
        risk_factors=risk_factors,
        recommendations=recommendations,
        
        # Features
        features=fraud_result.features
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_transaction(db: Session, transaction_id: str) -> Optional[TransactionDB]:
    """Get a single transaction by ID"""
    return db.query(TransactionDB).filter(TransactionDB.transaction_id == transaction_id).first()


def get_recent_transactions(db: Session, limit: int = 100, skip: int = 0) -> List[TransactionDB]:
    """Get recent transactions ordered by timestamp"""
    return db.query(TransactionDB).order_by(desc(TransactionDB.timestamp)).offset(skip).limit(limit).all()


def get_fraud_transactions(db: Session, limit: int = 100) -> List[TransactionDB]:
    """Get transactions flagged as fraud"""
    return db.query(TransactionDB).filter(TransactionDB.is_fraud == True).order_by(desc(TransactionDB.timestamp)).limit(limit).all()


def get_high_risk_transactions(db: Session, limit: int = 100) -> List[TransactionDB]:
    """Get high/critical risk transactions"""
    return db.query(TransactionDB).filter(
        TransactionDB.risk_level.in_(['high', 'critical'])
    ).order_by(desc(TransactionDB.timestamp)).limit(limit).all()


def get_transactions_by_user(db: Session, user_id: str, limit: int = 50) -> List[TransactionDB]:
    """Get transactions for a specific user"""
    return db.query(TransactionDB).filter(TransactionDB.user_id == user_id).order_by(desc(TransactionDB.timestamp)).limit(limit).all()


def get_transactions_by_date_range(db: Session, start_date: datetime, end_date: datetime) -> List[TransactionDB]:
    """Get transactions within a date range"""
    return db.query(TransactionDB).filter(
        TransactionDB.timestamp >= start_date,
        TransactionDB.timestamp <= end_date
    ).order_by(desc(TransactionDB.timestamp)).all()


def get_stats(db: Session) -> dict:
    """Get fraud detection statistics"""
    total = db.query(func.count(TransactionDB.transaction_id)).scalar()
    fraud_count = db.query(func.count(TransactionDB.transaction_id)).filter(TransactionDB.is_fraud == True).scalar()
    avg_risk = db.query(func.avg(TransactionDB.fraud_probability)).scalar()
    
    return {
        "total_transactions": total or 0,
        "fraud_detected": fraud_count or 0,
        "fraud_rate": (fraud_count / total * 100) if total > 0 else 0.0,
        "avg_risk_score": float(avg_risk) if avg_risk else 0.0
    }


def delete_old_transactions(db: Session, days: int = 30) -> int:
    """Delete transactions older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted = db.query(TransactionDB).filter(TransactionDB.created_at < cutoff_date).delete()
    db.commit()
    return deleted


def get_transaction_count(db: Session) -> int:
    """Get total count of transactions"""
    return db.query(func.count(TransactionDB.transaction_id)).scalar()
