import React from "react";
import { AwardIcon } from "./common/Icons";

const WinnerSection = ({
  winnerResult,
  totalVotes = 0,
  electionEnded = false,
}) => {
  if (!electionEnded || !winnerResult) return null;

  const getCandidateId = (candidate, index = 0) =>
    String(candidate?.id ?? candidate?.candidateId ?? candidate?.index ?? index);

  const getCandidateName = (candidate) =>
    candidate?.name?.trim() || "Unnamed Candidate";

  const getVoteCount = (candidate) => Number(candidate?.voteCount || 0);

  const renderWinner = (candidate, percentage = 0) => {
    const candidateName = getCandidateName(candidate);
    const voteCount = getVoteCount(candidate);

    return (
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-yellow-300">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {candidateName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{candidateName}</h3>
              <p className="text-yellow-100">Winner</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold">{voteCount}</div>
            <div className="text-yellow-100">Votes</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
            <span className="text-sm font-medium">Vote Percentage</span>
            <span className="ml-2 text-lg font-bold">{percentage}%</span>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <AwardIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const renderTie = (tiedCandidates = [], percentage = 0) => (
    <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl border-4 border-white">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Election Result: Tie</h3>
        <p className="text-purple-100">
          Multiple candidates received the same highest number of votes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {tiedCandidates.map((candidate, index) => {
          const candidateName = getCandidateName(candidate);
          const voteCount = getVoteCount(candidate);

          return (
            <div
              key={getCandidateId(candidate, index)}
              className="bg-white bg-opacity-20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {candidateName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold">{candidateName}</h4>
                    <p className="text-sm text-purple-100">{voteCount} votes</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold">{percentage}%</div>
                  <div className="text-sm text-purple-100">Vote Share</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-purple-100">
        Total votes cast: {totalVotes}
      </div>
    </div>
  );

  if (winnerResult.type === "winner" && winnerResult.candidate) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Election Results
          </h2>
          <p className="text-gray-600">
            The election has concluded and results are final
          </p>
        </div>

        {renderWinner(winnerResult.candidate, winnerResult.percentage)}
      </div>
    );
  }

  if (
    winnerResult.type === "tie" &&
    Array.isArray(winnerResult.candidates) &&
    winnerResult.candidates.length > 0
  ) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Election Results
          </h2>
          <p className="text-gray-600">
            The election has concluded and results are final
          </p>
        </div>

        {renderTie(winnerResult.candidates, winnerResult.percentage)}
      </div>
    );
  }

  return null;
};

export default WinnerSection;