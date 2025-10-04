import React, { useState } from 'react';
import { FraudResult } from '@/types';
import { format } from 'date-fns';
import { AIExplanation } from './AIExplanation';

interface TransactionsTableProps {
  transactions: FraudResult[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (txnId: string) => {
    setExpandedRow(expandedRow === txnId ? null : txnId);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRiskIcon = (isFraud: boolean, riskLevel: string) => {
    if (isFraud) {
      return '🚨';
    }
    switch (riskLevel.toLowerCase()) {
      case 'high':
      case 'critical':
        return '⚠️';
      case 'medium':
        return '⚡';
      default:
        return '✓';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Last {transactions.length} transactions processed
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                AI
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((txn) => (
              <React.Fragment key={txn.transaction_id}>
                <tr 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleRow(txn.transaction_id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                    {txn.transaction_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(txn.timestamp), 'HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {txn.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    ${txn.amount.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full font-semibold ${getRiskColor(txn.risk_level)}`}>
                      {(txn.fraud_probability * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(txn.risk_level)}`}>
                      {getRiskIcon(txn.is_fraud, txn.risk_level)} {txn.is_fraud ? 'FRAUD' : txn.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {(txn.ai_explanation || txn.risk_factors || txn.recommendations) ? (
                      <span className="text-2xl">
                        {expandedRow === txn.transaction_id ? '▼' : '🤖'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
                {expandedRow === txn.transaction_id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-900/50">
                      <AIExplanation transaction={txn} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
