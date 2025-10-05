'use client';

import React from 'react';
import { FraudResult } from '@/types';

interface AIExplanationProps {
  transaction: FraudResult;
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ transaction }) => {
  // Generate demo placeholder data based on transaction
  const generateDemoData = () => {
    const isFraud = transaction.is_fraud;
    const riskLevel = transaction.risk_level;
    const amount = transaction.amount;
    
    // Demo AI Explanation
    const explanation = isFraud 
      ? `This transaction has been flagged as fraudulent with a ${(transaction.fraud_probability * 100).toFixed(1)}% confidence score. The transaction exhibits multiple suspicious patterns including unusual transaction amount ($${amount.toFixed(2)}), abnormal timing, and behavioral inconsistencies with the user's historical profile. Our advanced machine learning model has identified this as a high-priority case requiring immediate attention.`
      : `This transaction shows ${riskLevel} risk characteristics with a ${(transaction.fraud_probability * 100).toFixed(1)}% fraud probability. While not definitively fraudulent, certain patterns warrant closer monitoring. The transaction falls outside typical behavioral norms but does not meet the threshold for immediate blocking.`;
    
    // Demo Risk Factors
    const riskFactors = isFraud ? [
      'Transaction amount significantly exceeds user\'s average spending pattern',
      'Unusual geographic location detected - IP address from high-risk country',
      'Transaction velocity anomaly - multiple high-value transactions in short timeframe',
      'Device fingerprint mismatch - new device not previously associated with account',
      'Behavioral pattern deviation - transaction type inconsistent with user history'
    ] : riskLevel === 'high' || riskLevel === 'critical' ? [
      'Transaction amount moderately above user\'s typical range',
      'Slightly unusual transaction timing detected',
      'Minor deviation in spending category pattern'
    ] : [];
    
    // Demo Recommendations
    const recommendations = isFraud ? [
      'Immediately block this transaction and freeze the account',
      'Contact user via verified phone number to confirm transaction legitimacy',
      'Flag related accounts and transactions for review',
      'Escalate to fraud investigation team for detailed analysis',
      'Update fraud detection models with this case for improved future detection'
    ] : riskLevel === 'high' || riskLevel === 'critical' ? [
      'Monitor account activity closely for the next 24-48 hours',
      'Consider implementing additional verification for similar transactions',
      'Review user\'s recent transaction history for patterns'
    ] : [];
    
    return { explanation, riskFactors, recommendations };
  };
  
  const demoData = generateDemoData();

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
      case 'fraud':
        return 'border-red-900/50 bg-red-950/30';
      case 'high':
        return 'border-orange-900/50 bg-orange-950/30';
      case 'medium':
        return 'border-yellow-900/50 bg-yellow-950/30';
      default:
        return 'border-green-900/50 bg-green-950/30';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getRiskColor(transaction.risk_level)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-white">AI Fraud Analysis</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Risk Score: {(transaction.fraud_probability * 100).toFixed(1)}% · 
              Level: <span className="font-medium uppercase">{transaction.risk_level}</span>
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Model: {transaction.model_used || 'Logistic Regression'}
        </div>
      </div>

      {/* AI Explanation */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Explanation
        </h4>
        <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          {transaction.ai_explanation || demoData.explanation}
        </p>
      </div>

      {/* Risk Factors */}
      {(transaction.risk_factors && transaction.risk_factors.length > 0) || demoData.riskFactors.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risk Factors
          </h4>
          <ul className="space-y-1.5 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            {(transaction.risk_factors || demoData.riskFactors).map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-1 text-xs">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Recommendations */}
      {(transaction.recommendations && transaction.recommendations.length > 0) || demoData.recommendations.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommendations
          </h4>
          <ul className="space-y-1.5 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
            {(transaction.recommendations || demoData.recommendations).map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 mt-1">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
