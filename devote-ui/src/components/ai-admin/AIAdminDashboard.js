import React, { useState, useEffect } from 'react';
import { 
  calculateElectionStats, 
  generateElectionSummary, 
  generateRecommendations,
  getPhaseBadgeConfig,
  getRecommendationStyle
} from './adminInsightsUtils';
import './AIAdminDashboard.css';

/**
 * DeVote AI Admin Insights Dashboard
 * 
 * An admin-only dashboard that provides AI-style election summaries,
 * statistics, and actionable recommendations.
 * 
 * Props:
 * - candidates: Array of candidate objects
 * - registrationRequests: Array of voter registration requests
 * - electionStarted: boolean
 * - electionEnded: boolean
 * - totalVotes: number (total votes cast)
 * - onRefresh: Function to refresh data
 */
const AIAdminDashboard = ({
  candidates = [],
  registrationRequests = [],
  electionStarted = false,
  electionEnded = false,
  totalVotes = 0,
  onRefresh = null,
}) => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate stats whenever data changes
  useEffect(() => {
    const electionStats = calculateElectionStats({
      candidates,
      registrationRequests,
      electionStarted,
      electionEnded,
      totalVotes,
    });

    setStats(electionStats);
    setSummary(generateElectionSummary(electionStats));
    setRecommendations(generateRecommendations(electionStats, { electionStarted, electionEnded }));
  }, [candidates, registrationRequests, electionStarted, electionEnded, totalVotes]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!stats) {
    return (
      <div className="ai-admin-dashboard">
        <div className="ai-dashboard-loading">
          <div className="ai-loading-spinner"></div>
          <p>Loading AI insights...</p>
        </div>
      </div>
    );
  }

  const phaseBadge = getPhaseBadgeConfig(stats.electionPhase);

  return (
    <div className="ai-admin-dashboard">
      {/* Header */}
      <div className="ai-dashboard-header">
        <div className="ai-dashboard-title">
          <div className="ai-dashboard-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div>
            <h2>DeVote AI Admin Insights</h2>
            <p className="ai-dashboard-subtitle">Election Intelligence Dashboard</p>
          </div>
        </div>
        <div className="ai-dashboard-actions">
          <span className={`ai-phase-badge ${phaseBadge.bgColor} ${phaseBadge.textColor} ${phaseBadge.borderColor}`}>
            <span className="ai-phase-icon">{phaseBadge.icon}</span>
            {stats.electionPhase}
          </span>
          {onRefresh && (
            <button 
              className="ai-refresh-button"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="ai-stats-grid">
        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Total Requests</p>
            <p className="ai-stat-value">{stats.totalRequests}</p>
          </div>
        </div>

        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Approved Voters</p>
            <p className="ai-stat-value">{stats.approvedRequests}</p>
          </div>
        </div>

        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Pending Approvals</p>
            <p className="ai-stat-value">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Rejected</p>
            <p className="ai-stat-value">{stats.rejectedRequests}</p>
          </div>
        </div>

        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Candidates</p>
            <p className="ai-stat-value">{stats.totalCandidates}</p>
          </div>
        </div>

        <div className="ai-stat-card">
          <div className="ai-stat-icon bg-indigo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Votes Cast</p>
            <p className="ai-stat-value">{stats.totalVotes}</p>
          </div>
        </div>

        <div className="ai-stat-card highlight">
          <div className="ai-stat-icon bg-gradient">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
          </div>
          <div className="ai-stat-content">
            <p className="ai-stat-label">Turnout</p>
            <p className="ai-stat-value">{stats.turnoutPercentage}%</p>
          </div>
        </div>

        {stats.mostActiveCounty && (
          <div className="ai-stat-card">
            <div className="ai-stat-icon bg-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="ai-stat-content">
              <p className="ai-stat-label">Most Active County</p>
              <p className="ai-stat-value ai-stat-value-sm">{stats.mostActiveCounty}</p>
              <p className="ai-stat-sub">{stats.mostActiveCountyCount} registrations</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Election Summary */}
      <div className="ai-summary-card">
        <div className="ai-summary-header">
          <div className="ai-summary-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <h3>AI Election Summary</h3>
        </div>
        <div className="ai-summary-content">
          <p>{summary}</p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="ai-recommendations-card">
        <div className="ai-recommendations-header">
          <div className="ai-recommendations-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h3>AI Recommendations</h3>
        </div>
        <div className="ai-recommendations-list">
          {recommendations.map((rec, index) => {
            const style = getRecommendationStyle(rec.type);
            return (
              <div 
                key={index}
                className={`ai-recommendation-item ${style.bgColor} ${style.borderColor}`}
              >
                <span className="ai-rec-icon">{style.icon}</span>
                <span className="ai-rec-text">{rec.text}</span>
                {rec.priority === 'critical' && (
                  <span className="ai-rec-priority critical">Critical</span>
                )}
                {rec.priority === 'high' && (
                  <span className="ai-rec-priority high">High</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidates by Position */}
      {stats.candidatesByPosition && Object.keys(stats.candidatesByPosition).length > 0 && (
        <div className="ai-breakdown-card">
          <div className="ai-breakdown-header">
            <h3>Candidates by Position</h3>
          </div>
          <div className="ai-breakdown-grid">
            {Object.entries(stats.candidatesByPosition).map(([position, count]) => (
              <div key={position} className="ai-breakdown-item">
                <span className="ai-breakdown-label">{position}</span>
                <span className="ai-breakdown-value">{count} candidate{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Votes by Position (if voting is active or ended) */}
      {(electionStarted || electionEnded) && stats.votesByPosition && Object.keys(stats.votesByPosition).length > 0 && (
        <div className="ai-breakdown-card">
          <div className="ai-breakdown-header">
            <h3>Votes by Position</h3>
          </div>
          <div className="ai-breakdown-grid">
            {Object.entries(stats.votesByPosition).map(([position, votes]) => (
              <div key={position} className="ai-breakdown-item">
                <span className="ai-breakdown-label">{position}</span>
                <span className="ai-breakdown-value">{votes} vote{votes !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdminDashboard;