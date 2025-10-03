import httpx
from typing import Dict, List
from config import get_settings


class AIReasoner:
    """AI-powered reasoning using HuggingFace models"""
    
    def __init__(self):
        self.settings = get_settings()
        self.api_url = f"{self.settings.huggingface_api_url}/{self.settings.huggingface_model}"
        self.headers = {"Authorization": f"Bearer {self.settings.huggingface_api_key}"}
    
    async def explain_fraud(
        self,
        transaction_id: str,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        feature_importance: Dict[str, float]
    ) -> Dict[str, any]:
        """Generate AI explanation for fraud detection"""
        
        # Get top risk factors
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Build prompt for AI model
        prompt = self._build_prompt(
            fraud_score, risk_level, features, sorted_features
        )
        
        # If no API key, return rule-based explanation
        if not self.settings.huggingface_api_key or self.settings.huggingface_api_key == "your_huggingface_api_key_here":
            return self._rule_based_explanation(
                transaction_id, fraud_score, risk_level, features, sorted_features
            )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 200}}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    explanation = result[0]['generated_text'] if isinstance(result, list) else result.get('generated_text', '')
                    
                    return {
                        "transaction_id": transaction_id,
                        "fraud_score": fraud_score,
                        "risk_level": risk_level,
                        "explanation": explanation,
                        "risk_factors": [f"{k}: {v:.3f}" for k, v in sorted_features],
                        "recommendations": self._generate_recommendations(risk_level, sorted_features)
                    }
                else:
                    # Fallback to rule-based
                    return self._rule_based_explanation(
                        transaction_id, fraud_score, risk_level, features, sorted_features
                    )
        
        except Exception as e:
            print(f"AI reasoning error: {e}")
            # Fallback to rule-based explanation
            return self._rule_based_explanation(
                transaction_id, fraud_score, risk_level, features, sorted_features
            )
    
    def _build_prompt(
        self,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        top_features: List[tuple]
    ) -> str:
        """Build prompt for AI model"""
        feature_desc = "\n".join([
            f"- {name}: {value:.3f}" for name, value in top_features
        ])
        
        prompt = f"""You are a fraud detection analyst. Analyze this transaction:

Fraud Risk Score: {fraud_score:.2%}
Risk Level: {risk_level.upper()}

Top Risk Indicators:
{feature_desc}

Transaction Details:
- Amount: ${features.get('amount', 0):.2f}
- Hour: {int(features.get('hour_of_day', 0))}
- Transactions last hour: {int(features.get('txns_last_hour', 0))}
- Amount vs user average: {features.get('amount_vs_avg', 1):.2f}x

Provide a brief explanation of why this transaction is flagged as {risk_level} risk."""
        
        return prompt
    
    def _rule_based_explanation(
        self,
        transaction_id: str,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        top_features: List[tuple]
    ) -> Dict[str, any]:
        """Generate rule-based explanation when AI is unavailable"""
        
        reasons = []
        
        # Analyze key features
        if features.get('amount_vs_avg', 1) > 3:
            reasons.append("Transaction amount significantly exceeds user's typical spending pattern")
        
        if features.get('txns_last_hour', 0) > 5:
            reasons.append(f"High transaction velocity detected ({int(features.get('txns_last_hour', 0))} transactions in the last hour)")
        
        if features.get('ip_unique_users', 0) > 3:
            reasons.append("IP address associated with multiple user accounts")
        
        if features.get('time_since_last_txn', 24) < 0.01:  # < 36 seconds
            reasons.append("Extremely rapid successive transactions detected")
        
        if features.get('hour_of_day', 12) >= 2 and features.get('hour_of_day', 12) <= 5:
            reasons.append("Transaction occurred during unusual hours (2 AM - 5 AM)")
        
        if not reasons:
            reasons.append("Statistical anomaly detected in transaction pattern")
        
        explanation = f"This transaction has been flagged as {risk_level} risk (score: {fraud_score:.2%}). " + \
                     " ".join(reasons[:3])  # Top 3 reasons
        
        return {
            "transaction_id": transaction_id,
            "fraud_score": fraud_score,
            "risk_level": risk_level,
            "explanation": explanation,
            "risk_factors": [f"{k}: {v:.3f}" for k, v in top_features],
            "recommendations": self._generate_recommendations(risk_level, top_features)
        }
    
    def _generate_recommendations(self, risk_level: str, top_features: List[tuple]) -> List[str]:
        """Generate recommendations based on risk level"""
        recommendations = []
        
        if risk_level == "critical":
            recommendations.append("BLOCK: Immediately block this transaction")
            recommendations.append("ALERT: Notify fraud team and user immediately")
            recommendations.append("INVESTIGATE: Conduct thorough account review")
        elif risk_level == "high":
            recommendations.append("HOLD: Place transaction on hold for review")
            recommendations.append("VERIFY: Require additional authentication")
            recommendations.append("MONITOR: Flag account for enhanced monitoring")
        elif risk_level == "medium":
            recommendations.append("REVIEW: Manual review recommended")
            recommendations.append("VERIFY: Consider step-up authentication")
            recommendations.append("MONITOR: Track for pattern analysis")
        else:
            recommendations.append("ALLOW: Transaction appears normal")
            recommendations.append("MONITOR: Continue standard monitoring")
        
        return recommendations
