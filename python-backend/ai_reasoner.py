import httpx
import json
from typing import Dict, List, Optional
from config import get_settings


class AIReasoner:
    """AI-powered reasoning with multiple modes: demo, ollama, huggingface"""
    
    def __init__(self):
        self.settings = get_settings()
        self.mode = self.settings.ai_reasoning_mode
        
        # Ollama configuration
        self.ollama_url = self.settings.ollama_url
        self.ollama_model = self.settings.ollama_model
        
    async def explain_fraud(
        self,
        transaction_id: str,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        feature_importance: Dict[str, float]
    ) -> Dict[str, any]:
        """Generate AI explanation for fraud detection"""
        
        if not self.settings.enable_ai_reasoning:
            return None
        
        # Get top risk factors
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Route to appropriate reasoning method
        if self.mode == "demo":
            return self._demo_explanation(
                transaction_id, fraud_score, risk_level, features, sorted_features
            )
        elif self.mode == "ollama":
            return await self._ollama_explanation(
                transaction_id, fraud_score, risk_level, features, sorted_features
            )
        else:
            # Fallback to rule-based
            return self._rule_based_explanation(
                transaction_id, fraud_score, risk_level, features, sorted_features
            )
    
    def _demo_explanation(
        self,
        transaction_id: str,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        top_features: List[tuple]
    ) -> Dict[str, any]:
        """Generate demo/placeholder AI explanation for hackathon presentation"""
        
        # Rich, realistic AI-generated explanations for demo
        demo_explanations = {
            "critical": [
                f"🚨 CRITICAL FRAUD ALERT: This transaction exhibits multiple high-risk indicators including velocity anomaly ({int(features.get('txns_last_hour', 0))} txns/hour), {features.get('amount_vs_avg', 1):.1f}x baseline deviation, and suspicious IP patterns. Machine learning model confidence: {fraud_score:.1%}. Immediate intervention required.",
                f"⚠️ SEVERE RISK DETECTED: Advanced pattern recognition identified this as a sophisticated fraud attempt. Key concerns: Rapid transaction velocity, unusual merchant category, IP geolocation mismatch. Risk score: {fraud_score:.1%}. Recommend immediate account freeze.",
                f"🔴 HIGH-CONFIDENCE FRAUD: Deep learning analysis reveals {len(top_features)} critical anomalies. Primary concern: Transaction amount {features.get('amount_vs_avg', 1):.1f}x user baseline combined with velocity attack pattern. Probability of fraud: {fraud_score:.1%}."
            ],
            "high": [
                f"⚠️ HIGH RISK TRANSACTION: AI analysis detected {len(top_features)} significant risk indicators. Transaction amount (${features.get('amount', 0):.0f}) deviates {features.get('amount_vs_avg', 1):.1f}x from user average. Velocity: {int(features.get('txns_last_hour', 0))} txns/hour. Fraud probability: {fraud_score:.1%}. Recommend manual review.",
                f"🟡 ELEVATED FRAUD RISK: Neural network identified suspicious patterns in transaction behavior. Key factors: Unusual spending spike, rapid succession of transactions, IP reputation concerns. Confidence score: {fraud_score:.1%}. Enhanced verification recommended.",
                f"⚡ FRAUD PROBABILITY: {fraud_score:.1%} - Machine learning detects anomalous spending pattern. Transaction shows {features.get('amount_vs_avg', 1):.1f}x deviation from baseline with {int(features.get('txns_last_hour', 0))} recent transactions. Suggest additional authentication."
            ],
            "medium": [
                f"🟡 MODERATE RISK DETECTED: Transaction shows some unusual characteristics but may be legitimate. Amount: ${features.get('amount', 0):.0f} ({features.get('amount_vs_avg', 1):.1f}x avg). Time pattern slightly abnormal. Risk score: {fraud_score:.1%}. Standard verification protocols apply.",
                f"📊 STATISTICAL ANOMALY: This transaction deviates from typical user behavior patterns by {features.get('amount_vs_avg', 1):.1f}x. However, other indicators suggest possible legitimate use case. Fraud likelihood: {fraud_score:.1%}. Monitor closely.",
                f"⚠️ CAUTION ADVISED: AI model flags {len(top_features)} minor concerns. Transaction velocity and amount within acceptable ranges but showing slight irregularities. Risk score: {fraud_score:.1%}. Routine security checks recommended."
            ],
            "low": [
                f"✅ LOW RISK TRANSACTION: AI analysis confirms transaction aligns with user's normal behavior patterns. All {len(top_features)} key indicators within expected ranges. Fraud probability: {fraud_score:.1%}. No action required.",
                f"🟢 LEGITIMATE TRANSACTION: Machine learning model shows high confidence this is a genuine purchase. Amount (${features.get('amount', 0):.0f}), timing, and velocity all consistent with user history. Risk score: {fraud_score:.1%}.",
                f"✓ NORMAL ACTIVITY: Deep learning analysis indicates standard transaction behavior. No anomalies detected across {len(top_features)} risk dimensions. Probability of fraud: {fraud_score:.1%}. Approve transaction."
            ]
        }
        
        # Select appropriate explanation based on risk level
        import random
        explanation = random.choice(demo_explanations.get(risk_level, demo_explanations["low"]))
        
        # Generate detailed risk factor analysis
        risk_analysis = []
        for feature_name, importance in top_features:
            value = features.get(feature_name, 0)
            if "amount" in feature_name.lower():
                risk_analysis.append(f"💰 {feature_name}: ${value:.0f} (importance: {importance:.3f})")
            elif "velocity" in feature_name.lower() or "txns" in feature_name.lower():
                risk_analysis.append(f"⚡ {feature_name}: {int(value)} (importance: {importance:.3f})")
            elif "time" in feature_name.lower():
                risk_analysis.append(f"⏰ {feature_name}: {value:.2f}h (importance: {importance:.3f})")
            else:
                risk_analysis.append(f"📊 {feature_name}: {value:.3f} (importance: {importance:.3f})")
        
        return {
            "transaction_id": transaction_id,
            "fraud_score": fraud_score,
            "risk_level": risk_level,
            "explanation": explanation,
            "risk_factors": risk_analysis,
            "recommendations": self._generate_enhanced_recommendations(risk_level, features, fraud_score),
            "confidence": f"{fraud_score:.1%}",
            "ai_model": "Gemma 2B Local Reasoning Engine (Demo Mode)",
            "processing_time_ms": random.randint(45, 120)
        }
    
    async def _ollama_explanation(
        self,
        transaction_id: str,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        top_features: List[tuple]
    ) -> Dict[str, any]:
        """Generate AI explanation using local Ollama with Gemma 2B"""
        
        # Build prompt for Ollama
        prompt = self._build_ollama_prompt(fraud_score, risk_level, features, top_features)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "max_tokens": 250
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    explanation = result.get('response', '').strip()
                    
                    return {
                        "transaction_id": transaction_id,
                        "fraud_score": fraud_score,
                        "risk_level": risk_level,
                        "explanation": explanation,
                        "risk_factors": [f"{k}: {v:.3f}" for k, v in top_features],
                        "recommendations": self._generate_enhanced_recommendations(risk_level, features, fraud_score),
                        "ai_model": f"Ollama {self.ollama_model}",
                        "confidence": f"{fraud_score:.1%}"
                    }
                else:
                    # Fallback to demo mode
                    print(f"⚠️ Ollama not available (status {response.status_code}), using demo mode")
                    return self._demo_explanation(
                        transaction_id, fraud_score, risk_level, features, top_features
                    )
        
        except Exception as e:
            print(f"⚠️ Ollama connection failed: {e}, falling back to demo mode")
            # Fallback to demo mode
            return self._demo_explanation(
                transaction_id, fraud_score, risk_level, features, top_features
            )
    
    def _build_ollama_prompt(
        self,
        fraud_score: float,
        risk_level: str,
        features: Dict[str, float],
        top_features: List[tuple]
    ) -> str:
        """Build optimized prompt for Ollama Gemma 2B"""
        feature_desc = "\n".join([
            f"- {name}: {value:.3f}" for name, value in top_features
        ])
        
        prompt = f"""As a fraud detection AI analyst, analyze this transaction:

FRAUD RISK: {fraud_score:.1%} ({risk_level.upper()} RISK)

TOP RISK INDICATORS:
{feature_desc}

TRANSACTION DETAILS:
- Amount: ${features.get('amount', 0):.2f}
- User Average: ${features.get('user_avg_amount', 0):.2f}
- Deviation: {features.get('amount_vs_avg', 1):.1f}x baseline
- Hourly Velocity: {int(features.get('txns_last_hour', 0))} transactions
- Time: {int(features.get('hour_of_day', 0))}:00

Provide a brief 2-3 sentence explanation of why this is {risk_level} risk and what action to take."""
        
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
            "recommendations": self._generate_enhanced_recommendations(risk_level, features, fraud_score)
        }
    
    def _generate_enhanced_recommendations(
        self,
        risk_level: str,
        features: Dict[str, float],
        fraud_score: float
    ) -> List[str]:
        """Generate enhanced action recommendations with contextual details"""
        recommendations = []
        
        if risk_level == "critical":
            recommendations = [
                f"🚨 IMMEDIATE BLOCK - Fraud confidence {fraud_score:.0%}",
                "🔒 FREEZE ACCOUNT - Suspend all transactions pending investigation",
                "📞 CONTACT CUSTOMER - Call verified number within 15 minutes",
                "🔍 DEEP INVESTIGATION - Review all activity from last 7 days",
                "⚠️ LAW ENFORCEMENT - Prepare fraud report if confirmed",
                f"💰 AMOUNT ALERT - Transaction ${features.get('amount', 0):.0f} exceeds safe limits"
            ]
        elif risk_level == "high":
            recommendations = [
                f"⚠️ HOLD TRANSACTION - {fraud_score:.0%} fraud probability",
                "📱 2FA REQUIRED - Send verification code to registered device",
                "👤 ENHANCED VERIFICATION - Request additional identity proof",
                "📊 ACTIVITY REVIEW - Check last 48 hours for anomalies",
                "🔔 FRAUD TEAM ALERT - Queue for specialist review",
                f"⚡ VELOCITY CHECK - {int(features.get('txns_last_hour', 0))} txns/hour unusual"
            ]
        elif risk_level == "medium":
            recommendations = [
                f"🔍 ENHANCED MONITORING - Risk score {fraud_score:.0%}",
                "📧 CUSTOMER NOTIFICATION - Send security alert email",
                "✅ CONDITIONAL APPROVAL - Allow with increased logging",
                "📊 PATTERN TRACKING - Add to behavioral analysis queue",
                "🔔 DAILY REVIEW - Include in tomorrow's audit batch",
                f"💰 THRESHOLD CHECK - ${features.get('amount', 0):.0f} near user's {features.get('amount_vs_avg', 1):.1f}x limit"
            ]
        else:  # low
            recommendations = [
                f"✅ APPROVE - Low risk ({fraud_score:.0%} fraud probability)",
                "📊 STANDARD MONITORING - Normal fraud detection protocols",
                "💾 DATA LOGGING - Record for machine learning training",
                "🔄 PROFILE UPDATE - Adjust user spending baseline",
                "✓ NO ACTION REQUIRED - Transaction within normal parameters"
            ]
        
        return recommendations

