"""
PostgreSQL Database Configuration
"""
from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL - use environment variable or default to local PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/fraud_detection"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=False)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


class TransactionDB(Base):
    """Transaction table model"""
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    amount = Column(Float)
    transaction_type = Column(String)
    merchant_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Fraud detection results
    fraud_probability = Column(Float)
    risk_level = Column(String, index=True)
    is_fraud = Column(Boolean, index=True)
    model_used = Column(String)
    
    # AI analysis
    ai_explanation = Column(String, nullable=True)
    risk_factors = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Features (stored as JSON)
    features = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
