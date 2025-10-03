"""
Pre-trained Logistic Regression Fraud Detector
Uses sklearn with realistic fraud patterns
"""
import numpy as np
from typing import Tuple, Dict
import pickle
import os


class PretrainedFraudDetector:
    """Pre-trained logistic regression fraud detector"""
    
    def __init__(self):
        self.name = "pretrained_lr"
        self.model = self._create_pretrained_model()
        
    def _create_pretrained_model(self):
        """Create and train a logistic regression model"""
        try:
            from sklearn.linear_model import LogisticRegression
        except ImportError:
            print("⚠️  scikit-learn not installed, using fallback model")
            return None
        
        # Generate realistic training data
        np.random.seed(42)
        n_normal = 5000
        n_fraud = 2000
        
        # Normal transactions
        X_normal = []
        for _ in range(n_normal):
            amount = np.random.gamma(2, 50)  # Most transactions $50-200
            amount = min(amount, 500)  # Cap at $500
            
            X_normal.append([
                amount,                              # amount
                np.random.randint(0, 24),           # hour_of_day
                np.random.randint(0, 7),            # day_of_week
                np.random.choice([0, 1]),           # is_weekend
                1.0,                                 # transaction_type (purchase)
                amount * np.random.uniform(0.8, 1.2),  # user_avg_amount
                amount * 0.2,                        # user_std_amount
                amount * 1.5,                        # user_max_amount
                amount * 0.5,                        # user_min_amount
                np.random.uniform(0.8, 1.2),        # amount_vs_avg (normal)
                np.random.randint(0, 2),            # txns_last_hour (low)
                np.random.randint(1, 5),            # txns_last_day
                np.random.uniform(1, 12),           # time_since_last_txn
                amount * 0.9,                        # merchant_avg_amount
                amount * 0.15,                       # merchant_std_amount
                np.random.randint(1, 10),           # ip_txn_count
                np.random.randint(1, 3),            # ip_unique_users
                np.random.uniform(0.5, 1.0),        # ip_user_ratio
            ])
        
        # Fraud transactions
        X_fraud = []
        for _ in range(n_fraud):
            # Higher amounts for fraud
            amount = np.random.gamma(4, 150)  # Most fraud $400-1000
            amount = max(amount, 400)  # Minimum $400
            amount = min(amount, 2000)  # Cap at $2000
            
            X_fraud.append([
                amount,                              # amount (HIGH)
                np.random.randint(0, 24),           # hour_of_day
                np.random.randint(0, 7),            # day_of_week
                np.random.choice([0, 1]),           # is_weekend
                np.random.choice([1.0, 2.0]),       # transaction_type
                amount * np.random.uniform(0.2, 0.5),  # user_avg_amount (much lower)
                amount * 0.3,                        # user_std_amount
                amount * 0.6,                        # user_max_amount
                amount * 0.1,                        # user_min_amount
                np.random.uniform(3, 15),           # amount_vs_avg (HIGH deviation)
                np.random.randint(3, 10),           # txns_last_hour (HIGH velocity)
                np.random.randint(5, 20),           # txns_last_day (HIGH)
                np.random.uniform(0.1, 2),          # time_since_last_txn (rapid)
                amount * 0.4,                        # merchant_avg_amount
                amount * 0.4,                        # merchant_std_amount
                np.random.randint(5, 50),           # ip_txn_count (HIGH)
                np.random.randint(3, 10),           # ip_unique_users (suspicious)
                np.random.uniform(0.3, 0.8),        # ip_user_ratio
            ])
        
        # Combine and create labels
        X = np.array(X_normal + X_fraud)
        y = np.array([0] * n_normal + [1] * n_fraud)
        
        # Shuffle
        indices = np.random.permutation(len(X))
        X, y = X[indices], y[indices]
        
        # Train logistic regression
        model = LogisticRegression(
            C=1.0,
            class_weight='balanced',  # Handle class imbalance
            max_iter=1000,
            random_state=42
        )
        model.fit(X, y)
        
        print(f"✅ Pre-trained Logistic Regression model loaded")
        print(f"   Training accuracy: {model.score(X, y):.1%}")
        
        return model
    
    def predict(self, features: list) -> Tuple[float, Dict]:
        """Predict fraud probability for a transaction"""
        if self.model is None:
            # Fallback: simple heuristic
            return self._fallback_predict(features)
        
        amount = features[0]
        user_avg = features[5] if features[5] > 0 else 100  # Default avg
        txns_last_hour = features[10]
        amount_vs_avg = features[9]
        
        # Debug: Print high-value transactions
        if amount > 400:
            print(f"🔍 HIGH VALUE: ${amount:.2f}, user_avg=${user_avg:.2f}, deviation={amount_vs_avg:.2f}x, velocity={txns_last_hour}")
        
        # HYBRID APPROACH: Use rules for edge cases, ML for normal cases
        
        # Rule 1: First transaction or low user history + high amount
        if user_avg > 0 and amount > user_avg * 0.9 and amount > 400:
            # High-value first transaction → apply simple heuristic
            base_risk = min(amount / 1000, 0.8)  # $500 = 50%, $1000 = 100%
            velocity_risk = min(txns_last_hour * 0.1, 0.3)  # Up to 30% extra
            fraud_prob = min(base_risk + velocity_risk, 1.0)
            
            return fraud_prob, {
                'model': 'rule_based_hybrid',
                'reason': 'high_value_low_history',
                'amount': amount,
                'base_risk': base_risk,
                'velocity_risk': velocity_risk
            }
        
        # Rule 2: Very high amount regardless of history
        if amount > 700:
            fraud_prob = 0.85  # 85% risk for $700+ transactions
            return fraud_prob, {
                'model': 'rule_based_hybrid',
                'reason': 'very_high_amount',
                'amount': amount
            }
        
        # Rule 3: High velocity attack
        if txns_last_hour >= 5:
            fraud_prob = 0.75  # 75% risk for 5+ txns/hour
            return fraud_prob, {
                'model': 'rule_based_hybrid',
                'reason': 'velocity_attack',
                'velocity': txns_last_hour
            }
        
        # Default: Use ML model for normal cases
        X = np.array([features])
        ml_fraud_prob = self.model.predict_proba(X)[0][1]
        
        # Boost ML prediction if amount is high (prevent underscoring)
        if amount > 500:
            ml_fraud_prob = min(ml_fraud_prob + 0.3, 1.0)  # +30% boost
        
        fraud_prob = ml_fraud_prob
        
        # Return with feature importance
        return fraud_prob, {
            'model': 'pretrained_lr',
            'ml_prob': ml_fraud_prob,
            'amount': amount,
            'amount_vs_avg': amount_vs_avg
        }
    
    def _fallback_predict(self, features: np.ndarray) -> Tuple[float, dict]:
        """Fallback prediction if sklearn not available"""
        f = features[0]
        amount = f[0]
        amount_vs_avg = f[9] if len(f) > 9 else 1.0
        txns_last_hour = f[10] if len(f) > 10 else 0
        
        # Simple heuristic
        risk = 0.0
        if amount > 400:
            risk += 0.4
        if amount > 700:
            risk += 0.3
        if amount_vs_avg > 3:
            risk += 0.2
        if txns_last_hour > 3:
            risk += 0.1
        
        risk = min(risk, 1.0)
        
        importance = {
            'amount': amount / 1000.0,
            'amount_vs_avg': amount_vs_avg / 10.0,
            'txns_last_hour': txns_last_hour / 10.0
        }
        
        return float(risk), importance
    
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
