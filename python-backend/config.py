import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "Fraud Detection API"
    debug: bool = False
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_stream_name: str = "transactions"
    redis_results_stream: str = "fraud_results"
    
    # ML Model Configuration
    model_type: str = "xgboost"  # xgboost, lightgbm, or pytorch
    fraud_threshold: float = 0.7
    model_path: str = "./models"
    
    # HuggingFace Configuration
    huggingface_api_key: str = ""
    huggingface_model: str = "gpt-oss-20b"
    huggingface_api_url: str = "https://api-inference.huggingface.co/models"
    
    # Feature Configuration
    feature_window: int = 100  # Number of recent transactions to consider
    
    class Config:
        env_file = "../.env"
        case_sensitive = False


@lru_cache()
def get_settings():
    """Get cached settings instance"""
    return Settings()
