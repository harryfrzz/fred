'use client';

import React, { useState } from 'react';
import { FraudResult } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsProps {
  transactions: FraudResult[];
}

type TabType = 'risk-trend' | 'fraud-distribution' | 'amount-analysis' | 'hourly-volume';

export const InteractiveCharts: React.FC<ChartsProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<TabType>('risk-trend');

  // Check if we have data
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-gray-950 border border-gray-900 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Analytics & Insights
        </h2>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">
              No transaction data available yet
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Charts will appear once transactions are processed
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for Risk Trend chart (Line Chart)
  const riskTrendData = transactions.slice(-20).map((txn, index) => ({
    index: index + 1,
    risk: txn.fraud_probability * 100,
    time: format(new Date(txn.timestamp), 'HH:mm:ss'),
    amount: txn.amount,
  }));

  const lineChartData = {
    labels: riskTrendData.map(d => d.time),
    datasets: [
      {
        label: 'Fraud Risk %',
        data: riskTrendData.map(d => d.risk),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#9ca3af',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          callback: (value: any) => value + '%',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  // Prepare data for Fraud Distribution (Pie Chart)
  const riskLevels = transactions.reduce(
    (acc, txn) => {
      if (txn.is_fraud) acc.fraud++;
      else if (txn.fraud_probability >= 0.6) acc.high++;
      else if (txn.fraud_probability >= 0.3) acc.medium++;
      else acc.low++;
      return acc;
    },
    { fraud: 0, high: 0, medium: 0, low: 0 }
  );

  const pieChartData = {
    labels: ['Fraud', 'High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [riskLevels.fraud, riskLevels.high, riskLevels.medium, riskLevels.low],
        backgroundColor: [
          'rgba(220, 38, 38, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(220, 38, 38)',
          'rgb(245, 158, 11)',
          'rgb(251, 191, 36)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Prepare data for Amount Analysis (Bar Chart)
  const amountRanges = transactions.reduce(
    (acc, txn) => {
      if (txn.amount < 100) acc['$0-100']++;
      else if (txn.amount < 200) acc['$100-200']++;
      else if (txn.amount < 300) acc['$200-300']++;
      else if (txn.amount < 400) acc['$300-400']++;
      else if (txn.amount < 500) acc['$400-500']++;
      else acc['$500+']++;
      return acc;
    },
    { '$0-100': 0, '$100-200': 0, '$200-300': 0, '$300-400': 0, '$400-500': 0, '$500+': 0 }
  );

  const barChartData = {
    labels: Object.keys(amountRanges),
    datasets: [
      {
        label: 'Transaction Count',
        data: Object.values(amountRanges),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#9ca3af',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  // Prepare data for Hourly Volume
  const hourlyData = transactions.reduce((acc, txn) => {
    const hour = format(new Date(txn.timestamp), 'HH:00');
    if (!acc[hour]) {
      acc[hour] = { hour, total: 0, fraud: 0, legitimate: 0 };
    }
    acc[hour].total++;
    if (txn.is_fraud || txn.fraud_probability >= 0.6) acc[hour].fraud++;
    else acc[hour].legitimate++;
    return acc;
  }, {} as Record<string, { hour: string; total: number; fraud: number; legitimate: number }>);

  const hourlyVolumeData = Object.values(hourlyData).sort((a, b) =>
    a.hour.localeCompare(b.hour)
  );

  const hourlyChartData = {
    labels: hourlyVolumeData.map(d => d.hour),
    datasets: [
      {
        label: 'Fraudulent',
        data: hourlyVolumeData.map(d => d.fraud),
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 2,
      },
      {
        label: 'Legitimate',
        data: hourlyVolumeData.map(d => d.legitimate),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
    ],
  };

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        stacked: true,
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  const tabs = [
    { id: 'risk-trend', label: 'Risk Trend' },
    { id: 'fraud-distribution', label: 'Distribution' },
    { id: 'amount-analysis', label: 'Amount Analysis' },
    { id: 'hourly-volume', label: 'Hourly Volume' },
  ];

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Analytics & Insights
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Visualizing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="h-96">
        {activeTab === 'risk-trend' && (
          <div className="h-full">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Risk Score Trend (Last 20 Transactions)
            </h3>
            <div className="h-[calc(100%-2rem)]">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        )}

        {activeTab === 'fraud-distribution' && (
          <div className="h-full">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Risk Level Distribution
            </h3>
            <div className="h-[calc(100%-2rem)] flex items-center justify-center">
              <div className="w-full max-w-md">
                <Doughnut data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amount-analysis' && (
          <div className="h-full">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Transaction Amount Distribution
            </h3>
            <div className="h-[calc(100%-2rem)]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        )}

        {activeTab === 'hourly-volume' && (
          <div className="h-full">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Hourly Transaction Volume
            </h3>
            <div className="h-[calc(100%-2rem)]">
              <Bar data={hourlyChartData} options={hourlyChartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Fraud</p>
          <p className="text-2xl font-bold text-red-400">{riskLevels.fraud}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">High Risk</p>
          <p className="text-2xl font-bold text-orange-400">{riskLevels.high}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Low Risk</p>
          <p className="text-2xl font-bold text-green-400">{riskLevels.low}</p>
        </div>
      </div>
    </div>
  );
};
