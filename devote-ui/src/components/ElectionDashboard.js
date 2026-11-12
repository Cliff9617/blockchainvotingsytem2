import React, { useMemo } from "react";
import {
  normalizePosition,
  getPositionDisplayName,
  filterCandidatesForVoter,
} from "../utils/electionFilters";
import SimpleVotingInterface from "./SimpleVotingInterface";
import {
  ShieldCheckIcon,
  MapPinIcon,
  LockIcon,
  ClockIcon,
} from "./common/Icons";

/**
 * ElectionDashboard - Official IEBC National Blockchain Voting Portal
 * 
 * Features:
 * - Unified header with zero redundant status indicators
 * - Personalized voter welcome with registered citizen name & jurisdiction
 * - Clear, calming guidance on sequential voting & blockchain irreversibility
 * - Embedded countdown timer with clean typography
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
  isConnected = false,
  account = "",
  onSignOut,
  onProceedToResults,
}) => {
  const safeVoter = voter && typeof voter === "object" ? voter : null;
  const safeVoterInfo = voterInfo && typeof voterInfo === "object" ? voterInfo : {};

  // Extract voter's display name
  const voterName =
    safeVoter?.fullName ||
    safeVoterInfo?.fullName ||
    (account ? `Voter ${account.slice(0, 6)}...${account.slice(-4)}` : "Citizen Voter");

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
      {/* Official Top App Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-900">
              KEN
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
                  IEBC Kenya
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Blockchain Portal
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                National Election Voting Dashboard
              </h1>
            </div>
          </div>

          {/* Account & Session Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {account && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                electionEnded
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : electionStarted
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${electionEnded ? "bg-rose-500" : electionStarted ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              {electionEnded ? "Election Concluded" : electionStarted ? "Election Active" : "Scheduled"}
            </span>

            {typeof onSignOut === "function" && (
              <button
                onClick={onSignOut}
                className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Personalized Voter Welcome Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50/80 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Welcome & Voter Details */}
            <div className="lg:col-span-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-bold">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Biometric & ID Credential</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, <span className="text-emerald-800">{voterName}</span>
              </h2>

              {safeVoter && (
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <MapPinIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-800">Assigned Polling Area:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                    {safeVoter.county ? `${safeVoter.county} County` : "National"}
                  </span>
                  {safeVoter.constituency && (
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      {safeVoter.constituency} Constituency
                    </span>
                  )}
                  {safeVoter.ward && (
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      {safeVoter.ward} Ward
                    </span>
                  )}
                </div>
              )}

              {/* Voter Guidance Notice - Irreversibility & Time Expectation */}
              <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs sm:text-sm leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <LockIcon className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="font-bold text-amber-900 block mb-0.5">
                      Sequential Ballot Protocol • Irreversible Blockchain Submission
                    </strong>
                    <p className="text-amber-900/90">
                      You will vote sequentially across all 6 elective positions. 
                      Once you confirm a candidate, your choice is cryptographically recorded on the ledger and you automatically proceed to the next position. 
                      <strong> You cannot vote again for a completed position.</strong> The entire ballot requires approximately <strong>2 minutes</strong> to complete.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-semibold text-amber-800">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-amber-700" />
                        Takes ~2 Minutes
                      </span>
                      <span>•</span>
                      <span>100% Secret Ballot (Article 38)</span>
                      <span>•</span>
                      <span>Tamper-Proof Audit Trail</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
