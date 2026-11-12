/**
 * DeVote AI Admin Insights Utilities
 * 
 * This file contains utility functions for calculating election metrics
 * and generating AI-style summaries for the admin dashboard.
 */

/**
 * Calculate election statistics from available data
 * @param {Object} data - Object containing candidates, registrationRequests, election state
 * @returns {Object} - Calculated statistics
 */
export const calculateElectionStats = (data = {}) => {
  const {
    candidates = [],
    registrationRequests = [],
    electionStarted = false,
    electionEnded = false,
    totalVotes = 0,
    voterInfo = null,
  } = data;

  // Calculate registration stats
  const totalRequests = registrationRequests.length;
  const approvedRequests = registrationRequests.filter(r => r.status === 'approved').length;
  const pendingRequests = registrationRequests.filter(r => r.status === 'pending').length;
  const rejectedRequests = registrationRequests.filter(r => r.status === 'rejected').length;

  // Total candidates
  const totalCandidates = candidates.length;

  // Calculate turnout percentage
  const turnoutPercentage = approvedRequests > 0 
    ? ((totalVotes / approvedRequests) * 100).toFixed(1) 
    : 0;

  // Determine election phase
  let electionPhase = 'Not Started';
  if (electionEnded) {
    electionPhase = 'Ended';
  } else if (electionStarted) {
    electionPhase = 'Active';
  }

  // Calculate candidates by position
  const candidatesByPosition = {};
  candidates.forEach(candidate => {
    const position = candidate.position || 'Unknown';
    if (!candidatesByPosition[position]) {
      candidatesByPosition[position] = 0;
    }
    candidatesByPosition[position]++;
  });

  // Calculate votes by position (if vote data available)
  const votesByPosition = {};
  candidates.forEach(candidate => {
    const position = candidate.position || 'Unknown';
    if (!votesByPosition[position]) {
      votesByPosition[position] = 0;
    }
    votesByPosition[position] += Number(candidate.voteCount || 0);
  });

  // Find most active location (based on registrations)
  const countyCounts = {};
  registrationRequests.forEach(request => {
    if (request.county) {
      countyCounts[request.county] = (countyCounts[request.county] || 0) + 1;
    }
  });
  
  const mostActiveCounty = Object.entries(countyCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    totalRequests,
    approvedRequests,
    pendingRequests,
    rejectedRequests,
    totalCandidates,
    totalVotes,
    turnoutPercentage,
    electionPhase,
    candidatesByPosition,
    votesByPosition,
    mostActiveCounty: mostActiveCounty ? mostActiveCounty[0] : null,
    mostActiveCountyCount: mostActiveCounty ? mostActiveCounty[1] : 0,
  };
};

/**
 * Generate AI-style election summary text
 * @param {Object} stats - Election statistics from calculateElectionStats
 * @returns {string} - Human-readable summary
 */
export const generateElectionSummary = (stats) => {
  if (!stats || stats.totalRequests === undefined) {
    return "Some election metrics are not available yet because voting data has not been fully loaded.";
  }

  const {
    totalRequests,
    approvedRequests,
    pendingRequests,
    rejectedRequests,
    totalCandidates,
    totalVotes,
    turnoutPercentage,
    electionPhase,
    mostActiveCounty,
    mostActiveCountyCount,
  } = stats;

  let summary = "";

  // Opening statement about current state
  summary += `The election currently has ${totalRequests} registered voter requests, `;
  summary += `${approvedRequests} approved voters, `;
  summary += `${pendingRequests} pending approvals`;
  
  if (rejectedRequests > 0) {
    summary += `, and ${rejectedRequests} rejected requests`;
  }
  summary += `. `;

  // Election status
  switch (electionPhase) {
    case 'Not Started':
      summary += `Voting has not yet started. `;
      break;
    case 'Active':
      summary += `Voting is currently active. `;
      break;
    case 'Ended':
      summary += `Voting has ended. `;
      break;
  }

  // Turnout info (only if voting is active or ended)
  if (electionPhase !== 'Not Started' && totalVotes > 0) {
    summary += `Current turnout is ${turnoutPercentage}% (${totalVotes} votes cast). `;
  }

  // Candidates info
  if (totalCandidates > 0) {
    summary += `There are ${totalCandidates} candidates contesting. `;
  }

  // Most active location
  if (mostActiveCounty) {
    summary += `${mostActiveCounty} County has the highest registration with ${mostActiveCountyCount} requests. `;
  }

  // Recommendation based on state
  if (pendingRequests > 0 && electionPhase === 'Not Started') {
    summary += `The admin should prioritize pending voter verification before election traffic increases.`;
  } else if (pendingRequests > 0 && electionPhase === 'Active') {
    summary += `Consider processing pending approvals to maximize voter participation.`;
  } else if (electionPhase === 'Active' && turnoutPercentage < 30) {
    summary += `Turnout is currently low. Consider checking voter access or MetaMask connection issues.`;
  } else if (electionPhase === 'Ended') {
    summary += `Generate final report and verify winner display.`;
  }

  return summary.trim();
};

/**
 * Generate AI recommendations based on election state
 * @param {Object} stats - Election statistics
 * @param {Object} additionalData - Additional context (isAdmin, etc.)
 * @returns {Array} - Array of recommendation objects
 */
export const generateRecommendations = (stats, additionalData = {}) => {
  const recommendations = [];
  
  if (!stats || stats.totalRequests === undefined) {
    return [{
      type: 'info',
      text: 'Loading election data. Recommendations will appear once data is available.',
      priority: 'low'
    }];
  }

  const {
    totalRequests,
    approvedRequests,
    pendingRequests,
    rejectedRequests,
    totalCandidates,
    totalVotes,
    turnoutPercentage,
    electionPhase,
    candidatesByPosition,
  } = stats;

  const { electionStarted, electionEnded } = additionalData;

  // Pre-election recommendations
  if (!electionStarted) {
    if (pendingRequests > 0) {
      recommendations.push({
        type: 'warning',
        text: `Review ${pendingRequests} pending voter approvals before starting the election.`,
        priority: 'high'
      });
    }

    if (totalCandidates === 0) {
      recommendations.push({
        type: 'error',
        text: 'No candidates added yet. Add candidates before starting the election.',
        priority: 'critical'
      });
    }

    if (totalCandidates > 0 && approvedRequests === 0) {
      recommendations.push({
        type: 'warning',
        text: 'No approved voters yet. Approve voter registrations before starting.',
        priority: 'high'
      });
    }

    // Check candidate location completeness
    let candidatesWithoutLocation = 0;
    if (candidatesByPosition) {
      candidatesWithoutLocation = Object.entries(candidatesByPosition).filter(([position, count]) => {
        return position !== 'President' && count > 0;
      }).length;
    }
    
    if (candidatesWithoutLocation > 0) {
      recommendations.push({
        type: 'info',
        text: 'Confirm all candidates have correct county, constituency, and ward details.',
        priority: 'medium'
      });
    }
  }

  // During election recommendations
  if (electionStarted && !electionEnded) {
    if (pendingRequests > 0) {
      recommendations.push({
        type: 'warning',
        text: `${pendingRequests} pending approvals. Process them to maximize participation.`,
        priority: 'medium'
      });
    }

    if (totalVotes > 0 && turnoutPercentage < 30) {
      recommendations.push({
        type: 'info',
        text: 'Turnout is low. Consider checking voter access or MetaMask connection issues.',
        priority: 'medium'
      });
    }

    recommendations.push({
      type: 'info',
      text: 'Monitor turnout and failed vote attempts. Check blockchain confirmations.',
      priority: 'low'
    });
  }

  // Post-election recommendations
  if (electionEnded) {
    recommendations.push({
      type: 'success',
      text: 'Election has ended. Generate final report and verify winner display.',
      priority: 'high'
    });

    if (totalVotes > 0) {
      recommendations.push({
        type: 'info',
        text: `Final turnout: ${turnoutPercentage}% (${totalVotes} votes cast from ${approvedRequests} approved voters).`,
        priority: 'low'
      });
    }
  }

  // General recommendations
  if (rejectedRequests > 0) {
    recommendations.push({
      type: 'info',
      text: `${rejectedRequests} registrations were rejected. Review rejection reasons for patterns.`,
      priority: 'low'
    });
  }

  // If no specific recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      text: 'All systems operational. No immediate actions required.',
      priority: 'low'
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
};

/**
 * Get status badge configuration
 * @param {string} phase - Election phase
 * @returns {Object} - Badge configuration
 */
export const getPhaseBadgeConfig = (phase) => {
  switch (phase) {
    case 'Active':
      return {
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: '●',
      };
    case 'Ended':
      return {
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: '○',
      };
    default:
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: '◌',
      };
  }
};

/**
 * Get recommendation icon and styles
 * @param {string} type - Recommendation type
 * @returns {Object} - Icon and style configuration
 */
export const getRecommendationStyle = (type) => {
  switch (type) {
    case 'error':
      return {
        icon: '🚨',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
      };
    case 'warning':
      return {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
      };
    case 'success':
      return {
        icon: '✅',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
      };
    default:
      return {
        icon: 'ℹ️',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
      };
  }
};

/**
 * Format large numbers for display
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate percentage with safe division
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {string} - Percentage string
 */
export const safePercentage = (part, total) => {
  if (!total || total === 0) return '0%';
  return ((part / total) * 100).toFixed(1) + '%';
};