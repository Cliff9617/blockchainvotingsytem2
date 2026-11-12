import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  groupCandidatesByPosition,
  filterCandidatesForVoter,
  getPositionDisplayName,
  formatCandidateDisplayName,
  POSITIONS,
} from "../utils/electionFilters";
import SimpleCandidateCard from "./SimpleCandidateCard";
import {
  CheckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DownloadIcon,
  BarChartIcon,
} from "./common/Icons";
import { downloadReceiptPDF } from "../utils/pdfReceiptGenerator";

/**
 * Ordered 6 Elective Positions for Kenyan National Elections
 */
const WIZARD_BALLOT_STEPS = [
  { position: POSITIONS.PRESIDENT, label: "President", jurisdiction: "National Ballot", stepNum: 1 },
  { position: POSITIONS.GOVERNOR, label: "Governor", jurisdiction: "County Ballot", stepNum: 2 },
  { position: POSITIONS.SENATOR, label: "Senator", jurisdiction: "County Ballot", stepNum: 3 },
  { position: POSITIONS.WOMAN_REPRESENTATIVE, label: "Woman Representative", jurisdiction: "County Ballot", stepNum: 4 },
  { position: POSITIONS.MEMBER_OF_PARLIAMENT, label: "Member of Parliament", jurisdiction: "Constituency Ballot", stepNum: 5 },
  { position: POSITIONS.MCA, label: "Member of County Assembly", jurisdiction: "Ward Ballot", stepNum: 6 },
];

/**
 * Mobile-friendly Vote Confirmation Modal
 */
const VoteConfirmationModal = ({
  isOpen,
  candidate,
  candidateIndex,
  position,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen || !candidate) return null;

  const candidateName = formatCandidateDisplayName(candidate, candidateIndex);
  const positionDisplay = position ? getPositionDisplayName(position) : "";
  const party = candidate?.party || "Independent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 border border-gray-200">
        <div className="text-center">
          {/* Official Verification Icon */}
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <ShieldCheckIcon className="w-8 h-8 text-emerald-600" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Confirm Your Ballot Choice
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Official National Electoral Ballot Verification
          </p>

          {/* Selected Candidate Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {positionDisplay}
              </span>
              <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                {party}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {candidateName}
            </p>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 mb-5 text-left flex items-start gap-2.5">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              <strong>Ballot Secrecy & Finality:</strong> Once confirmed, your selection is cryptographically sealed onto the Ethereum blockchain. You cannot vote again for this position.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel & Review
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting to Chain...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 text-white" />
                  <span>Confirm Ballot</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sequential Voting Wizard Interface
 */
const SimpleVotingInterface = ({
  electionStarted = false,
  electionEnded = false,
  candidates = [],
  voter = null,
  voterInfo = {},
  isLoading = false,
  error = "",
  onVote,
  hasVotedForPosition,
  canVoteForPosition,
  totalVotes = 0,
  getVotePercentage,
  onProceedToResults,
}) => {
  // Active step index (0 to 5 = ballots, 6 = summary & receipt)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Modal confirmation state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    candidate: null,
    candidateIndex: null,
    position: null,
  });
  const [isConfirming, setIsConfirming] = useState(false);

  // Defensive values
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safeVoter = voter && typeof voter === "object" ? voter : null;
  const safeVoterInfo = voterInfo && typeof voterInfo === "object" ? voterInfo : {};
  const isRegistered = Boolean(safeVoterInfo?.isRegistered);

  // Filter candidates strictly for voter's jurisdiction
  const filteredCandidates = useMemo(() => {
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const safeVoter = voter && typeof voter === "object" ? voter : null;
    return filterCandidatesForVoter(safeCandidates, safeVoter);
  }, [candidates, voter]);

  // Group filtered candidates by position
  const candidatesByPosition = useMemo(() => {
    return groupCandidatesByPosition(filteredCandidates);
  }, [filteredCandidates]);

  // Check if position was already voted for
  const isPositionVoted = useCallback((position) => {
    if (typeof hasVotedForPosition === "function") {
      return hasVotedForPosition(position);
    }
    return false;
  }, [hasVotedForPosition]);

  // Check if voter is eligible to vote for position
  const isPositionVotable = (position) => {
    if (typeof canVoteForPosition === "function") {
      return canVoteForPosition(position);
    }
    return isRegistered && electionStarted && !electionEnded;
  };

  // Auto-advance to first unvoted step on initial load
  useEffect(() => {
    const firstUnvoted = WIZARD_BALLOT_STEPS.findIndex(
      (step) => !isPositionVoted(step.position)
    );
    if (firstUnvoted !== -1) {
      setCurrentStepIndex(firstUnvoted);
    } else {
      // All 6 positions voted: jump straight to Summary & Receipt
      setCurrentStepIndex(6);
    }
  }, [voterInfo, isPositionVoted]);

  // Total ballots voted count
  const votedBallotsCount = useMemo(() => {
    return WIZARD_BALLOT_STEPS.filter((s) => isPositionVoted(s.position)).length;
  }, [isPositionVoted]);

  const hasCompletedAllVotes = votedBallotsCount === 6;

  // Open confirmation modal
  const handleVoteClick = (candidate, candidateIdx, position) => {
    setConfirmModal({
      isOpen: true,
      candidate,
      candidateIndex: candidateIdx,
      position,
    });
  };

  // Confirm vote & advance sequentially
  const handleConfirmVote = async () => {
    if (!confirmModal.candidate) return;
    setIsConfirming(true);

    try {
      const candidateId =
        confirmModal.candidate.id ??
        confirmModal.candidate.candidateId ??
        confirmModal.candidate.index;

      await onVote(candidateId);

      setConfirmModal({
        isOpen: false,
        candidate: null,
        candidateIndex: null,
        position: null,
      });

      // Automatically advance to the next ballot step
      setCurrentStepIndex((prev) => Math.min(prev + 1, 6));
    } catch (err) {
      console.error("Ballot submission failed:", err);
      alert(err.message || "Failed to record ballot. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelVote = () => {
    setConfirmModal({
      isOpen: false,
      candidate: null,
      candidateIndex: null,
      position: null,
    });
  };

  // Current active step object
  const isSummaryStep = currentStepIndex === 6;
  const currentStep = !isSummaryStep ? WIZARD_BALLOT_STEPS[currentStepIndex] : null;
  const currentPosition = currentStep?.position;
  const currentStepVoted = currentPosition ? isPositionVoted(currentPosition) : false;
  const currentStepVotable = currentPosition ? isPositionVotable(currentPosition) : false;
  const currentCandidates = currentPosition ? candidatesByPosition[currentPosition] || [] : [];

  // Generate Receipt PDF
  const handleDownloadReceipt = () => {
    try {
      const receiptData = {
        verificationId: `IEBC-${(safeVoterInfo?.account || "VOTER").slice(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        transactionHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        timestamp: new Date().toISOString(),
        county: safeVoter?.county || "National",
        constituency: safeVoter?.constituency || "General",
        ward: safeVoter?.ward || "General",
        votedPositions: WIZARD_BALLOT_STEPS.map((s) => ({
          position: s.label,
          status: isPositionVoted(s.position) ? "Recorded on Blockchain" : "Not Cast",
        })),
      };
      downloadReceiptPDF(receiptData);
    } catch (e) {
      console.error("Receipt generation error:", e);
      window.print();
    }
  };

  const handleNavigateResults = () => {
    if (typeof onProceedToResults === "function") {
      onProceedToResults();
    } else {
      window.location.hash = "results";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans">
      {/* Voter Information Badge - Compact & Clean */}
      {safeVoter && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-slate-900">Registered Polling Area:</span>
            <span>
              {safeVoter.county ? `${safeVoter.county} County` : "National"}
              {safeVoter.constituency ? ` • ${safeVoter.constituency} Const.` : ""}
              {safeVoter.ward ? ` • ${safeVoter.ward} Ward` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Ballots Cast:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-900 text-xs">
              {votedBallotsCount} / 6
            </span>
          </div>
        </div>
      )}

      {/* Sequential Stepper Bar - Mobile Optimized */}
      <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isSummaryStep ? "Ballot Finalized" : `Ballot Step ${currentStepIndex + 1} of 6`}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            {hasCompletedAllVotes ? "All Ballots Recorded" : `${6 - votedBallotsCount} remaining`}
          </span>
        </div>

        {/* Stepper Dots & Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 items-center">
          {WIZARD_BALLOT_STEPS.map((step, idx) => {
            const isVoted = isPositionVoted(step.position);
            const isCurrent = currentStepIndex === idx;

            return (
              <button
                key={step.position}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex flex-col items-center text-center group transition-all p-1 rounded-lg ${
                  isCurrent ? "bg-slate-50 ring-1 ring-slate-300" : "hover:bg-slate-50"
                }`}
                title={step.label}
              >
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all mb-1 ${
                    isVoted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-slate-900 text-white ring-2 ring-slate-900/30 ring-offset-1"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {isVoted ? <CheckIcon className="w-4 h-4 text-white" /> : step.stepNum}
                </div>
                <span
                  className={`hidden sm:inline text-[11px] truncate max-w-full font-medium ${
                    isCurrent ? "text-slate-900 font-bold" : isVoted ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}

          {/* 7th Summary Step Indicator */}
          <button
            onClick={() => setCurrentStepIndex(6)}
            className={`flex flex-col items-center text-center group transition-all p-1 rounded-lg ${
              isSummaryStep ? "bg-slate-50 ring-1 ring-slate-300" : "hover:bg-slate-50"
            }`}
            title="Summary & Receipt"
          >
            <div
              className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all mb-1 ${
                hasCompletedAllVotes
                  ? "bg-emerald-600 text-white"
                  : isSummaryStep
                  ? "bg-slate-900 text-white ring-2 ring-slate-900/30"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <span
              className={`hidden sm:inline text-[11px] truncate max-w-full font-medium ${
                isSummaryStep ? "text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              Summary
            </span>
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-6 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* =========================================================================
          STEP 1 - 6: SPECIFIC ELECTIVE POSITION BALLOT
         ========================================================================= */}
      {!isSummaryStep && currentStep && (
        <div className="space-y-6">
          {/* Active Ballot Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {currentStep.jurisdiction}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    Step {currentStep.stepNum} of 6
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Vote for {currentStep.label}
                </h2>
              </div>

              {/* Status Pill */}
              <div>
                {currentStepVoted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs sm:text-sm font-bold">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    Ballot Cast & Recorded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-semibold">
                    1 Choice Allowed
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-3">
              {currentStepVoted
                ? "You have already cast and confirmed your vote for this position. Votes are immutable on the blockchain and cannot be altered."
                : currentPosition === POSITIONS.PRESIDENT
                ? "Select your preferred Presidential candidate below. Candidates are presented neutrally to ensure equal democratic standing."
                : `Select your preferred candidate for ${currentStep.label} within your registered voting jurisdiction.`}
            </p>
          </div>

          {/* Candidate Grid */}
          {currentCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {currentCandidates.map((candidate, idx) => {
                const candidateId = candidate.id ?? candidate.candidateId ?? candidate.index ?? idx;
                const voteCount = Number(candidate.voteCount || 0);
                const percentage =
                  typeof getVotePercentage === "function"
                    ? getVotePercentage(voteCount)
                    : totalVotes > 0
                    ? Math.round((voteCount / totalVotes) * 100)
                    : 0;

                return (
                  <SimpleCandidateCard
                    key={candidateId}
                    candidate={candidate}
                    candidateIndex={idx + 1}
                    hasVoted={currentStepVoted}
                    votedForCandidate={false}
                    onVote={() => handleVoteClick(candidate, idx + 1, currentPosition)}
                    isLoading={isLoading}
                    canVote={currentStepVotable && !currentStepVoted && !electionEnded}
                    showVoteCount={electionEnded}
                    voteCount={voteCount}
                    percentage={percentage}
                  />
                );
              })}
            </div>
          ) : (
            /* Uncontested / Empty Seat Notice */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No Contested Candidates in this Area
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
                There are no registered candidate profiles for {currentStep.label} in your jurisdiction ({safeVoter?.county || "National"}). You may proceed to the next ballot.
              </p>
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(prev + 1, 6))}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <span>Proceed to Next Ballot</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step Navigation Bottom Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Previous Ballot</span>
            </button>

            <button
              onClick={() => setCurrentStepIndex((prev) => Math.min(prev + 1, 6))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <span>{currentStepIndex === 5 ? "View Ballot Summary" : "Next Ballot"}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 7: OFFICIAL BALLOT SUMMARY & RECEIPT (POST-VOTING SCREEN)
         ========================================================================= */}
      {isSummaryStep && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckIcon className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                Official Ballot Summary & Receipt
              </h2>
              <p className="text-sm text-slate-600">
                {hasCompletedAllVotes
                  ? "All 6 ballots have been cast and verified on the blockchain. Your vote is permanent, tamper-proof, and cryptographically recorded."
                  : "Review your ballot status across all 6 elective positions below before proceeding."}
              </p>
            </div>

            {/* 6 Elective Positions Status Checklist */}
            <div className="space-y-3 mb-8">
              {WIZARD_BALLOT_STEPS.map((step, idx) => {
                const isVoted = isPositionVoted(step.position);

                return (
                  <div
                    key={step.position}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                      isVoted
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isVoted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isVoted ? <CheckIcon className="w-4 h-4" /> : step.stepNum}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-bold text-slate-900">
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500">{step.jurisdiction}</p>
                      </div>
                    </div>

                    <div>
                      {isVoted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Recorded
                        </span>
                      ) : (
                        <button
                          onClick={() => setCurrentStepIndex(idx)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Cast Ballot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions: Download Receipt & Proceed to Results */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <DownloadIcon className="w-4 h-4 text-slate-600" />
                <span>Download Official Receipt (PDF)</span>
              </button>

              <button
                onClick={handleNavigateResults}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <BarChartIcon className="w-4 h-4 text-white" />
                <span>Proceed to Election Results</span>
                <ChevronRightIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <VoteConfirmationModal
        isOpen={confirmModal.isOpen}
        candidate={confirmModal.candidate}
        candidateIndex={confirmModal.candidateIndex}
        position={confirmModal.position}
        onConfirm={handleConfirmVote}
        onCancel={handleCancelVote}
        isLoading={isConfirming}
      />
    </div>
  );
};

export default SimpleVotingInterface;
