export interface Notification {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  fraud_probability: number;
  risk_level: string;
  is_fraud: boolean;
  timestamp: string;
  model_used: string;
  ai_explanation?: string;
  risk_factors?: string[];
  recommendations?: string[];
  read: boolean;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
}
