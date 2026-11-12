/**
 * NationalResultsCenter - Professional National Results Dashboard
 * Professional National-Grade Election Management Platform
 * 
 * Features:
 * - Real-time national results display
 * - County-level and constituency-level breakdowns
 * - Turnout statistics
 * - Live percentages and leading candidates
 * - Professional charts and visualizations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { POSITION_NAMES, ELECTION_STATUS, POSITION_INDEX } from '../config';

// ==========================================
// STYLES
// ==========================================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
  },
  header: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '24px 32px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  headerSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e40af',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb',
  },
  positionSection: {
    marginBottom: '24px',
  },
  positionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  positionName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  positionStats: {
    fontSize: '14px',
    color: '#6b7280',
  },
  candidateRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  candidateRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1e40af',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    marginRight: '12px',
    flexShrink: 0,
  },
  candidateInfo: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  candidateDetails: {
    fontSize: '12px',
    color: '#6b7280',
  },
  candidateBar: {
    width: '120px',
    textAlign: 'right',
    marginRight: '12px',
    flexShrink: 0,
  },
  voteCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e40af',
  },
  votePercentage: {
    fontSize: '12px',
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1e40af',
    borderRadius: '4px',
    transition: 'width 0.5s ease-in-out',
  },
  winnerBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    marginLeft: '8px',
  },
  tieBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#f59e0b',
    color: 'white',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    marginLeft: '8px',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
    color: 'white',
    borderColor: '#1e40af',
  },
  refreshButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1e40af',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#6b7280',
  },
  turnoutBar: {
    width: '100%',
    height: '24px',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
  },
  turnoutFill: {
    height: '100%',
    backgroundColor: '#1e40af',
    borderRadius: '12px',
    transition: 'width 0.5s ease-in-out',
  },
  turnoutLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  geographicBreakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  geoCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  geoName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  geoStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
  },
};

// ==========================================
// STATUS COLORS
// ==========================================
const getStatusStyle = (status) => {
  switch (status) {
    case ELECTION_STATUS.ACTIVE:
      return { backgroundColor: '#10b981', color: 'white' };
    case ELECTION_STATUS.PAUSED:
      return { backgroundColor: '#f59e0b', color: 'white' };
    case ELECTION_STATUS.ENDED:
      return { backgroundColor: '#6b7280', color: 'white' };
    case ELECTION_STATUS.NOT_STARTED:
      return { backgroundColor: '#3b82f6', color: 'white' };
    default:
      return { backgroundColor: '#6b7280', color: 'white' };
  }
};

const getStatusText = (started, ended, paused) => {
  if (paused) return 'PAUSED';
  if (ended) return 'ENDED';
  if (started) return 'LIVE';
  return 'NOT STARTED';
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const NationalResultsCenter = ({
  candidates = [],
  electionStarted = false,
  electionEnded = false,
  electionPaused = false,
  electionConfig,
  onRefresh,
  isLoading = false,
  totalRegisteredVoters = 0,
  totalVotesCast = 0,
  getWinnersByPosition,
  getTotalVotesForPosition,
  getVotePercentageForPosition,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Calculate total votes
  const totalVotes = useMemo(() => {
    return candidates.reduce((sum, c) => sum + Number(c.voteCount || 0), 0);
  }, [candidates]);

  // Group candidates by position
  const candidatesByPosition = useMemo(() => {
    const grouped = {};
    
    // Initialize all positions
    Object.values(POSITION_INDEX).forEach(pos => {
      grouped[pos] = [];
    });
    
    candidates.forEach(candidate => {
      const position = candidate.position || POSITION_INDEX[candidate.positionIndex];
      if (position && grouped[position]) {
        grouped[position].push(candidate);
      }
    });
    
    // Sort each position by vote count
    Object.keys(grouped).forEach(pos => {
      grouped[pos].sort((a, b) => Number(b.voteCount || 0) - Number(a.voteCount || 0));
    });
    
    return grouped;
  }, [candidates]);

  // Get winners for each position
  const winners = useMemo(() => {
    if (!getWinnersByPosition) return {};
    return getWinnersByPosition();
  }, [getWinnersByPosition]);

  // Turnout percentage
  const turnoutPercentage = useMemo(() => {
    if (totalRegisteredVoters === 0) return 0;
    return ((totalVotesCast / totalRegisteredVoters) * 100).toFixed(1);
  }, [totalVotesCast, totalRegisteredVoters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (onRefresh) onRefresh();
    setLastUpdated(new Date());
  }, [onRefresh]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    if (activeFilter === 'all') return Object.keys(candidatesByPosition);
    return [activeFilter];
  }, [activeFilter, candidatesByPosition]);

  // Render candidate row
  const renderCandidateRow = (candidate, index, position) => {
    const maxVotes = candidatesByPosition[position]?.[0]?.voteCount || 1;
    const percentage = getVotePercentageForPosition 
      ? getVotePercentageForPosition(candidate) 
      : ((candidate.voteCount / maxVotes) * 100).toFixed(1);
    const barWidth = maxVotes > 0 ? ((candidate.voteCount / maxVotes) * 100).toFixed(1) : 0;
    
    const winner = winners[position];
    const isWinner = winner && !winner.isTie && winner.winner?.id === candidate.id;
    const isTie = winner?.isTie && winner.tiedCandidates?.some(c => c.id === candidate.id);

    return (
      <div key={candidate.id} style={styles.candidateRow}>
        <div style={styles.candidateRank}>{index + 1}</div>
        <div style={styles.candidateInfo}>
          <div style={styles.candidateName}>
            {candidate.name}
            {isWinner && <span style={styles.winnerBadge}>WINNER</span>}
            {isTie && <span style={styles.tieBadge}>TIE</span>}
          </div>
          <div style={styles.candidateDetails}>
            {candidate.party && <span>{candidate.party} • </span>}
            {candidate.county && candidate.county}
            {candidate.constituency && `, ${candidate.constituency}`}
            {candidate.ward && `, ${candidate.ward}`}
          </div>
        </div>
        <div style={styles.candidateBar}>
          <div style={styles.voteCount}>{candidate.voteCount || 0}</div>
          <div style={styles.votePercentage}>{percentage}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${barWidth}%`,
                backgroundColor: isWinner ? '#10b981' : '#1e40af',
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render position section
  const renderPositionSection = (positionName, positionCandidates) => {
    if (!positionCandidates || positionCandidates.length === 0) return null;

    const totalPositionVotes = positionCandidates.reduce((sum, c) => sum + Number(c.voteCount || 0), 0);

    return (
      <div key={positionName} style={styles.positionSection}>
        <div style={styles.positionHeader}>
          <div>
            <div style={styles.positionName}>{positionName}</div>
            <div style={styles.positionStats}>
              {positionCandidates.length} candidates • {totalPositionVotes} total votes
            </div>
          </div>
        </div>
        {positionCandidates.map((candidate, index) => 
          renderCandidateRow(candidate, index, positionName)
        )}
      </div>
    );
  };

  // Render stats cards
  const renderStatsCards = () => (
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Total Votes Cast</div>
        <div style={styles.statValue}>{totalVotes.toLocaleString()}</div>
        <div style={styles.statSubtext}>Across all positions</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Registered Voters</div>
        <div style={styles.statValue}>{totalRegisteredVoters.toLocaleString()}</div>
        <div style={styles.statSubtext}>Eligible voters</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Turnout</div>
        <div style={styles.statValue}>{turnoutPercentage}%</div>
        <div style={styles.turnoutBar}>
          <div 
            style={{
              ...styles.turnoutFill,
              width: `${turnoutPercentage}%`,
            }}
          />
          <div style={styles.turnoutLabel}>{turnoutPercentage}%</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Candidates</div>
        <div style={styles.statValue}>{candidates.length}</div>
        <div style={styles.statSubtext}>Contesting {Object.keys(candidatesByPosition).filter(k => candidatesByPosition[k].length > 0).length} positions</div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          🇰🇪 National Election Results Center
        </div>
        <div style={styles.headerSubtitle}>
          {electionConfig?.name || 'General Election 2024'}
        </div>
        <div>
          <span style={{
            ...styles.statusBadge,
            ...getStatusStyle(getStatusText(electionStarted, electionEnded, electionPaused).toLowerCase().replace(' ', '_')),
          }}>
            {getStatusText(electionStarted, electionEnded, electionPaused)}
          </span>
          <span style={{ marginLeft: '12px', fontSize: '12px', opacity: 0.8 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filter Bar */}
      <div style={styles.section}>
        <div style={styles.filterBar}>
          <button
            style={{
              ...styles.filterButton,
              ...(activeFilter === 'all' ? styles.filterButtonActive : {}),
            }}
            onClick={() => setActiveFilter('all')}
          >
            All Positions
          </button>
          {Object.keys(candidatesByPosition).map(position => (
            candidatesByPosition[position].length > 0 && (
              <button
                key={position}
                style={{
                  ...styles.filterButton,
                  ...(activeFilter === position ? styles.filterButtonActive : {}),
                }}
                onClick={() => setActiveFilter(position)}
              >
                {position}
              </button>
            )
          ))}
          <button style={styles.refreshButton} onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Results by Position */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Results by Position</div>
        
        {isLoading ? (
          <div style={styles.loadingSpinner}>
            <div>Loading results...</div>
          </div>
        ) : filteredPositions.length === 0 || candidates.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Results Available
            </div>
            <div>
              {electionStarted 
                ? 'Votes are being counted. Please check back soon.'
                : 'Election has not started yet.'}
            </div>
          </div>
        ) : (
          filteredPositions.map(position => 
            renderPositionSection(position, candidatesByPosition[position])
          )
        )}
      </div>

      {/* Winners Summary */}
      {electionEnded && Object.keys(winners).some(k => winners[k]) && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🏆 Winners Summary</div>
          {Object.entries(winners).map(([position, winnerData]) => {
            if (!winnerData) return null;
            
            return (
              <div key={position} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{position}</div>
                {winnerData.isTie ? (
                  <div style={{ color: '#f59e0b' }}>
                    ⚠️ Tie between {winnerData.tiedCandidates.map(c => c.name).join(' & ')}
                  </div>
                ) : winnerData.winner ? (
                  <div style={{ color: '#10b981' }}>
                    ✅ {winnerData.winner.name} ({winnerData.winner.percentage}%)
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '12px' }}>
        <div>
          Results are updated in real-time as votes are cast on the blockchain.
        </div>
        <div style={{ marginTop: '4px' }}>
          Data source: DeVote National Smart Contract on Sepolia Testnet
        </div>
      </div>
    </div>
  );
};

export default NationalResultsCenter;