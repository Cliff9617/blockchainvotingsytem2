import React, { useEffect, useMemo, useState, useCallback } from "react";
import WalletConnect from "./components/WalletConnect";
import AdminPanel from "./components/AdminPanel";
import ElectionDashboard from "./components/ElectionDashboard";
import HomePage from "./components/HomePage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import RegistrationPage from "./pages/RegistrationPage";
import VotePage from "./pages/VotePage";
import ResultsPage from "./pages/ResultsPage";
import VerifyVotePage from "./pages/VerifyVotePage";
import NationalResultsCenter from "./components/NationalResultsCenter";
import useContract from "./hooks/useContract";
import useElection from "./hooks/useElection";
import usePermissions from "./hooks/usePermissions";
import useAuditTrail from "./hooks/useAuditTrail";
import useMultiSig from "./hooks/useMultiSig";
import useIncidentManagement from "./hooks/useIncidentManagement";
import useAdmin from "./hooks/useAdmin";
import useSuperAdmin from "./hooks/useSuperAdmin";
import { ROLE_NAMES } from "./config";
import Loading from "./components/Loading";
import AIVoterAssistant from "./components/ai/AIVoterAssistant";
import ResultsGate from "./components/ResultsGate";

function App() {
  const {
    account,
    contract,
    isConnected,
    isLoading: contractLoading,
    networkError,
    connectWallet,
    disconnectWallet,
  } = useContract();

  // Super Admin detection - checks if the connected wallet holds Role.SuperAdmin (8)
  // This is the definitive check for election lifecycle authority
  // Only the wallet with SuperAdmin role can start/end elections
  const {
    isSuperAdmin: isSuperAdminWallet,
    isVerified: superAdminVerified,
  } = useSuperAdmin(contract, account);

  const {
    candidates = [],
    electionStarted,
    electionEnded,
    voterInfo,
    isLoading: electionLoading,
    error: electionError,
    actionStatus,
    checkVoterInfo,
    addCandidate,
    startElection,
    endElection,
    vote,
    registerVoter,
    bulkRegisterVoters,
    loadElectionData,
    getWinnersByPosition,
    getTotalVotesForPosition,
    getVotePercentageForPosition,
    hasVotedForPosition,
    canVoteForPosition,
  } = useElection(contract, account, isSuperAdminWallet);

  // Role-Based Access Control
  const {
    role: userRole,
    roleData: userRoleData,
    permissions,
    loading: rbacLoading,
    error: rbacError,
    isSuperAdmin,
    isCommissioner: isNationalCommissioner,
    isAuditor,
    isObserver,
    hasAnyRole,
    hasPermission,
  } = usePermissions(contract, account);

  // Derived: RBAC verification is complete when loading finishes
  const rbacVerified = !rbacLoading;

  // Admin detection - checks both contract admin and RBAC roles
  const {
    isAdmin: isContractAdmin,
    adminAddress,
    isLoading: adminLoading,
    isVerified: adminVerified,
  } = useAdmin(contract, account);

  // Audit Trail
  const {
    auditLogs,
    totalAuditLogs,
    isChainValid,
    fetchAuditLogs,
    verifyChainIntegrity,
  } = useAuditTrail(contract, account);

  // Multi-Signature Control
  const {
    proposals,
    totalProposals,
    getPendingApprovals,
    getMultiSigStats,
    createProposal,
    approveProposal,
    canApprove,
  } = useMultiSig(contract, account, userRole);

  // Incident Management
  const {
    incidents,
    stats: incidentStats,
    getIncidentsByStatus,
  } = useIncidentManagement(contract, account, userRole);

  // Voter location data for area-based filtering
  const [voterLocation, setVoterLocation] = useState(null);

  // Registration status from Firestore/localStorage
  const [registrationStatus, setRegistrationStatus] = useState(null);

  const [showDashboard, setShowDashboard] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Load registration status from localStorage
  useEffect(() => {
    if (!account) return;
    
    const loadRegistrationStatus = () => {
      try {
        const storedRequests = JSON.parse(localStorage.getItem('voterRegistrationRequests') || '[]');
        const userRequest = storedRequests.find(req => req.walletAddress === account);
        
        if (userRequest) {
          setRegistrationStatus(userRequest.status);
        } else {
          setRegistrationStatus(null);
        }
      } catch (error) {
        console.error('[App] Error loading registration status:', error);
      }
    };

    loadRegistrationStatus();
  }, [account]);

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'about') {
        setCurrentPage('about');
      } else if (hash === 'how-it-works') {
        setCurrentPage('how-it-works');
      } else if (hash === 'registration') {
        setCurrentPage('registration');
      } else if (hash === 'vote') {
        setCurrentPage('vote');
      } else if (hash === 'results') {
        setCurrentPage('results');
      } else if (hash === 'national-results') {
        setCurrentPage('national-results');
      } else if (hash === 'admin') {
        setCurrentPage('admin');
      } else if (hash === 'audit') {
        setCurrentPage('audit');
      } else if (hash === 'incidents') {
        setCurrentPage('incidents');
      } else if (hash === 'verify-vote') {
        setCurrentPage('verify-vote');
      } else {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const hasVoted = voterInfo?.hasVoted;

  const totalVotes = useMemo(() => {
    return candidates.reduce(
      (t, c) => t + Number(c?.voteCount || 0),
      0
    );
  }, [candidates]);

  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const refreshData = async () => {
    await loadElectionData();
    if (account) {
      await checkVoterInfo(account);
    }
  };

  const errorMessage = networkError || electionError || rbacError || "";

  // Overall loading state for the app (used in pages)
  const isLoading =
    contractLoading ||
    electionLoading ||
    rbacLoading;

  // Wallet connection specific loading state (only for WalletConnect component)
  // This ensures the "Connecting..." button only shows during actual wallet connection
  const isWalletConnecting = contractLoading;

  // Handle wallet connection from pages
  const handleConnectWallet = async () => {
    if (!isConnected) {
      await connectWallet();
    }
    setShowDashboard(true);
  };

  // Handle navigation between pages
  const handleNavigate = useCallback((page) => {
    setCurrentPage(page);
    switch (page) {
      case 'about':
        window.location.hash = 'about';
        break;
      case 'how-it-works':
        window.location.hash = 'how-it-works';
        break;
      case 'registration':
        window.location.hash = 'registration';
        break;
      case 'vote':
        window.location.hash = 'vote';
        break;
      case 'results':
        window.location.hash = 'results';
        break;
      case 'national-results':
        window.location.hash = 'national-results';
        break;
      case 'admin':
        window.location.hash = 'admin';
        break;
      case 'audit':
        window.location.hash = 'audit';
        break;
      case 'incidents':
        window.location.hash = 'incidents';
        break;
      case 'verify-vote':
        window.location.hash = 'verify-vote';
        break;
      default:
        window.location.hash = '';
    }
  }, []);


  // Check if user can access admin panel
  // The contract admin (deployer) ALWAYS has access when verified
  // RBAC roles provide an alternative path for admin access
  const canAccessAdmin = useMemo(() => {
    // Priority 1: Contract admin (deployer) always has access
    if (isContractAdmin && adminVerified) {
      return true;
    }
    
    // Priority 2: RBAC roles (if verified)
    if (rbacVerified) {
      const hasAdminRole = hasAnyRole && (
        isSuperAdmin || 
        isNationalCommissioner || 
        hasPermission('canManageVoters') ||
        hasPermission('canManageCandidates')
      );
      
      if (hasAdminRole) {
        return true;
      }
    }
    
    // No access
    return false;
  }, [isContractAdmin, adminVerified, rbacVerified, hasAnyRole, isSuperAdmin, isNationalCommissioner, hasPermission]);

  // Props for all pages
  const baseProps = {
    onConnectWallet: handleConnectWallet,
    isConnected,
    account,
    onNavigate: handleNavigate,
    electionStarted,
    electionEnded,
    userRole,
    userRoleData,
    permissions,
    isSuperAdmin: isSuperAdminWallet,
    isSuperAdminVerified: superAdminVerified,
    isNationalCommissioner,
    isAuditor,
    isObserver,
    hasAnyRole,
    canAccessAdmin,
  };

  const votePageProps = {
    ...baseProps,
    candidates,
    voterInfo,
    isLoading,
    error: errorMessage,
    actionStatus,
    hasVoted,
    totalVotes,
    getVotePercentage,
    getWinnersByPosition,
    getTotalVotesForPosition,
    getVotePercentageForPosition,
    hasVotedForPosition,
    canVoteForPosition,
    onVote: vote,
    onAddCandidate: addCandidate,
    onStartElection: startElection,
    onEndElection: endElection,
    onRegisterVoter: registerVoter,
    onBulkRegisterVoters: bulkRegisterVoters,
    onRefresh: refreshData,
    connectWallet,
    disconnectWallet,
    networkError,
    contractLoading,
    electionLoading,
    rbacLoading,
    onVoterLogin: setVoterLocation,
    // Admin detection props
    isAdmin: isContractAdmin,
    adminAddress: adminAddress,
    adminLoading: adminLoading || !adminVerified,
    adminVerified: adminVerified,
    // Super Admin detection props
    isSuperAdmin: isSuperAdminWallet,
    isSuperAdminVerified: superAdminVerified,
  };

  const resultsPageProps = {
    ...baseProps,
    candidates,
    electionStarted,
    electionEnded,
    isLoading,
    onRefresh: refreshData,
    contract,
    onLoadElectionData: loadElectionData,
    registrationStatus,
    voterInfo,
    voter: voterLocation,
    getWinnersByPosition,
  };

  const nationalResultsProps = {
    candidates,
    electionStarted,
    electionEnded,
    electionPaused: false,
    electionConfig: null,
    onRefresh: refreshData,
    isLoading,
    totalRegisteredVoters: 0,
    totalVotesCast: totalVotes,
    getWinnersByPosition,
    getTotalVotesForPosition,
    getVotePercentageForPosition,
  };

  // Show WalletConnect component if not connected
  if (!isConnected && !showDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <WalletConnect
          account={account}
          isConnected={isConnected}
          isLoading={isWalletConnecting}
          networkError={networkError}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
        />
      </div>
    );
  }

  // Show loading screen while verifying admin access (only when navigating to admin)
  // We need to wait for both admin and RBAC verification to complete before denying access
  const isLoadingVerification = !adminVerified || !rbacVerified;
  
  if (currentPage === 'admin' && isLoadingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Verifying administrator access..." />
      </div>
    );
  }

  // Show Admin panel for authorized users
  if (canAccessAdmin && showAdminPanel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminPanel
          account={account}
          contract={contract}
          candidates={candidates}
          electionStarted={electionStarted}
          electionEnded={electionEnded}
          isAdmin={canAccessAdmin}
          adminAddress={adminAddress}
          userRole={userRole}
          userRoleData={userRoleData}
          permissions={permissions}
          isLoading={isLoading}
          error={errorMessage}
          actionStatus={actionStatus}
          onAddCandidate={addCandidate}
          onStartElection={startElection}
          onEndElection={endElection}
          onRegisterVoter={registerVoter}
          onBulkRegisterVoters={bulkRegisterVoters}
          onRefresh={refreshData}
          // RBAC props
          hasPermission={hasPermission}
          // Super Admin authorization props
          isSuperAdmin={isSuperAdminWallet}
          isSuperAdminVerified={superAdminVerified}
          // Audit props
          auditLogs={auditLogs}
          totalAuditLogs={totalAuditLogs}
          isChainValid={isChainValid}
          fetchAuditLogs={fetchAuditLogs}
          verifyChainIntegrity={verifyChainIntegrity}
          // Multi-sig props
          proposals={proposals}
          totalProposals={totalProposals}
          getPendingApprovals={getPendingApprovals}
          getMultiSigStats={getMultiSigStats}
          createProposal={createProposal}
          approveProposal={approveProposal}
          canApprove={canApprove}
          // Incident props
          incidents={incidents}
          incidentStats={incidentStats}
          getIncidentsByStatus={getIncidentsByStatus}
          // Navigation
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  // Main application layout
  const renderCurrentPage = () => {
    const isOfficial = Boolean(canAccessAdmin || isAuditor || isSuperAdmin || isNationalCommissioner);
    const hasVotedOrFinished = Boolean(voterInfo?.hasVoted || voterInfo?.hasVotedAll || voterInfo?.hasVotedAny);
    const canViewResults = isOfficial || electionEnded || hasVotedOrFinished;

    switch (currentPage) {
      case 'about':
        return <AboutPage {...baseProps} />;
      case 'how-it-works':
        return <HowItWorksPage {...baseProps} />;
      case 'registration':
        return <RegistrationPage {...baseProps} />;
      case 'vote':
        return <VotePage {...votePageProps} />;
      case 'results':
        if (!canViewResults) {
          return <ResultsGate onNavigateToVote={() => handleNavigate('vote')} />;
        }
        return <ResultsPage {...resultsPageProps} />;
      case 'national-results':
        if (!canViewResults) {
          return <ResultsGate onNavigateToVote={() => handleNavigate('vote')} />;
        }
        return <NationalResultsCenter {...nationalResultsProps} />;
      case 'admin':
        if (canAccessAdmin) {
          setShowAdminPanel(true);
          return null;
        }
        return <HomePage {...baseProps} />;
      case 'audit':
        if (isAuditor || isSuperAdmin || hasPermission('canViewAuditLogs')) {
          return (
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Audit Trail</h1>
                <div className="bg-white rounded-lg shadow p-6">
                  <p>Total audit logs: {totalAuditLogs}</p>
                  <p>Chain integrity: {isChainValid ? '✅ Valid' : '❌ Invalid'}</p>
                  <p>Recent logs: {auditLogs.length}</p>
                </div>
              </div>
            </div>
          );
        }
        return <HomePage {...baseProps} />;
      case 'incidents':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Incident Reports</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p>Total incidents: {incidentStats.total}</p>
                <p>Open: {incidentStats.open}</p>
                <p>Under Review: {incidentStats.underReview}</p>
                <p>Resolved: {incidentStats.resolved}</p>
              </div>
            </div>
          </div>
        );
      case 'verify-vote':
        return (
          <VerifyVotePage
            account={account}
            contract={contract}
            isConnected={isConnected}
            electionEnded={electionEnded}
          />
        );
      default:
        return <HomePage {...baseProps} />;
    }
  };

  // Show pages for connected users
  if (isConnected) {
    return (
      <div className="min-h-screen">
        {renderCurrentPage()}
        
        {/* Dashboard Overlay */}
        {showDashboard && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Connected:</p>
                  <p className="font-mono text-sm font-semibold text-blue-700">{account}</p>
                  {userRoleData && (
                    <p className="text-sm text-gray-500 mt-1">
                      <strong>Role:</strong> {userRoleData.roleName || ROLE_NAMES[userRole] || 'Voter'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {canAccessAdmin && (
                    <button
                      onClick={() => {
                        setShowDashboard(false);
                        handleNavigate('admin');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => setShowDashboard(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <div className="p-6">
          <ElectionDashboard
            electionStarted={electionStarted}
            electionEnded={electionEnded}
            candidates={candidates}
            hasVoted={hasVoted}
            voterInfo={voterInfo}
            voter={voterLocation}
            isLoading={isLoading}
            error={errorMessage}
            onVote={vote}
            totalVotes={totalVotes}
            getVotePercentage={getVotePercentage}
            getWinnersByPosition={getWinnersByPosition}
            hasVotedForPosition={hasVotedForPosition}
            canVoteForPosition={canVoteForPosition}
            userRole={userRole}
            userRoleData={userRoleData}
            isAdmin={isContractAdmin}
          />
              </div>
            </div>
          </div>
        )}
        
        {/* AI Voter Assistant - Available on all pages */}
        <AIVoterAssistant
          isWalletConnected={isConnected}
          isAdmin={canAccessAdmin}
          electionStarted={electionStarted}
          electionEnded={electionEnded}
          hasVoted={hasVoted}
          isEligible={voterInfo?.isApproved || false}
        />
      </div>
    );
  }

  // Default fallback (also show assistant on wallet connect page)
  return (
    <>
      <HomePage {...baseProps} />
      <AIVoterAssistant
        isWalletConnected={isConnected}
        isAdmin={false}
        electionStarted={electionStarted}
        electionEnded={electionEnded}
        hasVoted={false}
        isEligible={false}
      />
    </>
  );
}

export default App;