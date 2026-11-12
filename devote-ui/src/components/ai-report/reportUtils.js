/**
 * DeVote AI Report Generator - Utilities
 * 
 * Helper functions for generating election reports.
 * This module handles data aggregation and report formatting.
 */

/**
 * Calculate election statistics for the report
 */
export const calculateReportStats = (data = {}) => {
  const {
    registrationRequests = [],
    voters = [],
    votes = [],
    candidates = [],
    electionStarted = false,
    electionEnded = false,
    integrityAlerts = [],
  } = data;

  // Registration stats
  const totalRequests = registrationRequests.length;
  const approvedVoters = registrationRequests.filter(r => r.status === 'approved').length;
  const pendingVoters = registrationRequests.filter(r => r.status === 'pending').length;
  const rejectedVoters = registrationRequests.filter(r => r.status === 'rejected').length;

  // Vote stats
  const totalVotes = candidates.reduce((sum, c) => sum + Number(c?.voteCount || 0), 0);
  const turnoutPercentage = approvedVoters > 0 
    ? ((totalVotes / approvedVoters) * 100).toFixed(1) 
    : '0.0';

  // Results by position
  const resultsByPosition = {};
  candidates.forEach(candidate => {
    const position = candidate.position || 'Unknown';
    if (!resultsByPosition[position]) {
      resultsByPosition[position] = [];
    }
    resultsByPosition[position].push({
      name: candidate.name,
      party: candidate.party,
      voteCount: Number(candidate.voteCount || 0),
      candidateCode: candidate.candidateCode,
    });
  });

  // Sort candidates by votes and calculate percentages
  Object.keys(resultsByPosition).forEach(position => {
    const positionTotal = resultsByPosition[position].reduce((sum, c) => sum + c.voteCount, 0);
    resultsByPosition[position].forEach(candidate => {
      candidate.percentage = positionTotal > 0 
        ? ((candidate.voteCount / positionTotal) * 100).toFixed(1) 
        : '0.0';
    });
    resultsByPosition[position].sort((a, b) => b.voteCount - a.voteCount);
  });

  // Determine winners (only if election ended)
  const winnersByPosition = {};
  if (electionEnded) {
    Object.keys(resultsByPosition).forEach(position => {
      if (resultsByPosition[position].length > 0) {
        winnersByPosition[position] = resultsByPosition[position][0];
      }
    });
  }

  // County participation summary
  const countyParticipation = {};
  registrationRequests.forEach(request => {
    if (request.county) {
      if (!countyParticipation[request.county]) {
        countyParticipation[request.county] = { total: 0, approved: 0, pending: 0, rejected: 0 };
      }
      countyParticipation[request.county].total++;
      if (request.status === 'approved') countyParticipation[request.county].approved++;
      if (request.status === 'pending') countyParticipation[request.county].pending++;
      if (request.status === 'rejected') countyParticipation[request.county].rejected++;
    }
  });

  // Integrity summary
  const integritySummary = {
    total: integrityAlerts.length,
    high: integrityAlerts.filter(a => a.severity === 'high').length,
    medium: integrityAlerts.filter(a => a.severity === 'medium').length,
    low: integrityAlerts.filter(a => a.severity === 'low').length,
    info: integrityAlerts.filter(a => a.severity === 'info').length,
  };

  return {
    totalRequests,
    approvedVoters,
    pendingVoters,
    rejectedVoters,
    totalCandidates: candidates.length,
    totalVotes,
    turnoutPercentage,
    electionStarted,
    electionEnded,
    resultsByPosition,
    winnersByPosition,
    countyParticipation,
    integritySummary,
  };
};

/**
 * Generate AI-style summary paragraph
 */
export const generateReportSummary = (stats) => {
  const {
    totalRequests,
    approvedVoters,
    pendingVoters,
    totalVotes,
    turnoutPercentage,
    electionStarted,
    electionEnded,
    totalCandidates,
  } = stats;

  let summary = 'This election report summarizes the current DeVote election activity. ';
  summary += `The system recorded ${totalRequests} registration requests, ${approvedVoters} approved voters`;
  
  if (pendingVoters > 0) {
    summary += `, and ${pendingVoters} pending approvals`;
  }
  
  summary += `. `;
  
  if (electionStarted && totalVotes > 0) {
    summary += `A total of ${totalVotes} votes were cast, producing a turnout of ${turnoutPercentage}%. `;
  } else if (electionStarted) {
    summary += `Voting is currently active. `;
  } else {
    summary += `Voting has not yet started. `;
  }

  if (totalCandidates > 0) {
    summary += `There are ${totalCandidates} candidates contesting across various positions. `;
  }

  summary += 'Blockchain vote records provide transparency and tamper resistance, while Firebase metadata supports voter verification and administrative review.';

  return summary;
};

/**
 * Generate full report object
 */
export const generateReport = (data = {}) => {
  const stats = calculateReportStats(data);
  const summary = generateReportSummary(stats);
  const generatedAt = new Date().toISOString();
  const reportId = `RPT-${Date.now()}`;

  return {
    id: reportId,
    title: 'DeVote Election Report',
    generatedAt,
    stats,
    summary,
    blockchainNote: 'DeVote uses blockchain records to preserve vote integrity and transparency. Once a valid vote is confirmed on-chain, it cannot be secretly altered by administrators or other users. Firebase is used to support voter registration metadata, verification workflow, and user interface operations.',
  };
};

/**
 * Generate HTML report for download/print
 */
export const generateHTMLReport = (report) => {
  const { title, generatedAt, stats, summary, blockchainNote, winnersByPosition, resultsByPosition } = report;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getElectionStatus = () => {
    if (stats.electionEnded) return 'Ended';
    if (stats.electionStarted) return 'Active';
    return 'Not Started';
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 3px solid #0b7a43; margin-bottom: 30px; }
    .header h1 { color: #0b7a43; font-size: 28px; margin-bottom: 10px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .meta { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .meta-item { font-size: 13px; color: #666; }
    .meta-item strong { color: #333; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-active { background: #d4edda; color: #155724; }
    .status-ended { background: #e2e3e5; color: #383d41; }
    .status-not-started { background: #fff3cd; color: #856404; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #0b7a43; }
    .stat-card .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #0b7a43; font-size: 20px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }
    .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7; margin-bottom: 25px; }
    .summary p { font-size: 14px; line-height: 1.7; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0b7a43; color: white; padding: 12px; text-align: left; font-size: 13px; }
    td { padding: 10px 12px; border-bottom: 1px solid #e9ecef; font-size: 14px; }
    tr:nth-child(even) { background: #f8f9fa; }
    .winner { background: #d4edda !important; font-weight: 600; }
    .winner-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
    .integrity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .integrity-item { padding: 15px; border-radius: 8px; text-align: center; }
    .integrity-high { background: #f8d7da; color: #721c24; }
    .integrity-medium { background: #fff3cd; color: #856404; }
    .integrity-low { background: #d4edda; color: #155724; }
    .integrity-info { background: #cce5ff; color: #004085; }
    .integrity-item .count { font-size: 24px; font-weight: 700; }
    .integrity-item .severity { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .blockchain-note { background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; }
    .blockchain-note p { font-size: 13px; color: #2e7d32; line-height: 1.6; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 12px; }
    .withheld-notice { background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center; color: #856404; font-size: 13px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗳️ DeVote Election Report</h1>
    <div class="subtitle">AI-Generated Election Summary</div>
  </div>

  <div class="meta">
    <div class="meta-item"><strong>Report ID:</strong> ${report.id}</div>
    <div class="meta-item"><strong>Generated:</strong> ${formatDate(generatedAt)}</div>
    <div class="meta-item">
      <strong>Status:</strong> 
      <span class="status-badge status-${getElectionStatus().toLowerCase().replace(' ', '-')}">${getElectionStatus()}</span>
    </div>
  </div>

  <div class="summary">
    <h3>Executive Summary</h3>
    <p>${summary}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.totalRequests}</div>
      <div class="label">Total Requests</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.approvedVoters}</div>
      <div class="label">Approved Voters</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.pendingVoters}</div>
      <div class="label">Pending</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.rejectedVoters}</div>
      <div class="label">Rejected</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.totalCandidates}</div>
      <div class="label">Candidates</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.totalVotes}</div>
      <div class="label">Votes Cast</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.turnoutPercentage}%</div>
      <div class="label">Turnout</div>
    </div>
  </div>`;

  // Results by position
  html += `<div class="section"><h2>Results by Position</h2>`;
  
  Object.keys(resultsByPosition).forEach(position => {
    html += `<h3 style="margin: 20px 0 10px; color: #555;">${position}</h3>`;
    html += `<table>
      <thead>
        <tr><th>Rank</th><th>Candidate</th><th>Party</th><th>Votes</th><th>Percentage</th>${stats.electionEnded ? '<th>Status</th>' : ''}</tr>
      </thead>
      <tbody>`;
    
    resultsByPosition[position].forEach((candidate, index) => {
      const isWinner = stats.electionEnded && index === 0;
      html += `<tr class="${isWinner ? 'winner' : ''}">
        <td>${index + 1}</td>
        <td>${candidate.name}</td>
        <td>${candidate.party || '-'}</td>
        <td>${candidate.voteCount}</td>
        <td>${candidate.percentage}%</td>
        ${stats.electionEnded ? `<td>${isWinner ? '<span class="winner-badge">Winner</span>' : '-'}</td>` : ''}
      </tr>`;
    });
    
    html += `</tbody></table>`;
    
    if (!stats.electionEnded) {
      html += `<div class="withheld-notice">🔒 Winner display is withheld until the election is officially ended.</div>`;
    }
  });

  html += `</div>`;

  // Integrity summary
  html += `<div class="section"><h2>Integrity Summary</h2>`;
  
  if (stats.integritySummary.total > 0 || true) {
    html += `<div class="integrity-grid">
      <div class="integrity-item integrity-high">
        <div class="count">${stats.integritySummary.high}</div>
        <div class="severity">High Risk</div>
      </div>
      <div class="integrity-item integrity-medium">
        <div class="count">${stats.integritySummary.medium}</div>
        <div class="severity">Medium Risk</div>
      </div>
      <div class="integrity-item integrity-low">
        <div class="count">${stats.integritySummary.low}</div>
        <div class="severity">Low Risk</div>
      </div>
      <div class="integrity-item integrity-info">
        <div class="count">${stats.integritySummary.info}</div>
        <div class="severity">Info</div>
      </div>
    </div>`;
  } else {
    html += `<p>No integrity alerts were recorded at the time of report generation.</p>`;
  }
  
  html += `</div>`;

  // Blockchain note
  html += `<div class="section"><h2>Blockchain Transparency</h2>
    <div class="blockchain-note">
      <p>${blockchainNote}</p>
    </div>
  </div>`;

  // Admin remarks placeholder
  html += `<div class="section"><h2>Admin Remarks</h2>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; min-height: 100px; border: 1px dashed #ccc;">
      <p style="color: #999; font-style: italic;">Space for administrator notes and observations...</p>
    </div>
  </div>`;

  html += `<div class="footer">
    <p>Generated by DeVote AI Report Generator | Report ID: ${report.id}</p>
    <p>This report contains aggregate statistics only. No personal voter data is included.</p>
  </div>
</body>
</html>`;

  return html;
};

/**
 * Generate plain text version for clipboard
 */
export const generatePlainTextReport = (report) => {
  const { title, generatedAt, stats, summary, blockchainNote } = report;
  
  let text = `
${title}
${'='.repeat(50)}
Generated: ${new Date(generatedAt).toLocaleString()}
Report ID: ${report.id}

EXECUTIVE SUMMARY
-----------------
${summary}

KEY METRICS
-----------
Total Registration Requests: ${stats.totalRequests}
Approved Voters: ${stats.approvedVoters}
Pending Approvals: ${stats.pendingVoters}
Rejected: ${stats.rejectedVoters}
Total Candidates: ${stats.totalCandidates}
Total Votes Cast: ${stats.totalVotes}
Turnout: ${stats.turnoutPercentage}%

RESULTS BY POSITION
-------------------
`;

  Object.keys(stats.resultsByPosition).forEach(position => {
    text += `\n${position}:\n`;
    stats.resultsByPosition[position].forEach((candidate, index) => {
      const winnerMark = stats.electionEnded && index === 0 ? ' [WINNER]' : '';
      text += `  ${index + 1}. ${candidate.name} (${candidate.party}) - ${candidate.voteCount} votes (${candidate.percentage}%)${winnerMark}\n`;
    });
  });

  text += `
INTEGRITY SUMMARY
-----------------
High Risk Alerts: ${stats.integritySummary.high}
Medium Risk Alerts: ${stats.integritySummary.medium}
Low Risk Alerts: ${stats.integritySummary.low}
Info Alerts: ${stats.integritySummary.info}

BLOCKCHAIN TRANSPARENCY NOTE
----------------------------
${blockchainNote}

---
This report contains aggregate statistics only. No personal voter data is included.
Generated by DeVote AI Report Generator
`;

  return text;
};

/**
 * Download report as HTML file
 */
export const downloadHTMLReport = (html, filename = 'devote-election-report.html') => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy report to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true };
    } catch (e) {
      document.body.removeChild(textArea);
      return { success: false, error: e.message };
    }
  }
};

/**
 * Print report
 */
export const printReport = () => {
  window.print();
};