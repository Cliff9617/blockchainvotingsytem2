/**
 * DeVote AI Integrity Monitor - Rules Engine
 * 
 * This file contains fraud detection and anomaly detection rules
 * for monitoring voter registration and voting integrity.
 * 
 * IMPORTANT: These checks are ADVISORY ONLY. They flag patterns
 * for admin review but do NOT automatically block or approve anything.
 */

/**
 * Run all integrity checks on the provided data
 * @param {Object} data - Object containing registrationRequests, voters, votes, candidates
 * @returns {Array} - Array of alert objects
 */
export const runIntegrityChecks = ({
  registrationRequests = [],
  voters = [],
  votes = [],
  candidates = [],
}) => {
  const alerts = [];

  // Run each check and collect alerts
  alerts.push(...checkDuplicateIDNumbers(registrationRequests));
  alerts.push(...checkDuplicateWalletAddresses(registrationRequests, voters, votes));
  alerts.push(...checkMultipleRegistrationsSameWallet(registrationRequests));
  alerts.push(...checkMissingWalletAddress(voters));
  alerts.push(...checkMissingGeoDetails(registrationRequests, voters));
  alerts.push(...checkLocationMismatch(registrationRequests));
  alerts.push(...checkConcentratedPendingApprovals(registrationRequests));
  alerts.push(...checkMissingRequiredFields(registrationRequests));
  alerts.push(...checkMissingTransactionHash(votes));
  alerts.push(...checkVoteTimingSpikes(votes));
  alerts.push(...checkCandidateVoteSpikes(votes, candidates));

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
};

/**
 * Check for duplicate ID numbers in registration requests
 */
const checkDuplicateIDNumbers = (registrationRequests) => {
  const alerts = [];
  const idMap = {};

  registrationRequests.forEach((request) => {
    // Check both flat and nested structures
    const idNumber = request.idNumber || request.personalDetails?.idNumber;
    if (!idNumber) return;

    const normalizedId = idNumber.trim().toUpperCase();
    if (!idMap[normalizedId]) {
      idMap[normalizedId] = [];
    }
    idMap[normalizedId].push(request);
  });

  Object.entries(idMap).forEach(([idNumber, records]) => {
    if (records.length > 1) {
      const names = records.map(r => r.fullName || 'Unknown').join(', ');
      alerts.push({
        id: `dup-id-${idNumber}`,
        type: 'Duplicate ID Number',
        severity: 'high',
        message: `ID number appears in ${records.length} registration requests.`,
        details: `Names: ${names}`,
        recommendation: 'Review these requests manually before approval. Potential identity fraud.',
        affectedRecords: records.map(r => r.id)
      });
    }
  });

  return alerts;
};

/**
 * Check for duplicate wallet addresses across collections
 */
const checkDuplicateWalletAddresses = (registrationRequests, voters, votes) => {
  const alerts = [];
  const walletMap = {};

  // Check registration requests
  registrationRequests.forEach((request) => {
    const wallet = request.walletAddress?.toLowerCase().trim();
    if (!wallet) return;

    if (!walletMap[wallet]) {
      walletMap[wallet] = { requests: [], voters: [], votes: [] };
    }
    walletMap[wallet].requests.push(request);
  });

  // Check voters
  voters.forEach((voter) => {
    const wallet = voter.walletAddress?.toLowerCase().trim();
    if (!wallet) return;

    if (!walletMap[wallet]) {
      walletMap[wallet] = { requests: [], voters: [], votes: [] };
    }
    walletMap[wallet].voters.push(voter);
  });

  // Check votes
  votes.forEach((vote) => {
    const wallet = vote.voterAddress?.toLowerCase().trim() || vote.wallet?.toLowerCase().trim();
    if (!wallet) return;

    if (!walletMap[wallet]) {
      walletMap[wallet] = { requests: [], voters: [], votes: [] };
    }
    walletMap[wallet].votes.push(vote);
  });

  Object.entries(walletMap).forEach(([wallet, data]) => {
    const totalOccurrences = data.requests.length + data.voters.length + data.votes.length;
    
    if (data.requests.length > 1) {
      alerts.push({
        id: `dup-wallet-reg-${wallet}`,
        type: 'Duplicate Wallet in Registrations',
        severity: 'high',
        message: `Wallet address appears in ${data.requests.length} registration requests.`,
        details: `Total occurrences across all collections: ${totalOccurrences}`,
        recommendation: 'Investigate potential duplicate registration attempts.',
        affectedRecords: data.requests.map(r => r.id)
      });
    }

    // Check if vote came from unregistered wallet
    if (data.votes.length > 0 && data.voters.length === 0 && data.requests.length === 0) {
      alerts.push({
        id: `unreg-vote-${wallet}`,
        type: 'Vote from Unregistered Wallet',
        severity: 'high',
        message: `Wallet has cast ${data.votes.length} vote(s) but has no registration or voter record.`,
        details: 'This may indicate a blockchain voting issue or unauthorized access.',
        recommendation: 'Verify this wallet against the approved voters list on the blockchain.',
        affectedRecords: data.votes.map(v => v.id)
      });
    }
  });

  return alerts;
};

/**
 * Check for multiple registration requests from the same wallet
 */
const checkMultipleRegistrationsSameWallet = (registrationRequests) => {
  const alerts = [];
  const walletMap = {};

  registrationRequests.forEach((request) => {
    const wallet = request.walletAddress?.toLowerCase().trim();
    if (!wallet) return;

    if (!walletMap[wallet]) {
      walletMap[wallet] = [];
    }
    walletMap[wallet].push(request);
  });

  Object.entries(walletMap).forEach(([wallet, requests]) => {
    if (requests.length > 1) {
      const statuses = requests.map(r => r.status).join(', ');
      alerts.push({
        id: `multi-reg-${wallet}`,
        type: 'Multiple Registrations Same Wallet',
        severity: 'medium',
        message: `Wallet has ${requests.length} registration requests with statuses: ${statuses}.`,
        details: 'Multiple registration attempts from the same wallet may indicate confusion or abuse.',
        recommendation: 'Review and keep only the most recent valid request.',
        affectedRecords: requests.map(r => r.id)
      });
    }
  });

  return alerts;
};

/**
 * Check for approved voters missing wallet addresses
 */
const checkMissingWalletAddress = (voters) => {
  const alerts = [];
  const missingWallet = voters.filter(v => 
    v.status === 'approved' && (!v.walletAddress || !v.walletAddress.trim())
  );

  if (missingWallet.length > 0) {
    alerts.push({
      id: 'missing-wallet-voters',
      type: 'Approved Voters Missing Wallet',
      severity: 'high',
      message: `${missingWallet.length} approved voter(s) have no wallet address on file.`,
      details: 'These voters may be unable to vote on the blockchain.',
      recommendation: 'Contact these voters to obtain their wallet addresses or update their records.',
      affectedRecords: missingWallet.map(v => v.id)
    });
  }

  return alerts;
};

/**
 * Check for missing geographic details
 */
const checkMissingGeoDetails = (registrationRequests, voters) => {
  const alerts = [];
  const allRecords = [...registrationRequests, ...voters.filter(v => v.status === 'approved')];
  
  const missingGeo = allRecords.filter(record => {
    const county = record.county || record.location?.county;
    const constituency = record.constituency || record.location?.constituency;
    const ward = record.ward || record.location?.ward;
    return !county || !constituency || !ward;
  });

  if (missingGeo.length > 0) {
    alerts.push({
      id: 'missing-geo-details',
      type: 'Missing Geographic Details',
      severity: 'medium',
      message: `${missingGeo.length} record(s) are missing county, constituency, or ward information.`,
      details: 'Incomplete geographic data may affect candidate visibility and voting eligibility.',
      recommendation: 'Update these records with complete location information.',
      affectedRecords: missingGeo.map(r => r.id)
    });
  }

  return alerts;
};

/**
 * Check for location mismatches within records
 */
const checkLocationMismatch = (registrationRequests) => {
  const alerts = [];
  // This check would require validation against known Kenya locations
  // For now, we flag records where location fields seem inconsistent
  const mismatched = registrationRequests.filter(request => {
    // Simple heuristic: if all three are filled but seem inconsistent
    const county = request.county?.toLowerCase();
    const constituency = request.constituency?.toLowerCase();
    const ward = request.ward?.toLowerCase();
    
    // Flag if any field is filled but others are empty (partial data)
    const filledCount = [county, constituency, ward].filter(Boolean).length;
    return filledCount > 0 && filledCount < 3;
  });

  if (mismatched.length > 0) {
    alerts.push({
      id: 'location-mismatch',
      type: 'Incomplete Location Data',
      severity: 'low',
      message: `${mismatched.length} registration request(s) have incomplete location information.`,
      details: 'Some location fields are filled while others are empty.',
      recommendation: 'Complete all location fields for proper voter classification.',
      affectedRecords: mismatched.map(r => r.id)
    });
  }

  return alerts;
};

/**
 * Check for concentrated pending approvals from same area
 */
const checkConcentratedPendingApprovals = (registrationRequests) => {
  const alerts = [];
  const pendingByWard = {};

  registrationRequests
    .filter(r => r.status === 'pending')
    .forEach((request) => {
      const key = `${request.county || 'Unknown'}-${request.constituency || 'Unknown'}-${request.ward || 'Unknown'}`;
      if (!pendingByWard[key]) {
        pendingByWard[key] = [];
      }
      pendingByWard[key].push(request);
    });

  Object.entries(pendingByWard).forEach(([location, requests]) => {
    if (requests.length >= 5) {
      alerts.push({
        id: `concentrated-pending-${location}`,
        type: 'Concentrated Pending Approvals',
        severity: 'medium',
        message: `${requests.length} pending registrations from ${location}.`,
        details: 'A large number of pending approvals from one area may indicate coordinated registration.',
        recommendation: 'Review these requests carefully for patterns of fraud.',
        affectedRecords: requests.map(r => r.id)
      });
    }
  });

  return alerts;
};

/**
 * Check for missing required fields in registration requests
 */
const checkMissingRequiredFields = (registrationRequests) => {
  const alerts = [];
  const requiredFields = ['fullName', 'idNumber', 'walletAddress'];
  
  const incomplete = registrationRequests.filter(request => {
    return requiredFields.some(field => {
      const value = request[field] || request.personalDetails?.[field];
      return !value || !value.trim();
    });
  });

  if (incomplete.length > 0) {
    alerts.push({
      id: 'missing-required-fields',
      type: 'Incomplete Registration Data',
      severity: 'medium',
      message: `${incomplete.length} registration request(s) are missing required fields.`,
      details: `Missing: ${requiredFields.join(', ')}`,
      recommendation: 'Request submitters to complete all required information.',
      affectedRecords: incomplete.map(r => r.id)
    });
  }

  return alerts;
};

/**
 * Check for votes missing transaction hash
 */
const checkMissingTransactionHash = (votes) => {
  const alerts = [];
  const missingTxHash = votes.filter(vote => {
    return !vote.txHash && !vote.transactionHash && !vote.hash;
  });

  if (missingTxHash.length > 0) {
    alerts.push({
      id: 'missing-tx-hash',
      type: 'Votes Missing Transaction Hash',
      severity: 'medium',
      message: `${missingTxHash.length} vote(s) have no transaction hash recorded.`,
      details: 'Without transaction hashes, votes cannot be verified on the blockchain.',
      recommendation: 'Investigate these votes and ensure blockchain recording is working properly.',
      affectedRecords: missingTxHash.map(v => v.id)
    });
  }

  return alerts;
};

/**
 * Check for unusual vote timing patterns (vote spikes)
 */
const checkVoteTimingSpikes = (votes) => {
  const alerts = [];
  
  // Filter votes with valid timestamps
  const votesWithTimestamps = votes.filter(vote => {
    return vote.createdAt || vote.timestamp || vote.votedAt || vote.blockTimestamp;
  });

  if (votesWithTimestamps.length < 10) {
    return alerts; // Not enough data for timing analysis
  }

  // Sort by timestamp
  const sortedVotes = votesWithTimestamps.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.timestamp || a.votedAt || a.blockTimestamp || 0).getTime();
    const timeB = new Date(b.createdAt || b.timestamp || b.votedAt || b.blockTimestamp || 0).getTime();
    return timeA - timeB;
  });

  // Check for spikes: more than 10 votes within 2 minutes
  const windowMs = 2 * 60 * 1000; // 2 minutes
  const threshold = 10;

  for (let i = 0; i < sortedVotes.length - threshold; i++) {
    const windowStart = new Date(
      sortedVotes[i].createdAt || sortedVotes[i].timestamp || sortedVotes[i].votedAt || sortedVotes[i].blockTimestamp
    ).getTime();
    const windowEnd = windowStart + windowMs;

    const votesInWindow = sortedVotes.filter(v => {
      const voteTime = new Date(
        v.createdAt || v.timestamp || v.votedAt || v.blockTimestamp
      ).getTime();
      return voteTime >= windowStart && voteTime <= windowEnd;
    });

    if (votesInWindow.length >= threshold) {
      alerts.push({
        id: `vote-spike-${windowStart}`,
        type: 'Unusual Vote Timing Pattern',
        severity: 'high',
        message: `${votesInWindow.length} votes cast within a 2-minute window.`,
        details: `Time window starting at ${new Date(windowStart).toLocaleString()}. This may indicate automated voting or bot activity.`,
        recommendation: 'Review the timestamps and wallet addresses of these votes for suspicious patterns.',
        affectedRecords: votesInWindow.map(v => v.id)
      });
      // Skip ahead to avoid duplicate alerts
      i += votesInWindow.length;
    }
  }

  return alerts;
};

/**
 * Check for candidate vote spikes (same candidate receiving many votes quickly)
 */
const checkCandidateVoteSpikes = (votes, candidates) => {
  const alerts = [];
  
  if (candidates.length === 0 || votes.length === 0) {
    return alerts;
  }

  // Group votes by candidate
  const votesByCandidate = {};
  votes.forEach(vote => {
    const candidateId = vote.candidateId || vote.candidate;
    if (!candidateId) return;
    
    if (!votesByCandidate[candidateId]) {
      votesByCandidate[candidateId] = [];
    }
    votesByCandidate[candidateId].push(vote);
  });

  // Check each candidate for spikes
  Object.entries(votesByCandidate).forEach(([candidateId, candidateVotes]) => {
    if (candidateVotes.length < 5) return;

    // Check for time-based spikes if timestamps available
    const votesWithTime = candidateVotes.filter(v => 
      v.createdAt || v.timestamp || v.votedAt || v.blockTimestamp
    );

    if (votesWithTime.length >= 5) {
      const sortedVotes = votesWithTime.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || a.votedAt || a.blockTimestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || b.votedAt || b.blockTimestamp || 0).getTime();
        return timeA - timeB;
      });

      // Check for 5+ votes within 1 minute
      const windowMs = 60 * 1000;
      for (let i = 0; i < sortedVotes.length - 4; i++) {
        const windowStart = new Date(
          sortedVotes[i].createdAt || sortedVotes[i].timestamp || sortedVotes[i].votedAt || sortedVotes[i].blockTimestamp
        ).getTime();
        const windowEnd = windowStart + windowMs;

        const votesInWindow = sortedVotes.filter(v => {
          const voteTime = new Date(
            v.createdAt || v.timestamp || v.votedAt || v.blockTimestamp
          ).getTime();
          return voteTime >= windowStart && voteTime <= windowEnd;
        });

        if (votesInWindow.length >= 5) {
          const candidate = candidates.find(c => c.id === candidateId || c.candidateCode === candidateId);
          alerts.push({
            id: `candidate-spike-${candidateId}-${windowStart}`,
            type: 'Candidate Vote Spike',
            severity: 'medium',
            message: `Candidate received ${votesInWindow.length} votes within 1 minute.`,
            details: candidate 
              ? `Candidate: ${candidate.name}. Time: ${new Date(windowStart).toLocaleString()}.`
              : `Candidate ID: ${candidateId}. Time: ${new Date(windowStart).toLocaleString()}.`,
            recommendation: 'Review these votes for potential ballot stuffing or coordinated voting.',
            affectedRecords: votesInWindow.map(v => v.id)
          });
          break; // One alert per candidate
        }
      }
    }
  });

  return alerts;
};

/**
 * Get severity statistics from alerts
 */
export const getAlertStats = (alerts) => {
  const stats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };
  return stats;
};

/**
 * Get severity badge configuration
 */
export const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'high':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: '🔴',
      };
    case 'medium':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: '🟠',
      };
    case 'low':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: '🟡',
      };
    case 'info':
    default:
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: 'ℹ️',
      };
  }
};