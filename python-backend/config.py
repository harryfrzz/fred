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
    fraud_threshold: float = 0.35  # Lowered to 35% for better detection
    model_path: str = "./models"
    
    # AI Reasoning Configuration
    enable_ai_reasoning: bool = True  # Toggle for AI-powered fraud reasoning
    ai_reasoning_mode: str = "demo"  # Options: "demo", "ollama", "huggingface"
    
    # Ollama Configuration (for local AI)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "gemma2:2b"  # Using Gemma 2B for efficiency
    
    # HuggingFace Configuration (deprecated - use Ollama instead)
    huggingface_api_key: str = ""
    huggingface_model: str = "gpt-oss-20b"
    huggingface_api_url: str = "https://api-inference.huggingface.co/models"
    
    # Feature Configuration
    feature_window: int = 100  # Number of recent transactions to consider
    
    class Config:
        env_file = "../.env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env file
        protected_namespaces = ()  # Allow model_ prefix fields


@lru_cache()
def get_settings():
    """Get cached settings instance"""
    return Settings()
