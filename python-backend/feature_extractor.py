import numpy as np
import pandas as pd
from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict
from models import Transaction


class FeatureExtractor:
    """Extract features from transactions for ML models"""
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.user_history = defaultdict(list)
        self.merchant_history = defaultdict(list)
        self.ip_history = defaultdict(list)
        
    def extract_features(self, transaction: Transaction) -> Dict[str, float]:
        """Extract features from a transaction"""
        features = {}
        
        # Basic transaction features
        features['amount'] = transaction.amount
        features['hour_of_day'] = transaction.timestamp.hour
        features['day_of_week'] = transaction.timestamp.weekday()
        features['is_weekend'] = 1.0 if transaction.timestamp.weekday() >= 5 else 0.0
        
        # Transaction type encoding
        type_encoding = {
            'payment': 1.0,
            'transfer': 2.0,
            'withdrawal': 3.0,
            'deposit': 4.0,
            'refund': 5.0
        }
        features['transaction_type'] = type_encoding.get(transaction.transaction_type, 0.0)
        
        # User-based features
        user_txns = self.user_history[transaction.user_id]
        if user_txns:
            amounts = [t.amount for t in user_txns[-self.window_size:]]
            features['user_avg_amount'] = np.mean(amounts)
            features['user_std_amount'] = np.std(amounts) if len(amounts) > 1 else 0.0
            features['user_max_amount'] = np.max(amounts)
            features['user_min_amount'] = np.min(amounts)
            features['amount_vs_avg'] = transaction.amount / (features['user_avg_amount'] + 1e-6)
            
            # Transaction velocity
            recent_txns = [t for t in user_txns if 
                          (transaction.timestamp - t.timestamp).total_seconds() < 3600]
            features['txns_last_hour'] = len(recent_txns)
            
            recent_txns_day = [t for t in user_txns if 
                              (transaction.timestamp - t.timestamp).total_seconds() < 86400]
            features['txns_last_day'] = len(recent_txns_day)
            
            # Time since last transaction
            if user_txns:
                time_diff = (transaction.timestamp - user_txns[-1].timestamp).total_seconds()
                features['time_since_last_txn'] = time_diff / 3600.0  # in hours
            else:
                features['time_since_last_txn'] = 24.0
        else:
            # First transaction for user
            features['user_avg_amount'] = transaction.amount
            features['user_std_amount'] = 0.0
            features['user_max_amount'] = transaction.amount
            features['user_min_amount'] = transaction.amount
            features['amount_vs_avg'] = 1.0
            features['txns_last_hour'] = 0
            features['txns_last_day'] = 0
            features['time_since_last_txn'] = 24.0
            features['is_first_transaction'] = 1.0
        
        # Merchant-based features
        if transaction.merchant_id:
            merchant_txns = self.merchant_history[transaction.merchant_id]
            if merchant_txns:
                amounts = [t.amount for t in merchant_txns[-self.window_size:]]
                features['merchant_avg_amount'] = np.mean(amounts)
                features['merchant_std_amount'] = np.std(amounts) if len(amounts) > 1 else 0.0
            else:
                features['merchant_avg_amount'] = transaction.amount
                features['merchant_std_amount'] = 0.0
        else:
            features['merchant_avg_amount'] = 0.0
            features['merchant_std_amount'] = 0.0
        
        # IP-based features
        if transaction.ip_address:
            ip_txns = self.ip_history[transaction.ip_address]
            features['ip_txn_count'] = len(ip_txns)
            
            # Check for IP used by multiple users
            unique_users = len(set(t.user_id for t in ip_txns))
            features['ip_unique_users'] = unique_users
            features['ip_user_ratio'] = unique_users / (len(ip_txns) + 1)
        else:
            features['ip_txn_count'] = 0
            features['ip_unique_users'] = 0
            features['ip_user_ratio'] = 0.0
        
        # Update history
        self.user_history[transaction.user_id].append(transaction)
        if transaction.merchant_id:
            self.merchant_history[transaction.merchant_id].append(transaction)
        if transaction.ip_address:
            self.ip_history[transaction.ip_address].append(transaction)
        
        # Trim history to window size
        self.user_history[transaction.user_id] = \
            self.user_history[transaction.user_id][-self.window_size:]
        
        return features
    
    def get_feature_names(self) -> List[str]:
        """Get ordered list of feature names"""
        return [
            'amount', 'hour_of_day', 'day_of_week', 'is_weekend',
            'transaction_type', 'user_avg_amount', 'user_std_amount',
            'user_max_amount', 'user_min_amount', 'amount_vs_avg',
            'txns_last_hour', 'txns_last_day', 'time_since_last_txn',
            'merchant_avg_amount', 'merchant_std_amount',
            'ip_txn_count', 'ip_unique_users', 'ip_user_ratio'
        ]
    
    def features_to_array(self, features: Dict[str, float]) -> np.ndarray:
        """Convert feature dict to numpy array in correct order"""
        feature_names = self.get_feature_names()
        return np.array([features.get(name, 0.0) for name in feature_names])
