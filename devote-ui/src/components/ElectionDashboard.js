import React, { useMemo, useEffect } from "react";
import SimpleVotingInterface from "./SimpleVotingInterface";
import ElectionTimer from "./ElectionTimer";
import {
  filterCandidatesForVoter,
  groupCandidatesByPosition,
  getPositionCounts,
  normalizePosition,
  POSITIONS,
  getPositionDisplayName,
  calculateWinnersByPosition,
  getWinnerAreaDescription,
} from "../utils/electionFilters";

/**
 * ElectionDashboard - Main election interface
 * 
 * This component now serves as a wrapper that:
 * 1. Shows election stats (candidates, votes, registration status)
 * 2. Shows winners when election ends
 * 3. Delegates voting to SimpleVotingInterface
 */
const ElectionDashboard = ({
  electionStarted = false,
  electionEnded = false,
  candidates = [],
  hasVoted = false,
  voterInfo = {},
  voter = null, // { county, constituency, ward } for location-based filtering
  isLoading = false,
  error = "",
  onVote,
  totalVotes = 0,
  getVotePercentage,
  getLeadingCandidates,
  getWinnerResult,
  getWinnersByPosition,
  hasVotedForPosition,
  canVoteForPosition,
  isAdmin = false, // Admin flag - admin doesn't need voter registration
}) => {
  // Defensive guard: Ensure candidates is always an array
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  
  // Defensive guard: Ensure voter object has safe properties
  const safeVoter = voter && typeof voter === 'object' ? voter : null;
  
  // Defensive guard: Ensure voterInfo is an object
  const safeVoterInfo = voterInfo && typeof voterInfo === 'object' ? voterInfo : {};

  // Admin does not need to be registered as a voter - they have admin access
  const isRegistered = isAdmin ? true : safeVoterInfo?.isRegistered;

  // Filter candidates based on voter location
  const filteredCandidates = useMemo(() => {
    const filtered = filterCandidatesForVoter(safeCandidates, safeVoter);
    return filtered;
  }, [safeCandidates, safeVoter]);


  // Get position counts
  const positionCounts = useMemo(() => {
    return getPositionCounts(filteredCandidates);
  }, [filteredCandidates]);

  // Calculate winners by position
  const winnersByPosition = useMemo(() => {
    if (electionEnded && typeof getWinnersByPosition === 'function') {
      return getWinnersByPosition();
    }
    return calculateWinnersByPosition(filteredCandidates || [], safeVoter);
  }, [electionEnded, filteredCandidates, safeVoter, getWinnersByPosition]);

  // Wrap onVote - handle position-based voting
  const handleVote = async (candidateId) => {
    console.log('[ElectionDashboard] Voting for candidate:', candidateId);
    
    // Find the candidate to get their position
    const candidate = candidates.find(c => 
      (c.id || c.candidateId || c.index) === candidateId
    );
    
    if (candidate) {
      const candidatePosition = normalizePosition(candidate.position);
      console.log('[ElectionDashboard] Candidate position:', candidatePosition);
      
      // Check if voter has already voted for this position
      if (hasVotedForPosition && hasVotedForPosition(candidatePosition)) {
        throw new Error(`You have already voted for ${getPositionDisplayName(candidatePosition)}`);
      }
    }
    
    return onVote(candidateId);
  };

  // Get overall vote status
  const getOverallVoteStatus = () => {
    const positions = [POSITIONS.PRESIDENT, POSITIONS.GOVERNOR, POSITIONS.SENATOR, 
                       POSITIONS.WOMAN_REPRESENTATIVE, POSITIONS.MEMBER_OF_PARLIAMENT, POSITIONS.MCA];
    const eligiblePositions = positions.filter(pos => (positionCounts?.[pos] || 0) > 0);
    
    if (eligiblePositions.length === 0) return "No positions available";
    
    const votedCount = eligiblePositions.filter(pos => 
      typeof hasVotedForPosition === 'function' && hasVotedForPosition(pos)
    ).length;
    
    if (votedCount === eligiblePositions.length) {
      return "All positions voted";
    }
    return `${votedCount}/${eligiblePositions.length} voted`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Election Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Secure voter portal for viewing candidates and casting your vote
              </p>
              {safeVoter && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">
                    📍 Your registered voting area:
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-700 mt-1">
                    <span><strong>County:</strong> {safeVoter.county || 'Not specified'}</span>
                    <span><strong>Constituency:</strong> {safeVoter.constituency || 'Not specified'}</span>
                    <span><strong>Ward:</strong> {safeVoter.ward || 'Not specified'}</span>
                  </div>
                </div>
              )}
              {!safeVoter && (
                <p className="text-sm text-gray-500 mt-2">
                  Viewing national results only (Presidential candidates)
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <ElectionTimer
                electionStarted={electionStarted}
                electionEnded={electionEnded}
              />

              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  electionEnded
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : electionStarted
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }`}
              >
                {electionEnded
                  ? "Election Ended"
                  : electionStarted
                  ? "Election Active"
                  : "Not Started"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-hidden">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredCandidates.length}
                </p>
                {voter && filteredCandidates.length !== candidates.length && (
                  <p className="text-xs text-gray-500 mt-1">
                    ({candidates.length} overall)
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{totalVotes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">🗳️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registration</p>
                <p
                  className={`text-lg font-semibold ${
                    isRegistered ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {isRegistered ? "Registered" : "Not Registered"}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">
                  {isRegistered ? "✅" : "❌"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vote Status</p>
                <p
                  className={`text-lg font-semibold ${
                    getOverallVoteStatus() === "All positions voted"
                      ? "text-green-600" 
                      : "text-blue-600"
                  }`}
                >
                  {getOverallVoteStatus()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xl">
                  {getOverallVoteStatus() === "All positions voted" ? "🗳️" : "🕒"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Not Registered Warning - hide for admin */}
        {!isRegistered && !isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-600 text-xl">ℹ️</span>
              <div>
                <h3 className="text-yellow-800 font-semibold">
                  You are not registered yet
                </h3>
                <p className="text-yellow-700 mt-1">
                  Only registered voters can participate in the election. Contact
                  the administrator if your wallet should be approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Position-specific winners when election ends */}
        {electionEnded && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Election Results by Position</h2>
            
            {Object.entries(winnersByPosition).map(([position, winnerInfo]) => {
              if (!winnerInfo || position === 'unknown') return null;
              
              return (
                <div key={position} className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl shadow-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                      🏆 {getPositionDisplayName(position)}
                    </h3>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {winnerInfo.votes} votes
                    </span>
                  </div>
                  
                  {winnerInfo.isTie ? (
                    <div className="space-y-3">
                      <p className="text-yellow-100 font-semibold">Tie Declared!</p>
                      {winnerInfo.tiedCandidates.map((candidate, idx) => (
                        <div key={idx} className="bg-white/10 rounded-lg p-3">
                          <p className="font-bold text-lg">{candidate.name}</p>
                          <p className="text-yellow-100 text-sm">
                            {candidate.party || 'Independent'} • {candidate.percentage}%
                          </p>
                          <p className="text-yellow-200 text-xs mt-1">
                            {getWinnerAreaDescription(position, candidate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : winnerInfo.winner ? (
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-bold text-2xl">{winnerInfo.winner.name}</p>
                      <p className="text-yellow-100">
                        {winnerInfo.winner.party || 'Independent'}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-3xl font-bold">{winnerInfo.winner.percentage}%</span>
                        <span className="text-yellow-200 text-sm">
                          {getWinnerAreaDescription(position, winnerInfo.winner)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Simple Voting Interface - handles all voting */}
        <SimpleVotingInterface
          electionStarted={electionStarted}
          electionEnded={electionEnded}
          candidates={candidates}
          voter={safeVoter}
          voterInfo={safeVoterInfo}
          isLoading={isLoading}
          error={error}
          onVote={handleVote}
          hasVotedForPosition={hasVotedForPosition}
          canVoteForPosition={canVoteForPosition}
          totalVotes={totalVotes}
          getVotePercentage={getVotePercentage}
        />
      </div>
    </div>
  );
};

export default ElectionDashboard;