'use client';

import { useEffect, useState } from 'react';
import { fetchRecentTransactions } from '@/lib/api';
import type { FraudResult } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<FraudResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchRecentTransactions(100);
      // Filter for fraud and high-risk transactions
      const fraudTransactions = data.transactions.filter(
        (t) => t.is_fraud || t.risk_level === 'high' || t.risk_level === 'critical'
      );
      setNotifications(fraudTransactions);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-400 bg-red-950/50 border-red-900';
      case 'high':
        return 'text-orange-400 bg-orange-950/50 border-orange-900';
      case 'medium':
        return 'text-yellow-400 bg-yellow-950/50 border-yellow-900';
      default:
        return 'text-green-400 bg-green-950/50 border-green-900';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-700 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h1 className="text-3xl font-semibold">Fraud Notifications</h1>
          </div>
          <p className="text-gray-400">
            {notifications.length} fraud alert{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-gray-950 border border-gray-900 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400">No fraud notifications at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.transaction_id}
                className={`bg-gray-950 border rounded-lg p-6 ${getRiskColor(notification.risk_level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Transaction Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRiskColor(notification.risk_level)}`}>
                        {notification.risk_level} Risk
                      </span>
                      {notification.is_fraud && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-red-950 text-red-400 border border-red-900">
                          Fraud Detected
                        </span>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-400">Transaction ID</p>
                        <p className="font-mono text-sm text-gray-200">{notification.transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">User ID</p>
                        <p className="font-mono text-sm text-gray-200">{notification.user_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Amount</p>
                        <p className="font-semibold text-gray-200">${notification.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Fraud Probability</p>
                        <p className="font-semibold text-gray-200">
                          {(notification.fraud_probability * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
