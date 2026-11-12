import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { runIntegrityChecks, getAlertStats, getSeverityConfig } from './integrityRules';
import './AIIntegrityMonitor.css';

/**
 * DeVote AI Integrity Monitor
 * 
 * Admin-only dashboard for detecting suspicious patterns in voter
 * registration and voting data. This component is ADVISORY ONLY
 * and does not automatically block or approve anything.
 */
const AIIntegrityMonitor = ({ onRefresh }) => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0, info: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data and run integrity checks
  const runChecks = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load registration requests
      let registrationRequests = [];
      try {
        const requestsRef = collection(db, 'voterRegistrationRequests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          registrationRequests.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.warn('Could not load registration requests:', e);
        // Try without orderBy
        try {
          const requestsRef = collection(db, 'voterRegistrationRequests');
          const snapshot = await getDocs(requestsRef);
          snapshot.forEach(doc => {
            registrationRequests.push({ id: doc.id, ...doc.data() });
          });
        } catch (e2) {
          console.warn('Fallback also failed:', e2);
        }
      }

      // Load voters
      let voters = [];
      try {
        const votersRef = collection(db, 'voters');
        const snapshot = await getDocs(votersRef);
        snapshot.forEach(doc => {
          voters.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.warn('Could not load voters:', e);
      }

      // Load votes
      let votes = [];
      try {
        const votesRef = collection(db, 'votes');
        const snapshot = await getDocs(votesRef);
        snapshot.forEach(doc => {
          votes.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.warn('Could not load votes:', e);
      }

      // Load candidates
      let candidates = [];
      try {
        const candidatesRef = collection(db, 'candidates');
        const snapshot = await getDocs(candidatesRef);
        snapshot.forEach(doc => {
          candidates.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.warn('Could not load candidates:', e);
      }

      // Run integrity checks
      const detectedAlerts = runIntegrityChecks({
        registrationRequests,
        voters,
        votes,
        candidates,
      });

      setAlerts(detectedAlerts);
      setStats(getAlertStats(detectedAlerts));
      setDataLoaded(true);
    } catch (err) {
      console.error('Error running integrity checks:', err);
      setError('Failed to run integrity checks. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    await runChecks();
  };

  // Filter alerts
  const filteredAlerts = activeFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === activeFilter);

  if (isLoading) {
    return (
      <div className="ai-integrity-monitor">
        <div className="ai-integrity-loading">
          <div className="ai-integrity-spinner"></div>
          <p>Running AI integrity checks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-integrity-monitor">
      {/* Header */}
      <div className="ai-integrity-header">
        <div className="ai-integrity-title">
          <div className="ai-integrity-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <h2>DeVote AI Integrity Monitor</h2>
            <p className="ai-integrity-subtitle">
              AI-style anomaly detection for registration and voting integrity
            </p>
          </div>
        </div>
        <div className="ai-integrity-actions">
          <button 
            className="ai-integrity-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Checks'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ai-integrity-stats">
        <div className="ai-integrity-stat-card">
          <div className="ai-stat-number">{stats.total}</div>
          <div className="ai-stat-label">Total Alerts</div>
        </div>
        <div className="ai-integrity-stat-card high">
          <div className="ai-stat-number">{stats.high}</div>
          <div className="ai-stat-label">High Risk</div>
        </div>
        <div className="ai-integrity-stat-card medium">
          <div className="ai-stat-number">{stats.medium}</div>
          <div className="ai-stat-label">Medium Risk</div>
        </div>
        <div className="ai-integrity-stat-card low">
          <div className="ai-stat-number">{stats.low}</div>
          <div className="ai-stat-label">Low Risk</div>
        </div>
        <div className="ai-integrity-stat-card info">
          <div className="ai-stat-number">{stats.info}</div>
          <div className="ai-stat-label">Info</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="ai-integrity-disclaimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p>
          These alerts are advisory only. Final election decisions must be made by authorized administrators after manual review.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="ai-integrity-error">
          <p>{error}</p>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="ai-integrity-filters">
        {['all', 'high', 'medium', 'low', 'info'].map(filter => (
          <button
            key={filter}
            className={`ai-filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter !== 'all' && stats[filter] > 0 && (
              <span className="ai-filter-count">{stats[filter]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 && !error ? (
        <div className="ai-integrity-empty">
          <div className="ai-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <h3>No suspicious patterns detected</h3>
          <p>
            {dataLoaded 
              ? "No suspicious patterns detected from the currently available data." 
              : "Loading data for analysis..."}
          </p>
        </div>
      ) : (
        <div className="ai-integrity-alerts">
          {filteredAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            return (
              <div key={alert.id} className={`ai-alert-card ${alert.severity}`}>
                <div className="ai-alert-header">
                  <span className={`ai-alert-severity ${config.bgColor} ${config.textColor}`}>
                    <span className="ai-severity-icon">{config.icon}</span>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="ai-alert-type">{alert.type}</span>
                </div>
                <div className="ai-alert-message">
                  <strong>{alert.message}</strong>
                </div>
                {alert.details && (
                  <div className="ai-alert-details">
                    {alert.details}
                  </div>
                )}
                <div className="ai-alert-recommendation">
                  <strong>Recommendation:</strong> {alert.recommendation}
                </div>
                {alert.affectedRecords && alert.affectedRecords.length > 0 && (
                  <div className="ai-alert-records">
                    Affected records: {alert.affectedRecords.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIIntegrityMonitor;