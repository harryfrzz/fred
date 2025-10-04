'use client';

import React from 'react';
import { FraudResult } from '@/types';

interface AIExplanationProps {
  transaction: FraudResult;
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ transaction }) => {
  // Only show if AI explanation exists
  if (!transaction.ai_explanation && !transaction.risk_factors && !transaction.recommendations) {
    return null;
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
      case 'fraud':
        return 'border-red-500 bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-green-500 bg-green-900/20';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getRiskColor(transaction.risk_level)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-lg font-bold text-white">AI Fraud Analysis</h3>
            <p className="text-sm text-gray-400">
              Risk Score: {(transaction.fraud_probability * 100).toFixed(1)}% · 
              Level: <span className="font-semibold uppercase">{transaction.risk_level}</span>
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Model: {transaction.model_used}
        </div>
      </div>

      {/* AI Explanation */}
      {transaction.ai_explanation && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 Explanation</h4>
          <p className="text-gray-200 text-sm leading-relaxed bg-gray-800/50 rounded p-3">
            {transaction.ai_explanation}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {transaction.risk_factors && transaction.risk_factors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">⚠️ Risk Factors</h4>
          <ul className="space-y-1">
            {transaction.risk_factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {transaction.recommendations && transaction.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">✅ Recommendations</h4>
          <ul className="space-y-1">
            {transaction.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-green-400 mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
