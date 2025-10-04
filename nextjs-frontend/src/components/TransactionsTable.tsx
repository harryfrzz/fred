import React, { useState, useMemo } from 'react';
import { FraudResult } from '@/types';
import { format } from 'date-fns';
import { AIExplanation } from './AIExplanation';

interface TransactionsTableProps {
  transactions: FraudResult[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [fraudFilter, setFraudFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount' | 'risk'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleRow = (txnId: string) => {
    setExpandedRow(expandedRow === txnId ? null : txnId);
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter (transaction ID, user ID)
    if (searchTerm) {
      filtered = filtered.filter(
        (txn) =>
          txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter((txn) => txn.risk_level.toLowerCase() === riskFilter);
    }

    // Fraud status filter
    if (fraudFilter === 'fraud') {
      filtered = filtered.filter((txn) => txn.is_fraud);
    } else if (fraudFilter === 'legitimate') {
      filtered = filtered.filter((txn) => !txn.is_fraud);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'time':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'risk':
          comparison = a.fraud_probability - b.fraud_probability;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, riskFilter, fraudFilter, sortBy, sortOrder]);

  const toggleSort = (column: 'time' | 'amount' | 'risk') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: 'time' | 'amount' | 'risk') => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return 'text-red-400 bg-red-950/50 border border-red-900/50';
      case 'high':
        return 'text-orange-400 bg-orange-950/50 border border-orange-900/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-950/50 border border-yellow-900/50';
      case 'low':
        return 'text-green-400 bg-green-950/50 border border-green-900/50';
      default:
        return 'text-gray-400 bg-gray-950/50 border border-gray-900/50';
    }
  };

  const getRiskIcon = (isFraud: boolean, riskLevel: string) => {
    if (isFraud) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    switch (riskLevel.toLowerCase()) {
      case 'high':
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
        <p className="text-xs text-gray-500 mt-1">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-black border-b border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Search
            </label>
            <input
              type="text"
              placeholder="Transaction ID or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Fraud Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Fraud Status
            </label>
            <select
              value={fraudFilter}
              onChange={(e) => setFraudFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              <option value="fraud">Fraud Only</option>
              <option value="legitimate">Legitimate Only</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('all');
                setFraudFilter('all');
                setSortBy('time');
                setSortOrder('desc');
              }}
              className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-black border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Transaction ID
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900/50 transition-colors"
                onClick={() => toggleSort('time')}
              >
                <span className="flex items-center gap-1">
                  Time {getSortIcon('time')}
                </span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900/50 transition-colors"
                onClick={() => toggleSort('amount')}
              >
                <span className="flex items-center gap-1">
                  Amount {getSortIcon('amount')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900/50 transition-colors"
                onClick={() => toggleSort('risk')}
              >
                <span className="flex items-center gap-1">
                  Risk {getSortIcon('risk')}
                </span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                AI
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-950 divide-y divide-gray-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-base text-gray-400 mb-1">No transactions found</p>
                    <p className="text-sm text-gray-600">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <React.Fragment key={txn.transaction_id}>
                  <tr 
                    className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(txn.transaction_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                      {txn.transaction_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {format(new Date(txn.timestamp), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {txn.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ${txn.amount.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(txn.risk_level)}`}>
                        {(txn.fraud_probability * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(txn.risk_level)}`}>
                        {getRiskIcon(txn.is_fraud, txn.risk_level)} 
                        <span>{txn.is_fraud ? 'FRAUD' : txn.risk_level.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {(txn.ai_explanation || txn.risk_factors || txn.recommendations) ? (
                        <div className="flex items-center justify-center">
                          {expandedRow === txn.transaction_id ? (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === txn.transaction_id && (
                    <tr className="bg-black border-b border-gray-800">
                      <td colSpan={7} className="px-6 py-4">
                        <AIExplanation transaction={txn} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
