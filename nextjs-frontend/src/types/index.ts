export interface Transaction {
  transaction_id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  merchant_id: string | null;
  timestamp: string;
}

export interface FraudResult extends Transaction {
  fraud_probability: number;
  risk_level: string;
  is_fraud: boolean;
  features: Record<string, number>;
  model_used: string;
  ai_explanation?: string;
  risk_factors?: string[];
  recommendations?: string[];
}

export interface Stats {
  total_transactions: number;
  fraud_detected: number;
  fraud_rate: number;
  avg_risk_score: number;
  model_type: string;
  uptime_seconds: number;
}

export interface HealthCheck {
  status: string;
  model_loaded: boolean;
  redis_connected: boolean;
}

export interface RecentResults {
  transactions: FraudResult[];
  total: number;
  limit: number;
}
