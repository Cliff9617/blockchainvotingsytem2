/**
 * AdminVerificationAnalytics - Vote Verification Statistics for Admin Dashboard
 * 
 * Displays verification statistics including total votes, verified votes,
 * pending confirmations, failed transactions, and verification requests.
 */
import React, { useState, useEffect } from 'react';
import { getVerificationStats } from '../services/voteReceiptService';
import {
  BallotBoxIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SearchIcon,
} from './common/Icons';

const AdminVerificationAnalytics = () => {
  const [stats, setStats] = useState({
    totalVotes: 0,
    verifiedVotes: 0,
    pendingConfirmations: 0,
    failedTransactions: 0,
    verificationRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getVerificationStats();
      setStats(data);
    } catch (err) {
      console.error('[AdminVerificationAnalytics] Error loading stats:', err);
      setError('Failed to load verification statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Votes',
      value: stats.totalVotes,
      Icon: BallotBoxIcon,
      color: 'bg-blue-100 text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Verified Votes',
      value: stats.verifiedVotes,
      Icon: CheckCircleIcon,
      color: 'bg-green-100 text-green-600',
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Pending Confirmations',
      value: stats.pendingConfirmations,
      Icon: ClockIcon,
      color: 'bg-yellow-100 text-yellow-600',
      bg: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Failed Transactions',
      value: stats.failedTransactions,
      Icon: XCircleIcon,
      color: 'bg-red-100 text-red-600',
      bg: 'bg-red-50 border-red-200',
    },
    {
      label: 'Verification Requests',
      value: stats.verificationRequests,
      Icon: SearchIcon,
      color: 'bg-purple-100 text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Vote Verification Statistics
        </h3>
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Vote Verification Statistics
        </h3>
        <button
          onClick={loadStats}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`rounded-xl border p-4 ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <card.Icon className={`w-6 h-6 ${card.color}`} />
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color}`}>
                {card.label === 'Verified Votes' && stats.totalVotes > 0
                  ? `${Math.round((stats.verifiedVotes / stats.totalVotes) * 100)}%`
                  : ''}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-600 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Verification Rate Bar */}
      {stats.totalVotes > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Verification Rate</span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round((stats.verifiedVotes / stats.totalVotes) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(stats.verifiedVotes / stats.totalVotes) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{stats.verifiedVotes} verified</span>
            <span>{stats.pendingConfirmations} pending</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalVotes === 0 && !error && (
        <div className="text-center py-6">
          <p className="text-gray-500">No vote data available yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Statistics will appear once votes are cast and verified
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationAnalytics;