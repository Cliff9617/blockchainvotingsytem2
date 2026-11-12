import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
// Chart.js components are registered globally in src/utils/chartSetup.js
// which is imported in src/index.js

const VoteChart = ({ candidates, electionEnded, totalVotes, getVotePercentage }) => {
  // Prepare chart data for pie chart
  const pieChartData = {
    labels: candidates.map(candidate => candidate.name),
    datasets: [
      {
        data: candidates.map(candidate => candidate.voteCount),
        backgroundColor: [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
          '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
        ],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
      },
    ],
  };

  // Prepare chart data for bar chart
  const barChartData = {
    labels: candidates.map(candidate => candidate.name),
    datasets: [
      {
        label: 'Vote Count',
        data: candidates.map(candidate => candidate.voteCount),
        backgroundColor: candidates.map((candidate, index) => [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
          '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
        ][index % 8]),
        borderColor: candidates.map((candidate, index) => [
          '#1E40AF', '#991B1B', '#059669', '#92400E',
          '#5B21B6', '#9F1239', '#0F766E', '#9A3412'
        ][index % 8]),
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Vote Percentage',
        data: candidates.map(candidate => getVotePercentage ? getVotePercentage(candidate.voteCount) : 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        type: 'line',
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = getVotePercentage ? getVotePercentage(value) : 0;
            return `${label}: ${value} votes (${percentage}%)`;
          }
        }
      }
    },
  };

  const pieChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'right',
      }
    }
  };

  const barChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#666',
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        }
      }
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-8 text-center">
        <div className="text-6xl mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Yet</h3>
        <p className="text-gray-600">
          {electionEnded 
            ? "Election has ended with no candidates" 
            : "Wait for admin to add candidates"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Vote Distribution */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Vote Distribution</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              electionEnded 
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {electionEnded ? 'Final Results' : 'Live Updates'}
            </div>
          </div>
          
          <div className="h-80">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            {electionEnded ? "Election results are final" : "Chart updates in real-time"}
          </div>
        </div>

        {/* Bar Chart - Vote Counts and Percentages */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Vote Analysis</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>Vote Count</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-200 rounded-full"></span>
                <span>Vote Percentage</span>
              </span>
            </div>
          </div>
          
          <div className="h-80">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            {totalVotes > 0 && `Total votes cast: ${totalVotes}`}
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Candidate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Votes</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Percentage</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => {
                const percentage = getVotePercentage ? getVotePercentage(candidate.voteCount) : 0;
                const leadingCandidates = candidates.filter(c => c.voteCount === Math.max(...candidates.map(c => c.voteCount)));
                const isLeading = leadingCandidates.length === 1 && leadingCandidates[0].id === candidate.id;
                const isTiedLead = leadingCandidates.length > 1 && leadingCandidates.some(c => c.id === candidate.id);
                const isWinner = electionEnded && isLeading;
                const isTiedWinner = electionEnded && isTiedLead;

                return (
                  <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          isWinner ? 'bg-yellow-500' : isLeading || isTiedLead ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{candidate.name}</div>
                          <div className="text-sm text-gray-500">Candidate #{candidate.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{candidate.voteCount}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{percentage}%</td>
                    <td className="py-3 px-4 text-right">
                      {isWinner ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full border border-yellow-200">
                           Winner
                        </span>
                      ) : isTiedWinner ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200">
                           Tied Winner
                        </span>
                      ) : isLeading ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200">
                           Leading
                        </span>
                      ) : isTiedLead ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200">
                           Tied Lead
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full border border-gray-200">
                           Behind
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VoteChart;
