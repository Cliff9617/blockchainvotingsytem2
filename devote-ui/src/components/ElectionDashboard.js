import React, { useMemo } from "react";
import {
  POSITIONS,
  normalizePosition,
  getPositionDisplayName,
  filterCandidatesForVoter,
} from "../utils/electionFilters";
import SimpleVotingInterface from "./SimpleVotingInterface";
import ElectionTimer from "./ElectionTimer";

/**
 * ElectionDashboard - Streamlined Voter Experience
 * Focuses purely on voting flow with zero clutter, zero emojis, and fast mobile navigation.
 */
const ElectionDashboard = ({
  electionStarted = false,
  electionEnded = false,
  candidates = [],
  hasVoted = false,
  voterInfo = {},
  voter = null,
  isLoading = false,
  error = "",
  onVote,
  hasVotedForPosition,
  canVoteForPosition,
  totalVotes = 0,
  getVotePercentage,
  isAdmin = false,
  onProceedToResults,
}) => {
  const safeVoter = voter && typeof voter === "object" ? voter : null;
  const safeVoterInfo = voterInfo && typeof voterInfo === "object" ? voterInfo : {};

  // Filter candidates strictly matching voter jurisdiction
  const filteredCandidates = useMemo(() => {
    return filterCandidatesForVoter(candidates, safeVoter);
  }, [candidates, safeVoter]);

  // Position-aware vote submission
  const handleVote = async (candidateId) => {
    const candidate = candidates.find(
      (c) => (c.id || c.candidateId || c.index) === candidateId
    );

    if (candidate) {
      const candidatePosition = normalizePosition(candidate.position);
      if (hasVotedForPosition && hasVotedForPosition(candidatePosition)) {
        throw new Error(`You have already voted for ${getPositionDisplayName(candidatePosition)}`);
      }
    }

    return onVote(candidateId);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 w-full overflow-x-hidden font-sans">
      {/* Official Clean Header Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              National Election Platform
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Official Voter Ballot Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ElectionTimer electionStarted={electionStarted} electionEnded={electionEnded} />
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                electionEnded
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : electionStarted
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {electionEnded ? "Election Concluded" : electionStarted ? "Election Active" : "Scheduled"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Sequential Voting Interface */}
      <main className="w-full">
        <SimpleVotingInterface
          electionStarted={electionStarted}
          electionEnded={electionEnded}
          candidates={filteredCandidates}
          voter={safeVoter}
          voterInfo={safeVoterInfo}
          isLoading={isLoading}
          error={error}
          onVote={handleVote}
          hasVotedForPosition={hasVotedForPosition}
          canVoteForPosition={canVoteForPosition}
          totalVotes={totalVotes}
          getVotePercentage={getVotePercentage}
          onProceedToResults={onProceedToResults}
        />
      </main>
    </div>
  );
};

export default ElectionDashboard;
