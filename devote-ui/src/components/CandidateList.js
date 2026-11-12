import React from "react";
import CandidateCard from "./CandidateCard";
import { UsersIcon } from "./common/Icons";

const CandidateList = ({
  candidates = [],
  hasVoted = false,
  onVote,
  isLoading = false,
  totalVotes = 0,
  getVotePercentage,
  getLeadingCandidates,
  getWinnerResult,
}) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
        <div className="text-6xl mb-4">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Candidates Yet
        </h3>
        <p className="text-gray-600">
          Candidates will be added by the election administrator.
        </p>
      </div>
    );
  }

  const leadingCandidates =
    typeof getLeadingCandidates === "function" ? getLeadingCandidates() : [];

  const winnerResult =
    typeof getWinnerResult === "function" ? getWinnerResult() : null;

  const leadingIds = leadingCandidates.map((candidate) =>
    String(candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? "")
  );

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>

        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
          <span className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>Leading Candidate</span>
          </span>

          <span className="px-3 py-1 bg-gray-100 rounded-full">
            {candidates.length} Candidates
          </span>

          {totalVotes > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {totalVotes} Total Votes
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {candidates.map((candidate, index) => {
          const candidateId = String(
            candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? index
          );

          const isLeading = leadingIds.includes(candidateId);
          const isTiedLead = isLeading && leadingCandidates.length > 1;

          const isWinner =
            winnerResult?.type === "winner" &&
            String(
              winnerResult?.candidate?.id ??
                winnerResult?.candidate?.candidateId ??
                winnerResult?.candidate?.index ??
                ""
            ) === candidateId;

          const isTieWinner =
            winnerResult?.type === "tie" &&
            Array.isArray(winnerResult?.candidates) &&
            winnerResult.candidates.some(
              (winner) =>
                String(
                  winner?.id ?? winner?.candidateId ?? winner?.index ?? ""
                ) === candidateId
            );

          return (
            <CandidateCard
              key={candidateId}
              candidate={candidate}
              hasVoted={hasVoted}
              onVote={onVote}
              isLoading={isLoading}
              isLeading={isLeading}
              isTiedLead={isTiedLead}
              isWinner={isWinner}
              isTieWinner={isTieWinner}
              totalVotes={totalVotes}
              getVotePercentage={getVotePercentage}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CandidateList;