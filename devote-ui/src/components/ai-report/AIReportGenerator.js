import React, { useState } from 'react';
import {
  generateReport,
  generateHTMLReport,
  generatePlainTextReport,
  downloadHTMLReport,
  copyToClipboard,
  printReport,
} from './reportUtils';
import './AIReportGenerator.css';

const AIReportGenerator = ({
  candidates = [],
  registrationRequests = [],
  electionStarted = false,
  electionEnded = false,
  integrityAlerts = [],
  onRefresh,
}) => {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    const newReport = generateReport({
      candidates,
      registrationRequests,
      electionStarted,
      electionEnded,
      integrityAlerts,
    });
    setReport(newReport);
    setIsGenerating(false);
  };

  const handlePrint = () => {
    if (report) {
      const html = generateHTMLReport(report);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDownload = () => {
    if (report) {
      const html = generateHTMLReport(report);
      downloadHTMLReport(html, 'devote-election-report.html');
    }
  };

  const handleCopy = async () => {
    if (report) {
      const text = generatePlainTextReport(report);
      const result = await copyToClipboard(text);
      if (result.success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus(''), 2000);
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  return (
    <div className="ai-report-generator">
      <div className="ai-report-header">
        <div className="ai-report-title">
          <div className="ai-report-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h2>DeVote AI Report Generator</h2>
            <p className="ai-report-subtitle">
              Generate a professional election summary report for audit, presentation, and documentation.
            </p>
          </div>
        </div>
      </div>

      <div className="ai-report-actions">
        <button
          className="ai-btn ai-btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>

        {report && (
          <>
            <button className="ai-btn ai-btn-secondary" onClick={handlePrint}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Report
            </button>

            <button className="ai-btn ai-btn-secondary" onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Report
            </button>

            <button className="ai-btn ai-btn-secondary" onClick={handleCopy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              {copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy Report'}
            </button>
          </>
        )}
      </div>

      {report && (
        <div className="ai-report-preview">
          <div className="ai-report-preview-header">
            <h3>Report Preview</h3>
            <span className="ai-report-id">{report.id}</span>
          </div>

          <div className="ai-report-summary-card">
            <h4>Executive Summary</h4>
            <p>{report.summary}</p>
          </div>

          <div className="ai-report-stats-row">
            <div className="ai-report-stat">
              <span className="ai-report-stat-value">{report.stats.totalRequests}</span>
              <span className="ai-report-stat-label">Total Requests</span>
            </div>
            <div className="ai-report-stat">
              <span className="ai-report-stat-value">{report.stats.approvedVoters}</span>
              <span className="ai-report-stat-label">Approved Voters</span>
            </div>
            <div className="ai-report-stat">
              <span className="ai-report-stat-value">{report.stats.pendingVoters}</span>
              <span className="ai-report-stat-label">Pending</span>
            </div>
            <div className="ai-report-stat">
              <span className="ai-report-stat-value">{report.stats.totalCandidates}</span>
              <span className="ai-report-stat-label">Candidates</span>
            </div>
            <div className="ai-report-stat">
              <span className="ai-report-stat-value">{report.stats.totalVotes}</span>
              <span className="ai-report-stat-label">Votes Cast</span>
            </div>
            <div className="ai-report-stat highlight">
              <span className="ai-report-stat-value">{report.stats.turnoutPercentage}%</span>
              <span className="ai-report-stat-label">Turnout</span>
            </div>
          </div>

          <div className="ai-report-section">
            <h4>Results by Position</h4>
            {Object.keys(report.stats.resultsByPosition).map(position => (
              <div key={position} className="ai-report-position">
                <h5>{position}</h5>
                <table>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Party</th>
                      <th>Votes</th>
                      <th>%</th>
                      {report.stats.electionEnded && <th>Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {report.stats.resultsByPosition[position].map((candidate, idx) => (
                      <tr key={idx} className={idx === 0 && report.stats.electionEnded ? 'winner-row' : ''}>
                        <td>{candidate.name}</td>
                        <td>{candidate.party || '-'}</td>
                        <td>{candidate.voteCount}</td>
                        <td>{candidate.percentage}%</td>
                        {report.stats.electionEnded && (
                          <td>{idx === 0 ? <span className="winner-badge">Winner</span> : '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!report.stats.electionEnded && (
                  <div className="withheld-notice">
                    Winner display is withheld until the election is officially ended.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ai-report-section">
            <h4>Integrity Summary</h4>
            <div className="ai-report-integrity-grid">
              <div className="integrity-stat high">
                <span className="integrity-count">{report.stats.integritySummary.high}</span>
                <span className="integrity-label">High Risk</span>
              </div>
              <div className="integrity-stat medium">
                <span className="integrity-count">{report.stats.integritySummary.medium}</span>
                <span className="integrity-label">Medium Risk</span>
              </div>
              <div className="integrity-stat low">
                <span className="integrity-count">{report.stats.integritySummary.low}</span>
                <span className="integrity-label">Low Risk</span>
              </div>
              <div className="integrity-stat info">
                <span className="integrity-count">{report.stats.integritySummary.info}</span>
                <span className="integrity-label">Info</span>
              </div>
            </div>
          </div>

          <div className="ai-report-section">
            <h4>Blockchain Transparency</h4>
            <div className="blockchain-note">
              <p>{report.blockchainNote}</p>
            </div>
          </div>

          <div className="ai-report-section">
            <h4>Admin Remarks</h4>
            <div className="admin-remarks">
              <p>Space for administrator notes and observations...</p>
            </div>
          </div>

          <div className="ai-report-footer">
            <p>Generated by DeVote AI Report Generator | {report.id}</p>
            <p>This report contains aggregate statistics only. No personal voter data is included.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportGenerator;