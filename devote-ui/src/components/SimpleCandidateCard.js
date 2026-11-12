import React from "react";
import { getPositionDisplayName, getWinnerAreaDescription, formatCandidateDisplayName } from "../utils/electionFilters";
import { getCandidateImage } from "../utils/getCandidateImage";
import { CheckIcon, MapPinIcon, AwardIcon } from "./common/Icons";

/**
 * SimpleCandidateCard - Streamlined, distraction-free candidate card
 * Built for mobile phones and desktop with high clarity and zero visual noise.
 */
const SimpleCandidateCard = ({
  candidate,
  candidateIndex = null,
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
  const candidateId = candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? null;
  const candidateName = formatCandidateDisplayName(candidate, candidateIndex);
  const party = candidate?.party || "Independent";
  const position = candidate?.position;
  
  const positionDisplay = position ? getPositionDisplayName(position) : "";
  const areaDisplay = position ? getWinnerAreaDescription(position, candidate) : "";

  // Initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const candidateImage = getCandidateImage(candidate);
  const hasImage = Boolean(candidate?.candidatePhoto || candidate?.imageData || candidate?.imageUrl);

  // Card border styling
  const getCardClasses = () => {
    const base = "bg-white rounded-2xl shadow-sm border p-4 sm:p-6 transition-all duration-200 w-full flex flex-col justify-between";
    if (votedForCandidate) {
      return `${base} border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20`;
    }
    if (hasVoted && !votedForCandidate) {
      return `${base} border-gray-200 bg-gray-50/60 opacity-60`;
    }
    if (isWinner) {
      return `${base} border-amber-400 bg-amber-50/30`;
    }
    if (isLeading) {
      return `${base} border-blue-300 bg-blue-50/20`;
    }
    return `${base} border-gray-200 hover:border-gray-300 hover:shadow-md`;
  };

  // Button config
  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: "Recording Vote...",
        disabled: true,
        className: "bg-gray-400 text-white cursor-wait"
      };
    }
    if (votedForCandidate) {
      return {
        text: "Ballot Confirmed",
        disabled: true,
        className: "bg-emerald-600 text-white cursor-default"
      };
    }
    if (hasVoted && !votedForCandidate) {
      return {
        text: `Ballot already cast for ${positionDisplay}`,
        disabled: true,
        className: "bg-gray-200 text-gray-500 cursor-not-allowed"
      };
    }
    if (!canVote) {
      return {
        text: "Voting Not Available",
        disabled: true,
        className: "bg-gray-200 text-gray-500 cursor-not-allowed"
      };
    }
    return {
      text: `Vote for ${candidateName}`,
      disabled: false,
      className: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-sm hover:shadow"
    };
  };

  const buttonConfig = getButtonConfig();

  const handleVoteClick = () => {
    if (!canVote || hasVoted || isLoading) return;
    onVote(candidateId);
  };

  return (
    <div className={getCardClasses()}>
      <div>
        {/* Status Pills */}
        <div className="flex items-center justify-between gap-2 mb-3 min-h-[28px]">
          {isWinner && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-semibold rounded-full border border-amber-200">
              <AwardIcon className="w-3.5 h-3.5 text-amber-700" />
              Certified Winner
            </span>
          )}
          {isLeading && !isWinner && (
            <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
              Leading
            </span>
          )}
          {votedForCandidate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200 ml-auto">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />
              Your Choice
            </span>
          )}
        </div>

        {/* Candidate Profile Info */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            {hasImage ? (
              <img
                src={candidateImage}
                alt={candidateName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-sm border-2 border-white ring-2 ring-gray-100 bg-gradient-to-br from-slate-700 to-slate-900">
                <span className="text-white text-2xl font-bold tracking-wider">
                  {getInitials(candidateName)}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 leading-snug">
            {candidateName}
          </h3>

          <p className="text-sm sm:text-base text-gray-700 font-medium mb-1">
            {party}
          </p>

          <p className="text-xs sm:text-sm text-gray-500 mb-2">
            {positionDisplay}
          </p>

          {areaDisplay && (
            <p className="inline-flex items-center gap-1 text-xs text-gray-500 mb-3 bg-gray-50 px-2.5 py-1 rounded-md">
              <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>{areaDisplay}</span>
            </p>
          )}

          {showVoteCount && !hasVoted && (
            <div className="mb-3 text-xs text-gray-500">
              {voteCount} votes ({percentage}%)
            </div>
          )}
        </div>
      </div>

      {/* Full-width Voting Action Button */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleVoteClick}
          disabled={buttonConfig.disabled}
          className={`w-full py-3.5 px-4 font-semibold text-sm sm:text-base rounded-xl transition-all duration-150 ${buttonConfig.className}`}
        >
          {buttonConfig.text}
        </button>
      </div>
    </div>
  );
};

export default SimpleCandidateCard;
