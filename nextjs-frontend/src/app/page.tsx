'use client';

import { useEffect, useState } from 'react';
import { fraudAPI } from '@/lib/api';
import { Stats, FraudResult } from '@/types';
import { StatsOverview } from '@/components/StatsOverview';
import { TransactionsTable } from '@/components/TransactionsTable';
import { InteractiveCharts } from '@/components/InteractiveCharts';
import { AIExplanation } from '@/components/AIExplanation';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<FraudResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
      setTransactions(transactionsData.transactions || []);
      setLastUpdate(new Date());
      setError(null);
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

  useEffect(() => {
    fetchData();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-8 max-w-2xl">
          <h3 className="text-2xl font-bold text-red-400 mb-4">⚠️ Connection Error</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <div className="bg-gray-800 rounded p-4 mb-4 text-sm text-gray-300 font-mono">
            <p className="mb-2">Troubleshooting steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure backend is running: <code className="text-blue-400">./run-system.sh</code></li>
              <li>Check if backend is accessible: <code className="text-blue-400">curl http://localhost:8000/health</code></li>
              <li>Verify Redis is running: <code className="text-blue-400">redis-cli ping</code></li>
            </ol>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🛡️ AI Fraud Detection Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Real-time fraud detection powered by XGBoost & Ollama/Gemma 2B
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Live</span>
              </div>
              <p className="text-sm text-gray-400">Last Update</p>
              <p className="text-lg font-mono text-blue-400">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && <StatsOverview stats={stats} />}

          {/* AI Insights - Show high-risk transactions with AI explanations */}
          {transactions.filter(t => t.ai_explanation || t.risk_factors).length > 0 && (
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border-2 border-purple-500/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🤖</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Fraud Insights</h2>
                  <p className="text-gray-300 text-sm">
                    AI-powered analysis of high-risk transactions using Ollama/Gemma 2B
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {transactions
                  .filter(t => t.ai_explanation || t.risk_factors)
                  .slice(0, 4)
                  .map(txn => (
                    <div key={txn.transaction_id}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-400 font-mono">
                          #{txn.transaction_id.slice(0, 8)}
                        </span>
                        <span className="text-sm text-gray-400">
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

          {/* Recent Transactions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
            <p className="text-gray-400 text-sm mb-4">
              Click on any transaction with a 🤖 icon to view detailed AI analysis
            </p>
            <TransactionsTable transactions={transactions.slice(0, 20)} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-400">
            Powered by AI · Model: {stats?.model_type || 'XGBoost'} · Real-time monitoring
          </p>
        </div>
      </footer>
    </div>
  );
}
