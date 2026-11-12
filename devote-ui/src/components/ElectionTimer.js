import React from 'react';
import { ClockIcon, StopIcon, BoltIcon } from './common/Icons';

const ElectionTimer = ({ electionStarted, electionEnded, durationMinutes = 10 }) => {
  const getStatusColor = () => {
    if (!electionStarted) return 'bg-gray-100 text-gray-800';
    if (electionEnded) return 'bg-red-100 text-red-800';
    return 'bg-dark-green-100 text-dark-green-800';
  };

  const getStatusText = () => {
    if (!electionStarted) return 'ELECTION NOT STARTED';
    if (electionEnded) return 'ELECTION ENDED';
    return 'ELECTION ACTIVE';
  };

  const StatusIcon = () => {
    if (!electionStarted) return <ClockIcon className="w-4 h-4" />;
    if (electionEnded) return <StopIcon className="w-4 h-4" />;
    return <BoltIcon className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-dark-green-100 p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-dark-green-900">Election Status</h3>
          <p className="text-sm text-dark-green-700">
            Current state of the election process
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${getStatusColor()}`}>
          <StatusIcon />
          {getStatusText()}
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-dark-green-50 to-dark-green-100 rounded-2xl p-6 border border-dark-green-200">
          <h4 className="font-semibold text-dark-green-900 mb-3">Start Status</h4>
          <p className={`text-sm font-medium ${
            electionStarted ? 'text-dark-green-700' : 'text-dark-green-500'
          }`}>
            {electionStarted ? 'Election has started' : 'Waiting for admin to start'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-3">End Status</h4>
          <p className={`text-sm font-medium ${
            electionEnded ? 'text-red-700' : 'text-red-500'
          }`}>
            {electionEnded ? 'Election has ended' : 'Election is active'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Voting</h4>
          <p className={`text-sm font-medium ${
            electionStarted && !electionEnded ? 'text-blue-700' : 'text-blue-500'
          }`}>
            {electionStarted && !electionEnded 
              ? 'Voting is open' 
              : electionEnded 
                ? 'Voting closed' 
                : 'Voting not started'}
          </p>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="mt-6 flex items-center justify-center">
        <div className={`w-4 h-4 rounded-full animate-pulse ${
          !electionStarted ? 'bg-gray-400' : 
          electionEnded ? 'bg-red-500' : 'bg-dark-green-500'
        }`}></div>
        <span className="ml-2 text-sm text-dark-green-600">
          {electionStarted && !electionEnded && `Duration: ${durationMinutes} minutes`}
        </span>
      </div>
    </div>
  );
};

export default ElectionTimer;
