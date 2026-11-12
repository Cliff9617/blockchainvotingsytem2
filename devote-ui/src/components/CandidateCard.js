import React from "react";
import { getPositionDisplayName, getWinnerAreaDescription } from "../utils/electionFilters";
import { getCandidateImage } from "../utils/getCandidateImage";

const CandidateCard = ({
  candidate,
  hasVoted = false,
  onVote,
  isLoading = false,
  isLeading = false,
  isTiedLead = false,
  isWinner = false,
  isTieWinner = false,
  totalVotes = 0,
  getVotePercentage,
  canVote = true,
  showPosition = true,
}) => {
  const candidateId =
    candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? null;

  const candidateName = candidate?.name || "Unnamed Candidate";
  const voteCount = Number(candidate?.voteCount || 0);
  const party = candidate?.party;
  const candidateCode = candidate?.candidateCode;
  const county = candidate?.county;
  const constituency = candidate?.constituency;
  const ward = candidate?.ward;
  const position = candidate?.position;
  const pollingCenterName = candidate?.pollingCenterName;
  const pollingStationName = candidate?.pollingStationName;
  const candidateImage = getCandidateImage(candidate);
  const hasImage = candidate?.candidatePhoto || candidate?.imageData || candidate?.imageUrl;

  const percentage =
    typeof getVotePercentage === "function"
      ? getVotePercentage(voteCount)
      : totalVotes > 0
      ? Math.round((voteCount / totalVotes) * 100)
      : 0;

  // For demo purposes, voting is enabled for all logged-in voters
  const finalCanVote = canVote && !hasVoted;

  const handleVote = async () => {
    if (hasVoted) {
      return;
    }

    if (candidateId === null || candidateId === undefined) {
      alert("Invalid candidate");
      return;
    }

    try {
      await onVote(candidateId);
    } catch (err) {
      console.error("Failed to vote:", err);
      alert("Failed to vote. Please try again.");
    }
  };

  const getCardClasses = () => {
    let base =
      "bg-white rounded-2xl shadow-xl border p-6 hover:shadow-2xl transition-all duration-300 w-full max-w-full min-w-0 break-words";

    if (isWinner) {
      return `${base} border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100`;
    }

    if (isTieWinner) {
      return `${base} border-4 border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100`;
    }

    if (isTiedLead) {
      return `${base} border-4 border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100`;
    }

    if (isLeading) {
      return `${base} border-4 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100`;
    }

    return `${base} border-gray-200`;
  };

  const getBadge = () => {
    if (isWinner) {
      return {
        text: "Winner",
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      };
    }

    if (isTieWinner) {
      return {
        text: "Tie Winner",
        className: "bg-purple-100 text-purple-800 border border-purple-200",
      };
    }

    if (isTiedLead) {
      return {
        text: "Tied Lead",
        className: "bg-purple-100 text-purple-800 border border-purple-200",
      };
    }

    if (isLeading) {
      return {
        text: "Leading",
        className: "bg-blue-100 text-blue-800 border border-blue-200",
      };
    }

    return null;
  };

  const badge = getBadge();

  const progressBarClass = isWinner
    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
    : isTieWinner
    ? "bg-gradient-to-r from-purple-400 to-purple-600"
    : isTiedLead
    ? "bg-gradient-to-r from-purple-400 to-purple-600"
    : isLeading
    ? "bg-gradient-to-r from-blue-400 to-blue-600"
    : "bg-gradient-to-r from-gray-400 to-gray-600";

  // Get position display info
  const positionDisplay = position ? getPositionDisplayName(position) : null;
  const areaDisplay = position ? getWinnerAreaDescription(position, candidate) : null;

  return (
    <div className={getCardClasses()}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {candidateImage && !candidateImage.includes('placeholder') ? (
            <img
              src={candidateImage}
              alt={candidateName}
              className="w-14 h-14 rounded-full object-cover shadow-xl transition-all duration-300"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isWinner
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                  : isTieWinner
                  ? "bg-gradient-to-br from-purple-400 to-purple-600"
                  : isTiedLead
                  ? "bg-gradient-to-br from-purple-400 to-purple-600"
                  : isLeading
                  ? "bg-gradient-to-br from-blue-400 to-blue-600"
                  : "bg-gradient-to-br from-gray-400 to-gray-600"
              }`}
            >
              <span className="text-white text-2xl font-bold">
                {candidateName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-900">{candidateName}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-600">Candidate #{candidateId}</span>
              {candidateCode && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {candidateCode}
                </span>
              )}
              {positionDisplay && showPosition && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  {positionDisplay}
                </span>
              )}
            </div>
            {party && (
              <p className="text-sm text-gray-700 mt-1 font-medium">Party: {party}</p>
            )}
            {areaDisplay && (
              <p className="text-sm text-gray-600 mt-1">
                📍 {areaDisplay}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{voteCount}</div>
          <div className="text-xs text-gray-600 font-medium">Votes</div>
          <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
        </div>
      </div>

      {badge && (
        <div className="mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.className}`}>
            {badge.text}
          </span>
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${progressBarClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Geographical Details */}
      {(county || constituency || ward || pollingCenterName || pollingStationName) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Candidate Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            {positionDisplay && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>Position: {positionDisplay}</span>
              </div>
            )}
            {county && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>County: {county}</span>
              </div>
            )}
            {constituency && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>Constituency: {constituency}</span>
              </div>
            )}
            {ward && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>Ward: {ward}</span>
              </div>
            )}
            {pollingCenterName && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>Center: {pollingCenterName}</span>
              </div>
            )}
            {pollingStationName && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400"></span>
                <span>Station: {pollingStationName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm gap-3 flex-wrap break-words">
        <div className="flex items-center flex-wrap gap-2">
          {hasVoted ? (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
              Already Voted
            </span>
          ) : (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
              Eligible
            </span>
          )}
        </div>

        <button
          onClick={() => onVote(candidateId)}
          disabled={hasVoted || !finalCanVote}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-ring shadow-lg whitespace-nowrap"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Voting...</span>
            </div>
          ) : hasVoted ? (
            "Already Voted"
          ) : (
            "Cast Your Vote"
          )}
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;