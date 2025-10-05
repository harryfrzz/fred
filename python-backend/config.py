import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings"""

    # API Configuration
    app_name: str = "Fraud Detection API"
    debug: bool = False

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_stream_name: str = "transactions"
    redis_results_stream: str = "fraud_results"

    # ML Model Configuration
    model_type: str = "pretrained_lr"  # pretrained_lr (Logistic Regression)
    model_path: str = "./models"
    fraud_threshold: float = 0.35  # Lowered to 35% for better detection

    # AI Reasoning Configuration
    enable_ai_reasoning: bool = True  # Toggle for AI-powered fraud reasoning
    ai_reasoning_mode: str = "demo"  # Options: "demo", "ollama", "huggingface"

    # Ollama Configuration (for local AI)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "gemma3:4b"  # Using Gemma 7B for efficiency

    # Feature Extraction Configuration
    feature_window: int = 1000  # Number of recent transactions to keep for features

    # Database Configuration (PostgreSQL)
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fraud_detection"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env file
        protected_namespaces = ()  # Allow model_ prefix fields


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
