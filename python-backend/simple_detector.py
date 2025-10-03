"""
Simple Neural Network Fraud Detector
Replaces XGBoost with a more predictable fraud detection model
"""
import numpy as np
from typing import Tuple, Dict


class SimpleFraudDetector:
    """Simple rule-weighted fraud detector with clear thresholds"""
    
    def __init__(self):
        self.name = "simple_nn"
        # Feature weights (manually tuned for fraud detection)
        self.weights = {
            'amount': 0.35,           # High weight for transaction amount
            'amount_vs_avg': 0.25,    # Deviation from user average
            'txns_last_hour': 0.15,   # Velocity
            'transaction_type': 0.10, # Transaction type risk
            'merchant_category_risk': 0.15  # Merchant risk (if available)
        }
    
    def predict(self, features: np.ndarray) -> Tuple[float, dict]:
        """
        Predict fraud probability using weighted features
        
        Features order (must match feature_extractor):
        0: amount
        1: hour_of_day
        2: day_of_week
        3: is_weekend
        4: transaction_type
        5: user_avg_amount
        6: user_std_amount
        7: user_max_amount
        8: user_min_amount
        9: amount_vs_avg
        10: txns_last_hour
        11: txns_last_day
        12: time_since_last_txn
        13: merchant_avg_amount
        14: merchant_std_amount
        15: ip_txn_count
        16: ip_unique_users
        17: ip_user_ratio
        """
        if features.ndim == 1:
            features = features.reshape(1, -1)
        
        f = features[0]
        
        # Extract key features
        amount = f[0]
        amount_vs_avg = f[9] if len(f) > 9 else 1.0
        txns_last_hour = f[10] if len(f) > 10 else 0
        transaction_type = f[4] if len(f) > 4 else 0
        
        # Calculate risk scores for each component
        risk_scores = {}
        
        # 1. Amount-based risk (0-1 scale)
        # Low risk: $0-150, Medium: $150-400, High: $400+
        if amount < 150:
            amount_risk = amount / 300.0  # 0 to 0.5
        elif amount < 400:
            amount_risk = 0.5 + (amount - 150) / 500.0  # 0.5 to 0.75
        else:
            amount_risk = 0.75 + min((amount - 400) / 1200.0, 0.25)  # 0.75 to 1.0
        risk_scores['amount_risk'] = amount_risk
        
        # 2. Deviation from average (amount_vs_avg)
        if amount_vs_avg < 2:
            deviation_risk = 0.1
        elif amount_vs_avg < 5:
            deviation_risk = 0.3 + (amount_vs_avg - 2) * 0.1
        elif amount_vs_avg < 10:
            deviation_risk = 0.6 + (amount_vs_avg - 5) * 0.05
        else:
            deviation_risk = min(0.85 + (amount_vs_avg - 10) * 0.01, 1.0)
        risk_scores['deviation_risk'] = deviation_risk
        
        # 3. Velocity risk (transactions per hour)
        if txns_last_hour == 0:
            velocity_risk = 0.0
        elif txns_last_hour <= 2:
            velocity_risk = 0.2
        elif txns_last_hour <= 5:
            velocity_risk = 0.5 + (txns_last_hour - 2) * 0.1
        else:
            velocity_risk = min(0.8 + (txns_last_hour - 5) * 0.05, 1.0)
        risk_scores['velocity_risk'] = velocity_risk
        
        # 4. Transaction type risk
        # transfer=2.0 is higher risk than payment/purchase=1.0
        type_risk = min(transaction_type / 5.0, 0.5)
        risk_scores['type_risk'] = type_risk
        
        # 5. Combined risk score (weighted average)
        fraud_probability = (
            amount_risk * 0.40 +           # 40% weight on amount
            deviation_risk * 0.30 +         # 30% weight on deviation
            velocity_risk * 0.20 +          # 20% weight on velocity
            type_risk * 0.10                # 10% weight on type
        )
        
        # Ensure probability is in [0, 1]
        fraud_probability = max(0.0, min(1.0, fraud_probability))
        
        # Create importance dict
        importance = {
            'amount': amount_risk,
            'amount_vs_avg': deviation_risk,
            'txns_last_hour': velocity_risk,
            'transaction_type': type_risk,
            'combined_score': fraud_probability
        }
        
        return float(fraud_probability), importance
    
    def get_risk_level(self, probability: float) -> str:
        """Convert probability to risk level"""
        if probability < 0.3:
            return "low"
        elif probability < 0.6:
            return "medium"
        elif probability < 0.85:
            return "high"
        else:
            return "critical"
