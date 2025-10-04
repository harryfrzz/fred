'use client';

import React, { useEffect, useState } from 'react';
import { FraudResult } from '@/types';

interface ToastProps {
  transaction: FraudResult;
  onClose: () => void;
}

export const FraudToast: React.FC<ToastProps> = ({ transaction, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          setIsVisible(false);
          setTimeout(onClose, 300);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getRiskColor = () => {
    if (transaction.fraud_probability >= 0.8) return 'from-red-600 to-red-700';
    if (transaction.fraud_probability >= 0.6) return 'from-orange-600 to-orange-700';
    return 'from-yellow-600 to-yellow-700';
  };

  return (
    <div className="relative overflow-hidden bg-gray-900 border border-red-500/50 rounded-lg shadow-2xl p-4 min-w-[350px] max-w-md animate-slide-in">
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-red-500 transition-all duration-50" style={{ width: `${progress}%` }} />
      
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getRiskColor()} flex items-center justify-center`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold text-sm">Fraud Detected</h3>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-300 text-xs mb-2">
            <span className="font-semibold text-red-400">
              {(transaction.fraud_probability * 100).toFixed(1)}% Risk
            </span>
            {' '} · ${transaction.amount} · {transaction.user_id}
          </p>

          {transaction.ai_explanation && (
            <p className="text-gray-400 text-xs line-clamp-2 mb-2">
              {transaction.ai_explanation}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">#{transaction.transaction_id.slice(0, 8)}</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${
              transaction.fraud_probability >= 0.8 ? 'bg-red-900 text-red-200' :
              transaction.fraud_probability >= 0.6 ? 'bg-orange-900 text-orange-200' :
              'bg-yellow-900 text-yellow-200'
            }`}>
              {transaction.risk_level.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: Array<{ id: string; transaction: FraudResult }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {toasts.map((toast) => (
          <FraudToast
            key={toast.id}
            transaction={toast.transaction}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};
