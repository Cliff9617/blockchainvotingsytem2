import React from "react";
import { getPositionDisplayName, getWinnerAreaDescription } from "../utils/electionFilters";
import { getCandidateImage } from "../utils/getCandidateImage";

/**
 * SimpleCandidateCard - Redesigned for maximum simplicity and voter clarity
 * 
 * Design principles:
 * - Large, clear candidate photo/avatar
 * - Candidate name in large bold text
 * - Party and position clearly visible
 * - Area description (Kenya/County/Constituency/Ward)
 * - Large, full-width vote button
 * - Clear voted status indicators
 * - No cluttered details boxes
 */
const SimpleCandidateCard = ({
  candidate,
  hasVoted = false,
  votedForCandidate = false,
  onVote,
  isLoading = false,
  isWinner = false,
  isLeading = false,
  canVote = true,
  showVoteCount = false,
  voteCount = 0,
  percentage = 0,
}) => {
  const candidateId =
    candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? null;

  const candidateName = candidate?.name || "Unnamed Candidate";
  const party = candidate?.party || "Independent";
  const position = candidate?.position;
  
  // Get position display info
  const positionDisplay = position ? getPositionDisplayName(position) : "";
  const areaDisplay = position ? getWinnerAreaDescription(position, candidate) : "";

  // Get avatar initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const candidateImage = getCandidateImage(candidate);
  const hasImage = candidate?.candidatePhoto || candidate?.imageData || candidate?.imageUrl;

  // Determine card styling based on status
  const getCardClasses = () => {
    let base = "bg-white rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 w-full";
    
    if (votedForCandidate) {
      return `${base} border-green-500 bg-green-50`;
    }
    if (hasVoted && !votedForCandidate) {
      return `${base} border-gray-200 bg-gray-50 opacity-75`;
    }
    if (isWinner) {
      return `${base} border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100`;
    }
    if (isLeading) {
      return `${base} border-blue-300 bg-blue-50`;
    }
    return `${base} border-gray-200 hover:border-blue-300 hover:shadow-xl`;
  };

  // Determine button state and text
  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: "Processing...",
        disabled: true,
        className: "bg-gray-400 cursor-wait"
      };
    }
    if (votedForCandidate) {
      return {
        text: "✅ You voted for this candidate",
        disabled: true,
        className: "bg-green-500 cursor-default"
      };
    }
    if (hasVoted && !votedForCandidate) {
      return {
        text: `Already voted for ${positionDisplay}`,
        disabled: true,
        className: "bg-gray-300 cursor-not-allowed"
      };
    }
    if (!canVote) {
      return {
        text: "Voting not available",
        disabled: true,
        className: "bg-gray-300 cursor-not-allowed"
      };
    }
    return {
      text: `Vote for ${candidateName}`,
      disabled: false,
      className: "bg-green-600 hover:bg-green-700 cursor-pointer"
    };
  };

  const buttonConfig = getButtonConfig();

  const handleVoteClick = () => {
    if (!canVote || hasVoted || isLoading) return;
    onVote(candidateId);
  };

  return (
    <div className={getCardClasses()}>
      {/* Winner/Leading Badge */}
      {(isWinner || isLeading) && !hasVoted && (
        <div className="mb-4">
          {isWinner && (
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full border border-yellow-200">
              🏆 Winner
            </span>
          )}
          {isLeading && !isWinner && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full border border-blue-200">
              ⭐ Leading
            </span>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center text-center">
        {/* Candidate Photo/Avatar */}
        <div className="mb-4">
          {hasImage ? (
            <img
              src={candidateImage}
              alt={candidateName}
              className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 border-white bg-gradient-to-br from-green-500 to-green-700">
              <span className="text-white text-3xl font-bold">
                {getInitials(candidateName)}
              </span>
            </div>
          )}
        </div>

        {/* Candidate Name - Large and Bold */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
          {candidateName}
        </h3>

        {/* Party */}
        <p className="text-lg text-gray-700 font-semibold mb-1">
          {party}
        </p>

        {/* Position */}
        <p className="text-base text-gray-600 mb-1">
          {positionDisplay}
        </p>

        {/* Area */}
        {areaDisplay && (
          <p className="text-sm text-gray-500 mb-4">
            📍 {areaDisplay}
          </p>
        )}

        {/* Vote Count (optional, kept small) */}
        {showVoteCount && !hasVoted && (
          <div className="mb-4 text-sm text-gray-500">
            {voteCount} votes ({percentage}%)
          </div>
        )}

        {/* Voted Status Indicator */}
        {hasVoted && (
          <div className={`mb-4 px-4 py-2 rounded-full text-sm font-semibold ${
            votedForCandidate 
              ? "bg-green-100 text-green-700 border border-green-200" 
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}>
            {votedForCandidate 
              ? "✅ Your choice" 
              : `Voted for ${positionDisplay}`}
          </div>
        )}

        {/* Eligibility Badge (when not voted yet) */}
        {!hasVoted && canVote && (
          <div className="mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
            ✓ Eligible to vote
          </div>
        )}

        {!hasVoted && !canVote && (
          <div className="mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
            ✗ Not eligible in your area
          </div>
        )}

        {/* Vote Button - Large and Full Width */}
        <button
          onClick={handleVoteClick}
          disabled={buttonConfig.disabled}
          className={`w-full py-4 px-6 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 ${buttonConfig.className}`}
        >
          {buttonConfig.text}
        </button>
      </div>
    </div>
  );
};

export default SimpleCandidateCard;