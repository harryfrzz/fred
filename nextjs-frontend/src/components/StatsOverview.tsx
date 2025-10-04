import React from 'react';
import { Stats } from '@/types';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, color = 'blue', icon }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-10`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatsOverviewProps {
  stats: Stats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const fraudRate = stats.fraud_rate.toFixed(1);
  const avgRiskScore = (stats.avg_risk_score * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total Transactions"
        value={stats.total_transactions}
        subtitle={`${stats.total_transactions} processed`}
        color="blue"
        icon={
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <StatsCard
        title="Fraud Detected"
        value={stats.fraud_detected}
        subtitle={`${fraudRate}% fraud rate`}
        color="red"
        icon={
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />
      <StatsCard
        title="Avg Risk Score"
        value={`${avgRiskScore}%`}
        subtitle={`Risk level: ${avgRiskScore > 50 ? 'HIGH' : avgRiskScore > 30 ? 'MEDIUM' : 'LOW'}`}
        color={avgRiskScore > 50 ? 'red' : avgRiskScore > 30 ? 'yellow' : 'green'}
        icon={
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      <StatsCard
        title="Uptime"
        value={`${Math.floor(stats.uptime_seconds)}s`}
        subtitle="System running"
        color="green"
        icon={
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};
