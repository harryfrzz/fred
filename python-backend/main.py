from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as redis
import json
import time
import asyncio
from datetime import datetime
from typing import Optional

from config import get_settings
from models import Transaction, FraudScore, FraudExplanation, HealthCheck, Stats
from feature_extractor import FeatureExtractor
from pretrained_detector import PretrainedFraudDetector  # Using pretrained LR model
from ai_reasoner import AIReasoner


# Global state
settings = get_settings()
feature_extractor = None
fraud_detector = None
ai_reasoner = None
redis_client = None
stats = {
    "total_transactions": 0,
    "fraud_detected": 0,
    "total_risk_score": 0.0,
    "start_time": time.time()
}

# Store recent fraud results for frontend (max 500)
recent_fraud_results = []
MAX_RECENT_RESULTS = 500


async def process_transactions_from_redis():
    """Background task to process transactions from Redis pub/sub"""
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("transactions")
    print("🎧 Listening for transactions on Redis channel 'transactions'...")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    # Parse transaction
                    txn_data = json.loads(message["data"])
                    transaction = Transaction(**txn_data)
                    
                    # Extract features
                    features_dict = feature_extractor.extract_features(transaction)
                    features_array = feature_extractor.features_to_array(features_dict)
                    
                    # Predict fraud
                    fraud_prob, importance = fraud_detector.predict(features_array)
                    risk_level = fraud_detector.get_risk_level(fraud_prob)
                    is_fraud = fraud_prob >= settings.fraud_threshold
                    
                    # Create fraud score with ALL transaction details
                    fraud_score = FraudScore(
                        transaction_id=transaction.transaction_id,
                        fraud_probability=fraud_prob,
                        risk_level=risk_level,
                        is_fraud=is_fraud,
                        features=features_dict,
                        model_used=settings.model_type
                    )
                    
                    # Update stats
                    stats["total_transactions"] += 1
                    stats["total_risk_score"] += float(fraud_prob)
                    if is_fraud:
                        stats["fraud_detected"] += 1
                    
                    # Publish COMPLETE fraud result to Redis (includes all transaction data)
                    # Convert all values to native Python types for JSON serialization
                    fraud_result_with_txn = {
                        "transaction_id": transaction.transaction_id,
                        "user_id": transaction.user_id,
                        "amount": float(transaction.amount),
                        "transaction_type": transaction.transaction_type,
                        "merchant_id": transaction.merchant_id,
                        "timestamp": transaction.timestamp.isoformat(),
                        "fraud_probability": float(fraud_prob),
                        "risk_level": str(risk_level),
                        "is_fraud": bool(is_fraud),
                        "features": {k: float(v) for k, v in features_dict.items()},
                        "model_used": str(settings.model_type)
                    }
                    
                    # Generate AI explanation if enabled and fraud risk is high
                    if settings.enable_ai_reasoning and (is_fraud or fraud_prob >= 0.5):
                        try:
                            explanation = await ai_reasoner.explain_fraud(
                                transaction_id=transaction.transaction_id,
                                fraud_score=float(fraud_prob),
                                risk_level=str(risk_level),
                                features=features_dict,
                                feature_importance=importance
                            )
                            if explanation:
                                fraud_result_with_txn["ai_explanation"] = explanation.get("explanation", "")
                                fraud_result_with_txn["risk_factors"] = explanation.get("risk_factors", [])
                                fraud_result_with_txn["recommendations"] = explanation.get("recommendations", [])
                        except Exception as e:
                            print(f"⚠️  AI explanation error: {e}")
                    
                    # Store in memory for /recent endpoint
                    recent_fraud_results.append(fraud_result_with_txn)
                    if len(recent_fraud_results) > MAX_RECENT_RESULTS:
                        recent_fraud_results.pop(0)  # Remove oldest
                    
                    await redis_client.publish(
                        settings.redis_results_stream,
                        json.dumps(fraud_result_with_txn)
                    )
                    
                    print(f"✅ Processed txn {transaction.transaction_id[:8]}... - Risk: {fraud_prob:.2f} ({risk_level})")
                    
                except Exception as e:
                    print(f"❌ Error processing transaction: {e}")
    except asyncio.CancelledError:
        print("🛑 Stopping transaction processing...")
        await pubsub.unsubscribe("transactions")
        await pubsub.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global feature_extractor, fraud_detector, ai_reasoner, redis_client
    
    # Startup
    print("🚀 Starting Fraud Detection API...")
    feature_extractor = FeatureExtractor(window_size=settings.feature_window)
    fraud_detector = PretrainedFraudDetector()  # Using pretrained LR model
    ai_reasoner = AIReasoner()
    
    # Connect to Redis
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    await redis_client.ping()
    print("✅ Connected to Redis")
    
    # Start background task to process transactions from Redis
    processing_task = asyncio.create_task(process_transactions_from_redis())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    processing_task.cancel()
    try:
        await processing_task
    except asyncio.CancelledError:
        pass
    if redis_client:
        await redis_client.close()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "model": settings.model_type,
        "status": "running"
    }


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    try:
        await redis_client.ping()
        redis_connected = True
    except:
        redis_connected = False
    
    return HealthCheck(
        status="healthy" if redis_connected and fraud_detector.model else "degraded",
        model_loaded=fraud_detector.model is not None,
        redis_connected=redis_connected
    )


@app.get("/stats", response_model=Stats)
async def get_stats():
    """Get system statistics - calculated from in-memory recent_fraud_results"""
    # Calculate stats from recent_fraud_results for accuracy across restarts
    total_transactions = len(recent_fraud_results)
    
    if total_transactions > 0:
        fraud_detected = sum(1 for r in recent_fraud_results if r.get("is_fraud", False))
        total_risk_score = sum(r.get("fraud_probability", 0.0) for r in recent_fraud_results)
        fraud_rate = (fraud_detected / total_transactions) * 100
        avg_risk_score = total_risk_score / total_transactions
    else:
        fraud_detected = 0
        fraud_rate = 0.0
        avg_risk_score = 0.0
    
    return Stats(
        total_transactions=total_transactions,
        fraud_detected=fraud_detected,
        fraud_rate=fraud_rate,
        avg_risk_score=avg_risk_score,
        model_type="pretrained_lr",  # Updated model type
        uptime_seconds=time.time() - stats["start_time"]
    )


@app.get("/recent")
async def get_recent_transactions(limit: int = 100):
    """Get recent fraud detection results for frontend initialization"""
    # Return most recent transactions (newest first)
    return {
        "transactions": recent_fraud_results[-limit:] if len(recent_fraud_results) > limit else recent_fraud_results,
        "total": len(recent_fraud_results),
        "limit": limit
    }


@app.post("/predict", response_model=FraudScore)
async def predict_fraud(transaction: Transaction, background_tasks: BackgroundTasks):
    """Predict fraud probability for a transaction"""
    try:
        # Extract features
        features_dict = feature_extractor.extract_features(transaction)
        features_array = feature_extractor.features_to_array(features_dict)
        
        # Predict fraud
        fraud_prob, importance = fraud_detector.predict(features_array)
        risk_level = fraud_detector.get_risk_level(fraud_prob)
        is_fraud = fraud_prob >= settings.fraud_threshold
        
        # Create fraud score
        fraud_score = FraudScore(
            transaction_id=transaction.transaction_id,
            fraud_probability=fraud_prob,
            risk_level=risk_level,
            is_fraud=is_fraud,
            features=features_dict,
            model_used=settings.model_type
        )
        
        # Update stats
        stats["total_transactions"] += 1
        stats["total_risk_score"] += fraud_prob
        if is_fraud:
            stats["fraud_detected"] += 1
        
        # Publish to Redis
        await redis_client.publish(
            settings.redis_results_stream,
            fraud_score.model_dump_json()
        )
        
        # Generate AI explanation in background for high-risk transactions
        if fraud_prob >= 0.5:
            background_tasks.add_task(
                generate_explanation,
                transaction.transaction_id,
                fraud_prob,
                risk_level,
                features_dict,
                importance
            )
        
        return fraud_score
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/explain", response_model=FraudExplanation)
async def explain_fraud_decision(
    transaction_id: str,
    fraud_score: float,
    risk_level: str,
    features: dict,
    importance: dict
):
    """Get AI explanation for fraud detection"""
    try:
        explanation = await ai_reasoner.explain_fraud(
            transaction_id=transaction_id,
            fraud_score=fraud_score,
            risk_level=risk_level,
            features=features,
            feature_importance=importance
        )
        return FraudExplanation(**explanation)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")


async def generate_explanation(
    transaction_id: str,
    fraud_score: float,
    risk_level: str,
    features: dict,
    importance: dict
):
    """Background task to generate AI explanation"""
    try:
        explanation = await ai_reasoner.explain_fraud(
            transaction_id, fraud_score, risk_level, features, importance
        )
        
        # Publish explanation to Redis
        await redis_client.publish(
            "fraud_explanations",
            json.dumps(explanation)
        )
    except Exception as e:
        print(f"Error generating explanation: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
