import axios from 'axios';
import { Stats, HealthCheck, RecentResults, FraudResult } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔧 API Configuration:', { API_URL });

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const fraudAPI = {
  // Get system health
  getHealth: async (): Promise<HealthCheck> => {
    const response = await api.get<HealthCheck>('/health');
    return response.data;
  },

  // Get statistics
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/stats');
    return response.data;
  },

  // Get recent transactions
  getRecentTransactions: async (limit: number = 100): Promise<RecentResults> => {
    const response = await api.get<RecentResults>(`/recent?limit=${limit}`);
    return response.data;
  },
};

// Event source for real-time updates (if you want to implement SSE later)
export const createFraudEventSource = (onMessage: (data: FraudResult) => void) => {
  // For now, we'll poll. In production, you might use WebSocket or SSE
  return setInterval(async () => {
    try {
      const data = await fraudAPI.getRecentTransactions(10);
      if (data.transactions.length > 0) {
        onMessage(data.transactions[0]);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  }, 2000); // Poll every 2 seconds
};

export default api;
