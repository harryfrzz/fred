import numpy as np
import xgboost as xgb
import lightgbm as lgb
import torch
import torch.nn as nn
from typing import Tuple, Optional
import joblib
import os
from pathlib import Path


class PyTorchAutoencoder(nn.Module):
    """Autoencoder for anomaly detection"""
    
    def __init__(self, input_dim: int, hidden_dims: list = [32, 16, 8]):
        super(PyTorchAutoencoder, self).__init__()
        
        # Encoder
        encoder_layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            encoder_layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_dim)
            ])
            prev_dim = hidden_dim
        self.encoder = nn.Sequential(*encoder_layers)
        
        # Decoder
        decoder_layers = []
        for hidden_dim in reversed(hidden_dims[:-1]):
            decoder_layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_dim)
            ])
            prev_dim = hidden_dim
        decoder_layers.append(nn.Linear(prev_dim, input_dim))
        self.decoder = nn.Sequential(*decoder_layers)
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded
    
    def get_reconstruction_error(self, x):
        """Calculate reconstruction error for anomaly detection"""
        with torch.no_grad():
            reconstructed = self.forward(x)
            error = torch.mean((x - reconstructed) ** 2, dim=1)
        return error.numpy()


class FraudDetector:
    """Fraud detection using multiple ML models"""
    
    def __init__(self, model_type: str = "xgboost", model_path: str = "./models"):
        self.model_type = model_type
        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)
        self.model = None
        self.threshold = None
        
        # Load or create model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize or load the ML model"""
        model_file = self.model_path / f"{self.model_type}_model.pkl"
        
        if model_file.exists():
            print(f"Loading existing {self.model_type} model...")
            if self.model_type == "pytorch":
                self.model = torch.load(model_file)
            else:
                self.model = joblib.load(model_file)
        else:
            print(f"Creating new {self.model_type} model...")
            self._create_pretrained_model()
    
    def _create_pretrained_model(self):
        """Create a pre-trained model with synthetic data"""
        # Generate synthetic training data
        np.random.seed(42)
        n_normal = 5000
        n_fraud = 1000
        n_features = 18
        
        # Normal transactions
        X_normal = np.random.randn(n_normal, n_features)
        X_normal[:, 0] = np.abs(np.random.normal(100, 50, n_normal))  # amount
        y_normal = np.zeros(n_normal)
        
        # Fraudulent transactions (anomalous patterns)
        X_fraud = np.random.randn(n_fraud, n_features)
        X_fraud[:, 0] = np.abs(np.random.normal(500, 200, n_fraud))  # higher amounts
        X_fraud[:, 10] = np.random.uniform(5, 20, n_fraud)  # high velocity
        X_fraud[:, 9] = np.random.uniform(3, 10, n_fraud)  # unusual amount ratio
        y_fraud = np.ones(n_fraud)
        
        # Combine data
        X = np.vstack([X_normal, X_fraud])
        y = np.hstack([y_normal, y_fraud])
        
        # Shuffle
        indices = np.random.permutation(len(X))
        X, y = X[indices], y[indices]
        
        # Train model
        if self.model_type == "xgboost":
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            self.model.fit(X, y)
        
        elif self.model_type == "lightgbm":
            self.model = lgb.LGBMClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            self.model.fit(X, y)
        
        elif self.model_type == "pytorch":
            self.model = PyTorchAutoencoder(input_dim=n_features)
            
            # Train autoencoder on normal data only
            X_normal_tensor = torch.FloatTensor(X_normal)
            optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
            criterion = nn.MSELoss()
            
            self.model.train()
            for epoch in range(50):
                optimizer.zero_grad()
                output = self.model(X_normal_tensor)
                loss = criterion(output, X_normal_tensor)
                loss.backward()
                optimizer.step()
            
            self.model.eval()
            
            # Calculate threshold based on normal data
            errors = self.model.get_reconstruction_error(X_normal_tensor)
            self.threshold = np.percentile(errors, 95)
        
        # Save model
        self._save_model()
    
    def _save_model(self):
        """Save the trained model"""
        model_file = self.model_path / f"{self.model_type}_model.pkl"
        if self.model_type == "pytorch":
            torch.save(self.model, model_file)
            if self.threshold:
                threshold_file = self.model_path / "pytorch_threshold.pkl"
                joblib.dump(self.threshold, threshold_file)
        else:
            joblib.dump(self.model, model_file)
    
    def predict(self, features: np.ndarray) -> Tuple[float, dict]:
        """Predict fraud probability for given features"""
        if features.ndim == 1:
            features = features.reshape(1, -1)
        
        if self.model_type == "xgboost" or self.model_type == "lightgbm":
            # Get probability of fraud
            proba = self.model.predict_proba(features)[0][1]
            
            # Get feature importance
            importance = {}
            if hasattr(self.model, 'feature_importances_'):
                feature_names = [
                    'amount', 'hour_of_day', 'day_of_week', 'is_weekend',
                    'transaction_type', 'user_avg_amount', 'user_std_amount',
                    'user_max_amount', 'user_min_amount', 'amount_vs_avg',
                    'txns_last_hour', 'txns_last_day', 'time_since_last_txn',
                    'merchant_avg_amount', 'merchant_std_amount',
                    'ip_txn_count', 'ip_unique_users', 'ip_user_ratio'
                ]
                for name, imp in zip(feature_names, self.model.feature_importances_):
                    importance[name] = float(imp)
        
        elif self.model_type == "pytorch":
            # Autoencoder: higher reconstruction error = more anomalous
            features_tensor = torch.FloatTensor(features)
            error = self.model.get_reconstruction_error(features_tensor)[0]
            
            # Normalize error to probability
            if self.threshold is None:
                self.threshold = 1.0
            proba = min(error / self.threshold, 1.0)
            
            # Feature importance based on reconstruction error per feature
            with torch.no_grad():
                reconstructed = self.model(features_tensor)
                feature_errors = torch.abs(features_tensor - reconstructed).squeeze()
                
            feature_names = [
                'amount', 'hour_of_day', 'day_of_week', 'is_weekend',
                'transaction_type', 'user_avg_amount', 'user_std_amount',
                'user_max_amount', 'user_min_amount', 'amount_vs_avg',
                'txns_last_hour', 'txns_last_day', 'time_since_last_txn',
                'merchant_avg_amount', 'merchant_std_amount',
                'ip_txn_count', 'ip_unique_users', 'ip_user_ratio'
            ]
            importance = {name: float(err) for name, err in zip(feature_names, feature_errors)}
        
        return float(proba), importance
    
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
