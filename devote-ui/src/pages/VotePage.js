import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AdminPanel from '../components/AdminPanel';
import ElectionDashboard from '../components/ElectionDashboard';
import { authenticateVoter } from '../services/registrationService';
import { checkSmileVerificationStatus, verifyVoterIdentity } from '../services/smileIdService';

/**
 * VotePage - Main voting page with sign-in gate
 * 
 * Flow:
 * 1. Not signed in → Show gate card with "Sign In to Vote" button
 * 2. Click "Sign In to Vote" → Reveal login section with tabs
 * 3. Voter Login → Validate form → Show ballot (ElectionDashboard)
 * 4. IEBC Staff Login → Validate form → Check admin wallet → Show AdminPanel
 */
const VotePage = ({
  onConnectWallet,
  isConnected,
  account,
  onNavigate,
  electionStarted,
  electionEnded,
  // Election data props
  candidates = [],
  voterInfo = {},
  isLoading = false,
  error = "",
  actionStatus = "",
  isAdmin = false,
  adminAddress = null,
  hasVoted = false,
  totalVotes = 0,
  getVotePercentage,
  hasVotedForPosition,
  canVoteForPosition,
  // Actions
  onVote,
  onAddCandidate,
  onStartElection,
  onEndElection,
  onRegisterVoter,
  onBulkRegisterVoters,
  onRefresh,
  // Wallet actions
  connectWallet,
  disconnectWallet,
  networkError,
  contractLoading,
  electionLoading,
  adminLoading = false,
  // Admin verification state
  adminVerified = false,
  // Super Admin authorization props
  isSuperAdmin = false,
  isSuperAdminVerified = false,
  userRole = null,
  userRoleData = null,
  // Voter location callback for area-based filtering
  onVoterLogin,
}) => {
  // UI State
  const [showSignInSection, setShowSignInSection] = useState(false);
  const [activeTab, setActiveTab] = useState('voter'); // 'voter' | 'iebc'
  
  // Voter form state
  const [voterForm, setVoterForm] = useState({
    fullName: '',
    nationalId: '',
    pin: '',
  });
  const [voterFormErrors, setVoterFormErrors] = useState({});
  const [showPin, setShowPin] = useState(false);
  const [voterLoggedIn, setVoterLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [voterData, setVoterData] = useState(null); // { county, constituency, ward }
  const [smileGateBlocked, setSmileGateBlocked] = useState(false);
  const [smileGateStatus, setSmileGateStatus] = useState(null);
  const [isSmileVerifying, setIsSmileVerifying] = useState(false);
  const [smileDob, setSmileDob] = useState('');
  
  // IEBC Staff form state
  const [staffForm, setStaffForm] = useState({
    username: '',
    password: '',
  });
  const [staffFormErrors, setStaffFormErrors] = useState({});
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffLoggedIn, setStaffLoggedIn] = useState(false);
  
  const loginSectionRef = useRef(null);

  // Scroll to login section when showSignInSection becomes true
  useEffect(() => {
    if (showSignInSection && loginSectionRef.current) {
      setTimeout(() => {
        loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showSignInSection]);

  // Debug logging
  useEffect(() => {
    console.log('Connected wallet:', account);
    console.log('Contract admin:', adminAddress);
    console.log('Is Admin:', isAdmin);
    console.log('[VotePage] State:', {
      isConnected,
      account,
      isAdmin,
      adminAddress,
      voterLoggedIn,
      staffLoggedIn,
      showSignInSection,
      electionStarted,
      electionEnded,
    });
  }, [isConnected, account, isAdmin, adminAddress, voterLoggedIn, staffLoggedIn, showSignInSection, electionStarted, electionEnded]);

  // Handle wallet switch request
  const handleSwitchWallet = async () => {
    try {
      console.log('Requesting wallet permissions...');
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
      // Reconnect wallet after permission request
      await connectWallet();
    } catch (err) {
      console.error('Failed to switch wallet:', err);
    }
  };

  // Handle "Sign In to Vote" button click from gate card
  const handleSignInClick = () => {
    setShowSignInSection(true);
  };

  // Voter form handlers
  const handleVoterInputChange = (e) => {
    const { name, value } = e.target;
    setVoterForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (voterFormErrors[name]) {
      setVoterFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateVoterForm = () => {
    const errors = {};
    if (!voterForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!voterForm.nationalId.trim()) {
      errors.nationalId = 'National ID number is required';
    } else if (!/^\d{8}$/.test(voterForm.nationalId.trim())) {
      errors.nationalId = 'National ID must contain 7 to 9 digits';
    }
    if (!voterForm.pin.trim()) {
      errors.pin = 'Voting PIN is required';
    } else if (!/^\d{4,6}$/.test(voterForm.pin.trim())) {
      errors.pin = 'PIN must be 4-6 digits';
    }
    setVoterFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVoterSubmit = async (e) => {
    e.preventDefault();
    if (!validateVoterForm()) return;

    console.log('[VotePage] Voter login attempt:', {
      fullName: voterForm.fullName,
      nationalId: voterForm.nationalId,
      // Never log PIN in production!
    });

    setIsAuthenticating(true);
    setAuthError('');

    try {
      // Authenticate voter using secure verification
      const result = await authenticateVoter(
        voterForm.fullName,
        voterForm.nationalId,
        voterForm.pin
      );

      if (result.success) {
        // Verify Smile ID KYC status
        const voterWallet = result.voter?.walletAddress || account;
        let smileVerified = result.voter?.smileStatus === 'smile_verified' || result.voter?.smileStatus === 'verified';
        
        if (!smileVerified && voterWallet) {
          const check = await checkSmileVerificationStatus(voterWallet);
          smileVerified = check.verified;
        }

        if (!smileVerified && result.voter?.smileStatus === 'smile_rejected') {
          setSmileGateBlocked(true);
          setSmileGateStatus({
            status: 'REJECTED',
            message: 'Your identity could not be verified by Smile ID. Staged on IEBC Admin Panel.',
            voter: result.voter,
          });
          return;
        }

        if (!smileVerified && result.voter?.smileStatus === 'pending_review') {
          setSmileGateBlocked(true);
          setSmileGateStatus({
            status: 'PENDING_REVIEW',
            message: 'Your voter registration is currently staged for manual review in the IEBC Admin Panel.',
            voter: result.voter,
          });
          return;
        }

        if (!smileVerified) {
          setSmileGateBlocked(true);
          setSmileGateStatus({
            status: 'UNVERIFIED',
            message: 'In accordance with IEBC requirements, automated Smile ID verification is required to unlock your ballot.',
            voter: result.voter,
          });
          return;
        }

        // Authentication & Smile ID verification successful - mark voter as logged in
        setVoterLoggedIn(true);
        
        // Store voter location data for filtering
        if (result.voter) {
          const voterLocationData = {
            fullName: result.voter.fullName || voterForm.fullName || "Citizen Voter",
            county: result.voter.county,
            constituency: result.voter.constituency,
            ward: result.voter.ward,
          };
          setVoterData(voterLocationData);
          
          // Lift voter location to App.js for ResultsPage filtering
          if (typeof onVoterLogin === 'function') {
            onVoterLogin(voterLocationData);
          }
          
          console.log("Voter location data stored:", voterLocationData);
        }
        
        // If not connected to wallet, trigger wallet connection
        if (!isConnected) {
          await onConnectWallet();
        }
      } else {
        // Authentication failed - show appropriate error
        setAuthError(result.error);
        console.log('[VotePage] Authentication failed:', result.errorCode, result.error);
      }
    } catch (error) {
      console.error('[VotePage] Authentication error:', error);
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleInlineSmileVerify = async () => {
    if (!smileDob) {
      alert('Please enter your date of birth for automated Smile ID verification.');
      return;
    }
    setIsSmileVerifying(true);
    try {
      const activeVoter = smileGateStatus?.voter;
      const res = await verifyVoterIdentity({
        nationalId: activeVoter?.idNumber || voterForm.nationalId,
        fullName: activeVoter?.fullName || voterForm.fullName,
        dob: smileDob,
        walletAddress: activeVoter?.walletAddress || account || `wallet_${voterForm.nationalId}`,
      });

      if (res.status === 'VERIFIED') {
        setSmileGateBlocked(false);
        setVoterLoggedIn(true);
        if (activeVoter) {
          const voterLocationData = {
            fullName: activeVoter.fullName || voterForm.fullName || "Citizen Voter",
            county: activeVoter.county,
            constituency: activeVoter.constituency,
            ward: activeVoter.ward,
          };
          setVoterData(voterLocationData);
          if (typeof onVoterLogin === 'function') {
            onVoterLogin(voterLocationData);
          }
        }
      } else {
        setSmileGateStatus({
          status: res.status,
          message: res.message || 'Verification submitted. Staged for official IEBC review.',
          voter: activeVoter,
        });
      }
    } catch (e) {
      alert(e.message || 'Verification failed. Please try again.');
    } finally {
      setIsSmileVerifying(false);
    }
  };

  // IEBC Staff form handlers
  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffForm(prev => ({ ...prev, [name]: value }));
    if (staffFormErrors[name]) {
      setStaffFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStaffForm = () => {
    const errors = {};
    if (!staffForm.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!staffForm.password.trim()) {
      errors.password = 'Password is required';
    }
    setStaffFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!validateStaffForm()) return;

    console.log('[VotePage] IEBC Staff login attempt:', {
      username: staffForm.username,
    });

    // Mark staff as logged in
    setStaffLoggedIn(true);

    // If not connected to wallet, trigger wallet connection
    if (!isConnected) {
      await onConnectWallet();
    }

    // Check admin status after connection
    // The actual admin check happens via useAdmin hook in App.js
    // If the connected wallet is not admin, show access denied
  };

  // Determine what to show
  const shouldShowGateCard = !showSignInSection && !voterLoggedIn && !staffLoggedIn;
  const shouldShowLoginForm = !smileGateBlocked && showSignInSection && !voterLoggedIn && !staffLoggedIn;
  const shouldShowVoterBallot = voterLoggedIn && !isAdmin;
  const shouldShowAdminPanel = staffLoggedIn && isAdmin;
  // Only show "Access Denied" after admin verification is complete
  // If still loading, show "Verifying..." instead
  const shouldShowAdminDenied = staffLoggedIn && !isAdmin && adminVerified;
  const shouldShowAdminVerifying = staffLoggedIn && !adminVerified;

  const combinedError = networkError || error || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
        resultsLocked={!(voterInfo?.hasVotedAny || hasVoted) && !electionEnded && !isAdmin}
      />

      {/* ===== SMILE ID IDENTITY VERIFICATION GATE ===== */}
      {smileGateBlocked && (
        <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              smileGateStatus?.status === 'REJECTED' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {smileGateStatus?.status === 'REJECTED' ? (
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-gray-100 text-gray-800 border border-gray-200">
              <span className={`w-2 h-2 rounded-full ${
                smileGateStatus?.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></span>
              Smile ID: {smileGateStatus?.status === 'REJECTED' ? 'Verification Failed' : 'Verification Required'}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              National Identity Gate
            </h2>

            <p className="text-gray-600 mb-6 text-sm">
              {smileGateStatus?.message || 'Under Kenya election cybersecurity guidelines, all voters must have their identity verified prior to casting an official ballot.'}
            </p>

            {smileGateStatus?.status === 'UNVERIFIED' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left space-y-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Confirm Date of Birth (for Smile ID Enhanced KYC):
                </label>
                <input
                  type="date"
                  value={smileDob}
                  onChange={(e) => setSmileDob(e.target.value)}
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
                <button
                  onClick={handleInlineSmileVerify}
                  disabled={isSmileVerifying}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isSmileVerifying ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying with Smile ID...
                    </>
                  ) : (
                    'Verify with Smile ID Now'
                  )}
                </button>
              </div>
            )}

            {smileGateStatus?.status === 'PENDING_REVIEW' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-xs text-yellow-800 text-left">
                Your request has been forwarded to the IEBC returning officers' admin panel. Once approved, you will be able to access the ballot immediately.
              </div>
            )}

            <button
              onClick={() => {
                setSmileGateBlocked(false);
                setSmileGateStatus(null);
                setVoterLoggedIn(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* ===== GATE CARD: Please Sign In to Vote ===== */}
      {!smileGateBlocked && shouldShowGateCard && (
        <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4 py-6 sm:py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Please Sign In to Vote
            </h2>
            <p className="text-gray-600 mb-8">
              Sign in as a voter to access the ballot, or as IEBC staff to manage the election.
            </p>
            <button
              onClick={handleSignInClick}
              className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              Sign In to Vote
            </button>
          </div>
        </div>
      )}

      {/* ===== LOGIN SECTION ===== */}
      {shouldShowLoginForm && (
        <div
          ref={loginSectionRef}
          className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4 py-6 sm:py-12"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-4xl w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left: Info Panel (Dark Green) */}
              <div className="bg-green-800 text-white p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">DeVote</h2>
                  <p className="text-green-200 text-lg mb-1">Kura Yako · Sauti Yako</p>
                  <p className="text-green-300 text-sm">Your Vote · Your Voice</p>
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-lg mb-4">How to sign in:</h3>
                  <ol className="space-y-3 text-green-100">
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                        1
                      </span>
                      <span>Enter your full name</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                        2
                      </span>
                      <span>Enter your National ID number</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                        3
                      </span>
                      <span>Enter your voting PIN</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                        4
                      </span>
                      <span>Connect your wallet and proceed</span>
                    </li>
                  </ol>
                </div>

                <div className="mt-8 pt-6 border-t border-green-700">
                  <div className="flex items-center text-green-200 text-sm">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Your personal details are kept private and secure</span>
                  </div>
                </div>
              </div>

              {/* Right: Login Card */}
              <div className="p-8 md:p-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In to Vote</h2>
                <p className="text-gray-600 mb-6">Choose how you want to access the system.</p>

                {/* Tabs */}
                <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                  <button
                    onClick={() => setActiveTab('voter')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'voter'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Voter Login
                  </button>
                  <button
                    onClick={() => setActiveTab('iebc')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'iebc'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    IEBC Staff
                  </button>
                </div>

                {/* Voter Login Form */}
                {activeTab === 'voter' && (
                  <form onSubmit={handleVoterSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={voterForm.fullName}
                        onChange={handleVoterInputChange}
                        placeholder="e.g. JOHN KAMAU NJOROGE"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                          voterFormErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {voterFormErrors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{voterFormErrors.fullName}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Write in CAPITAL LETTERS, exactly as on your National ID card.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        National ID Number
                      </label>
                      <input
                        type="text"
                        name="nationalId"
                        value={voterForm.nationalId}
                        onChange={handleVoterInputChange}
                        placeholder="e.g. 1234567"
                        maxLength={9}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                          voterFormErrors.nationalId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {voterFormErrors.nationalId && (
                        <p className="mt-1 text-sm text-red-600">{voterFormErrors.nationalId}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Enter your Kenyan National ID number.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voting PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          name="pin"
                          value={voterForm.pin}
                          onChange={handleVoterInputChange}
                          placeholder="4–6 digit PIN"
                          maxLength={6}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                            voterFormErrors.pin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPin ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {voterFormErrors.pin && (
                        <p className="mt-1 text-sm text-red-600">{voterFormErrors.pin}</p>
                      )}
                    </div>

                    {/* Authentication error display */}
                    {authError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{authError}</p>
                      </div>
                    )}

                    {combinedError && !authError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{combinedError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthenticating || contractLoading || electionLoading || adminLoading}
                      className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {(isAuthenticating || contractLoading || electionLoading || adminLoading) ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Sign In & Go to Ballot'
                      )}
                    </button>
                  </form>
                )}

                {/* IEBC Staff Login Form */}
                {activeTab === 'iebc' && (
                  <form onSubmit={handleStaffSubmit} className="space-y-5">
                    {/* Warning Box */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm text-yellow-800">
                          This area is for authorized election staff only. Unauthorized access is prohibited.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Staff Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={staffForm.username}
                        onChange={handleStaffInputChange}
                        placeholder="Enter your staff username"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                          staffFormErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {staffFormErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{staffFormErrors.username}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showStaffPassword ? 'text' : 'password'}
                          name="password"
                          value={staffForm.password}
                          onChange={handleStaffInputChange}
                          placeholder="Enter your password"
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                            staffFormErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showStaffPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {staffFormErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{staffFormErrors.password}</p>
                      )}
                    </div>

                    {combinedError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{combinedError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={contractLoading || electionLoading || adminLoading}
                      className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {(contractLoading || electionLoading || adminLoading) ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Sign In to Staff Dashboard'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VOTER BALLOT (after voter login) ===== */}
      {shouldShowVoterBallot && (
        <div className="min-h-screen">
          {/* Election Dashboard with unified header, welcome hero, and sequential voting flow */}
          <ElectionDashboard
            electionStarted={electionStarted}
            electionEnded={electionEnded}
            candidates={candidates}
            hasVoted={hasVoted}
            voterInfo={voterInfo}
            voter={voterData}
            isLoading={isLoading}
            error={combinedError}
            onVote={onVote}
            hasVotedForPosition={hasVotedForPosition}
            canVoteForPosition={canVoteForPosition}
            totalVotes={totalVotes}
            getVotePercentage={getVotePercentage}
            isAdmin={isAdmin}
            isConnected={isConnected}
            account={account}
            onSignOut={() => {
              setVoterLoggedIn(false);
              setShowSignInSection(false);
            }}
            onProceedToResults={() => {
              if (onNavigate) {
                onNavigate('results');
              } else {
                window.location.hash = 'results';
              }
            }}
          />
        </div>
      )}

      {/* ===== ADMIN PANEL (after IEBC staff login + admin wallet) ===== */}
      {shouldShowAdminPanel && (
        <div className="min-h-screen bg-green-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Connected:</p>
                  <p className="font-mono text-sm font-semibold text-green-700">{account}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Role:</strong> IEBC Administrator
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStaffLoggedIn(false);
                    setShowSignInSection(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <AdminPanel
              account={account}
              candidates={candidates}
              electionStarted={electionStarted}
              electionEnded={electionEnded}
              isAdmin={isAdmin}
              isLoading={isLoading}
              error={combinedError}
              actionStatus={actionStatus}
              onAddCandidate={onAddCandidate}
              onStartElection={onStartElection}
              onEndElection={onEndElection}
              onRegisterVoter={onRegisterVoter}
              onBulkRegisterVoters={onBulkRegisterVoters}
              onRefresh={onRefresh}
              // Super Admin authorization props (CRITICAL: must be passed for election lifecycle controls)
              isSuperAdmin={isSuperAdmin}
              isSuperAdminVerified={isSuperAdminVerified}
              userRole={userRole}
              userRoleName={userRoleData?.roleName || ''}
            />
          </div>
        </div>
      )}

      {/* ===== ADMIN VERIFICATION IN PROGRESS ===== */}
      {shouldShowAdminVerifying && (
        <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.051M4.001 12a8 8 0 1115.987 1.463M20 12a8 8 0 11-15.987-1.463M19.999 20v-5h-.051"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verifying Administrator Privileges...
            </h2>
            <p className="text-gray-600 mb-4">
              Please wait while we verify your wallet permissions.
            </p>
            
            {/* Wallet and Admin Address Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Connected wallet:</span>{" "}
                <span className="font-mono text-xs">{account || "Not connected"}</span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Admin wallet:</span>{" "}
                <span className="font-mono text-xs">{adminAddress || "Loading..."}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMIN ACCESS DENIED ===== */}
      {shouldShowAdminDenied && (
        <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              This wallet is not the election administrator.
            </p>
            
            {/* Wallet and Admin Address Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Connected wallet:</span>{" "}
                <span className="font-mono text-xs">{account || "Not connected"}</span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Admin wallet:</span>{" "}
                <span className="font-mono text-xs">{adminAddress || "Loading..."}</span>
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleSwitchWallet}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                Switch Wallet
              </button>
              <button
                onClick={() => {
                  setStaffLoggedIn(false);
                  setShowSignInSection(false);
                }}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;