'use client';

import { useEffect, useState, useRef } from 'react';
import { fraudAPI } from '@/lib/api';
import { Stats, FraudResult } from '@/types';
import { Notification } from '@/types/notification';
import { StatsOverview } from '@/components/StatsOverview';
import { TransactionsTable } from '@/components/TransactionsTable';
import { InteractiveCharts } from '@/components/InteractiveCharts';
import { AIExplanation } from '@/components/AIExplanation';
import { ToastContainer } from '@/components/FraudToast';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<FraudResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [toasts, setToasts] = useState<Array<{ id: string; transaction: FraudResult }>>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Use ref to persist processed IDs across renders
  const processedIdsRef = useRef<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data from backend...');
      const [statsData, transactionsData] = await Promise.all([
        fraudAPI.getStats(),
        fraudAPI.getRecentTransactions(100)
      ]);
      console.log('✅ Data fetched:', {
        stats: statsData,
        transactionCount: transactionsData.transactions?.length || 0
      });
      setStats(statsData);
      
      const newTransactions = transactionsData.transactions || [];
      
      // Check for new fraud transactions and create toasts
      newTransactions.forEach((txn) => {
        if (txn.is_fraud && !processedIdsRef.current.has(txn.transaction_id)) {
          // Add toast notification
          setToasts((prev) => [
            ...prev,
            {
              id: `toast-${txn.transaction_id}`,
              transaction: txn,
            },
          ]);

          // Store in localStorage for notifications page
          const stored = localStorage.getItem('fraud_notifications') || '[]';
          const notifications: Notification[] = JSON.parse(stored);
          
          const notification: Notification = {
            id: txn.transaction_id,
            transaction_id: txn.transaction_id,
            user_id: txn.user_id,
            amount: txn.amount,
            fraud_probability: txn.fraud_probability,
            risk_level: txn.risk_level,
            is_fraud: txn.is_fraud,
            timestamp: txn.timestamp,
            model_used: txn.model_used,
            ai_explanation: txn.ai_explanation,
            risk_factors: txn.risk_factors,
            recommendations: txn.recommendations,
            read: false,
          };
          
          notifications.unshift(notification);
          // Keep only last 100 notifications
          if (notifications.length > 100) {
            notifications.splice(100);
          }
          
          localStorage.setItem('fraud_notifications', JSON.stringify(notifications));
          
          // Mark as processed using ref
          processedIdsRef.current.add(txn.transaction_id);
        }
      });
      
      setTransactions(newTransactions);
      setLastUpdate(new Date());
      setError(null);
      
      // Update unread count
      updateUnreadCount();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail 
        || err.message 
        || 'Failed to fetch data from backend';
      console.error('❌ Error fetching data:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(`${errorMsg} - Make sure backend is running at http://localhost:8000`);
    } finally {
      setLoading(false);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const updateUnreadCount = () => {
    const stored = localStorage.getItem('fraud_notifications');
    if (stored) {
      const notifications: Notification[] = JSON.parse(stored);
      setUnreadNotifications(notifications.filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    // Initialize processed IDs from localStorage on mount
    const stored = localStorage.getItem('fraud_notifications');
    if (stored) {
      const notifications: Notification[] = JSON.parse(stored);
      notifications.forEach((n) => {
        processedIdsRef.current.add(n.transaction_id);
      });
    }
    
    fetchData();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchData, 3000);

    // Update unread count periodically
    const unreadInterval = setInterval(updateUnreadCount, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(unreadInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-700 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-semibold text-red-400">Connection Error</h3>
          </div>
          <p className="text-red-300/80 mb-4 text-sm">{error}</p>
          <div className="bg-gray-950 border border-gray-900 rounded p-4 mb-4 text-xs text-gray-400 font-mono">
            <p className="mb-2 text-gray-500">Troubleshooting:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Start backend: <code className="text-blue-400">./run-system.sh</code></li>
              <li>Check health: <code className="text-blue-400">curl http://localhost:8000/health</code></li>
              <li>Verify Redis: <code className="text-blue-400">redis-cli ping</code></li>
            </ol>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Fraud Detection System
              </h1>
              <p className="text-gray-400 text-sm">
                Real-time transaction monitoring powered by XGBoost and AI
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Notifications Bell */}
              <Link href="/notifications">
                <div className="relative cursor-pointer group">
                  <div className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 p-3 rounded-lg transition-all">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifications > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </div>
                    )}
                  </div>
                  <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-800 text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Fraud Alerts
                  </div>
                </div>
              </Link>

              {/* Status */}
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Live</span>
                </div>
                <p className="text-xs text-gray-500">Last Update</p>
                <p className="text-sm font-mono text-gray-300">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && <StatsOverview stats={stats} />}

          {/* AI Insights - Only show FRAUD transactions with AI explanations */}
          {transactions.filter(t => t.is_fraud && (t.ai_explanation || t.risk_factors)).length > 0 && (
            <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Critical Fraud Alerts</h2>
                  <p className="text-gray-400 text-sm">
                    AI-powered analysis of confirmed fraudulent transactions
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {transactions
                  .filter(t => t.is_fraud && (t.ai_explanation || t.risk_factors))
                  .slice(0, 4)
                  .map(txn => (
                    <div key={txn.transaction_id} className="bg-black/20 border border-red-900/30 rounded-lg p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-mono">
                          {txn.transaction_id.slice(0, 12)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ${txn.amount} · {txn.user_id}
                        </span>
                      </div>
                      <AIExplanation transaction={txn} />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Interactive Charts */}
          <InteractiveCharts transactions={transactions} />

          {/* Transactions Table */}
          <TransactionsTable transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
