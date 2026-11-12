/**
 * VerifyVotePage - Vote Verification & Vote Count Confirmation Page
 * 
 * Allows voters to verify their vote was recorded on the blockchain
 * and included in the election tally, without revealing their candidate choice.
 */
import React, { useState, useEffect } from 'react';
import { findReceiptByVerificationId, findReceiptByTransactionHash, incrementVerificationCount } from '../services/voteReceiptService';
import { verifyTransaction, verifyVoteInTally } from '../services/blockchainVerificationService';
import { downloadReceiptPDF, generateQRCodeDataUrl } from '../utils/pdfReceiptGenerator';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AlertTriangleIcon,
  BallotBoxIcon,
  CheckIcon,
  SearchIcon,
  ReceiptIcon,
  LinkIcon,
  LockIcon,
} from '../components/common/Icons';
import Navbar from '../components/Navbar';

// Verification Timeline Step Component
const TimelineStep = ({ label, status, detail, isLast }) => {
  const getStatusIcon = () => {
    if (status === 'success') return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (status === 'error') return <XCircleIcon className="w-5 h-5 text-red-500" />;
    return <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (status === 'success') return 'border-green-500 bg-green-50';
    if (status === 'loading') return 'border-blue-500 bg-blue-50';
    if (status === 'error') return 'border-red-500 bg-red-50';
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="relative flex items-start space-x-4 mb-6">
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
      )}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${getStatusColor()}`}>
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {detail && (
          <p className="text-xs text-gray-600 mt-0.5 break-all">{detail}</p>
        )}
      </div>
    </div>
  );
};

// Blockchain Badge Component
const BlockchainBadge = ({ verified }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
    verified
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-green-600' : 'bg-yellow-500'}`}></span>
    {verified ? 'Verified on Blockchain' : 'Pending Verification'}
  </div>
);

// Transaction Card Component
const TransactionCard = ({ label, value, masked }) => {
  const displayValue = masked && value?.length > 20 
    ? `${value.substring(0, 10)}...${value.substring(value.length - 8)}`
    : value;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-mono text-gray-800 break-all">{displayValue || 'N/A'}</p>
    </div>
  );
};

/**
 * Parse hash-based URL query params
 * e.g. #verify-vote?id=0x1234
 */
const getHashParam = (param) => {
  try {
    const hash = window.location.hash;
    const queryStart = hash.indexOf('?');
    if (queryStart === -1) return null;
    const searchParams = new URLSearchParams(hash.substring(queryStart));
    return searchParams.get(param);
  } catch (e) {
    return null;
  }
};

const VerifyVotePage = ({ account, contract, isConnected, electionEnded, onConnectWallet, onNavigate }) => {
  // Search mode
  const [searchMode, setSearchMode] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  
  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  
  // Verification timeline
  const [timeline, setTimeline] = useState([
    { id: 'receipt', label: 'Searching for vote record...', status: 'pending', detail: '' },
    { id: 'blockchain', label: 'Verifying on blockchain...', status: 'pending', detail: '' },
    { id: 'tally', label: 'Checking vote count inclusion...', status: 'pending', detail: '' },
    { id: 'complete', label: 'Verification complete', status: 'pending', detail: '' },
  ]);

  // Check URL hash params for verification ID on mount and hash changes
  useEffect(() => {
    const checkHashParams = () => {
      const idParam = getHashParam('id');
      if (idParam) {
        setSearchMode('id');
        setSearchValue(idParam);
        // Auto-verify after a short delay
        setTimeout(() => {
          handleVerify(idParam, 'id');
        }, 500);
      }
    };
    
    checkHashParams();
    window.addEventListener('hashchange', checkHashParams);
    return () => window.removeEventListener('hashchange', checkHashParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTimeline = (id, status, detail = '') => {
    setTimeline(prev => prev.map(step => 
      step.id === id ? { ...step, status, detail } : step
    ));
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setError('');
    setReceipt(null);
    setQrCodeUrl(null);
    setTimeline([
      { id: 'receipt', label: 'Searching for vote record...', status: 'pending', detail: '' },
      { id: 'blockchain', label: 'Verifying on blockchain...', status: 'pending', detail: '' },
      { id: 'tally', label: 'Checking vote count inclusion...', status: 'pending', detail: '' },
      { id: 'complete', label: 'Verification complete', status: 'pending', detail: '' },
    ]);
  };

  const handleVerify = async (value, mode) => {
    const searchTerm = value || searchValue;
    const searchModeType = mode || searchMode;
    
    if (!searchTerm || searchTerm.trim() === '') {
      setError('Please enter a Verification ID or Transaction Hash');
      return;
    }

    resetVerification();
    setIsVerifying(true);
    setError('');

    try {
      const trimmedValue = searchTerm.trim();
      
      // Step 1: Search for receipt
      updateTimeline('receipt', 'loading', 'Searching records...');
      
      let foundReceipt = null;
      if (searchModeType === 'id') {
        foundReceipt = await findReceiptByVerificationId(trimmedValue);
      } else {
        foundReceipt = await findReceiptByTransactionHash(trimmedValue);
      }

      if (!foundReceipt) {
        updateTimeline('receipt', 'error', 'No vote record found');
        updateTimeline('blockchain', 'error', 'Cannot verify without transaction data');
        updateTimeline('tally', 'error', 'Cannot verify tally inclusion');
        setError('No vote record found. Please check your Verification ID or Transaction Hash and try again.');
        setIsVerifying(false);
        return;
      }

      setReceipt(foundReceipt);
      updateTimeline('receipt', 'success', `Found: ${foundReceipt.electionName || 'Election'} vote record`);

      // Step 2: Blockchain verification
      updateTimeline('blockchain', 'loading', 'Querying blockchain...');
      
      const txHash = foundReceipt.transactionHash;
      const txVerification = await verifyTransaction(txHash);
      
      if (txVerification.verified) {
        updateTimeline('blockchain', 'success', 
          `Transaction confirmed in block #${txVerification.blockNumber} (${txVerification.confirmations} confirmations)`
        );
      } else {
        updateTimeline('blockchain', 'error', txVerification.message);
      }

      // Step 3: Tally inclusion check
      updateTimeline('tally', 'loading', 'Checking election tally...');
      
      let tallyResult = null;
      if (account || foundReceipt.walletAddress) {
        const walletToCheck = account || foundReceipt.walletAddress;
        tallyResult = await verifyVoteInTally(contract, walletToCheck);
        
        if (tallyResult.verified) {
          updateTimeline('tally', 'success', tallyResult.message);
        } else {
          updateTimeline('tally', 'error', tallyResult.message);
        }
      } else {
        updateTimeline('tally', 'error', 'Wallet address required for tally verification');
      }

      // Step 4: Complete
      const overallVerified = txVerification.verified && (tallyResult?.verified !== false);
      
      if (overallVerified) {
        updateTimeline('complete', 'success', 'Your vote has been successfully verified');
        
        if (foundReceipt.id) {
          await incrementVerificationCount(foundReceipt.id);
        }
      } else {
        updateTimeline('complete', 'error', 'Verification could not be fully confirmed');
      }

      // Generate QR code
      if (foundReceipt.verificationId) {
        const qr = await generateQRCodeDataUrl(foundReceipt.verificationId);
        setQrCodeUrl(qr);
      }

      setVerificationResult({
        overall: overallVerified,
        transaction: txVerification,
        tally: tallyResult,
        receipt: foundReceipt,
      });

    } catch (err) {
      console.error('[VerifyVote] Verification error:', err);
      setError(err.message || 'An error occurred during verification');
      updateTimeline('complete', 'error', 'Verification failed due to an error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (receipt) {
      downloadReceiptPDF(receipt);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vote Verification
            </h1>
            <p className="text-gray-600">
              Verify that your vote was securely recorded on the blockchain
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Enter Your Verification Details
          </h2>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => { setSearchMode('id'); resetVerification(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'id'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Vote Verification ID
            </button>
            <button
              onClick={() => { setSearchMode('tx'); resetVerification(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'tx'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Transaction Hash
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={searchMode === 'id' 
                ? 'Enter your Vote Verification ID (0x...)' 
                : 'Enter your Transaction Hash (0x...)'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              disabled={isVerifying}
            />
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || !searchValue.trim()}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                isVerifying || !searchValue.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Vote'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Verification Failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification Results */}
        {isVerifying && (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Verifying Your Vote
            </h2>
            <div className="space-y-1">
              {timeline.map((step, index) => (
                <TimelineStep
                  key={step.id}
                  icon={step.icon}
                  label={step.label}
                  status={step.status}
                  detail={step.detail}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results Display */}
        {verificationResult && !isVerifying && (
          <>
            <div className={`rounded-2xl p-6 mb-8 ${
              verificationResult.overall
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
            } text-white shadow-lg`}>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  {verificationResult.overall
                    ? <CheckCircleIcon className="w-8 h-8 text-white" />
                    : <AlertTriangleIcon className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {verificationResult.overall
                      ? 'Vote Successfully Verified'
                      : 'Verification Incomplete'}
                  </h2>
                  <p className="text-white/90 mt-1">
                    {verificationResult.overall
                      ? 'Your vote has been securely recorded on the blockchain and included in the election tally.'
                      : 'Some verification checks could not be completed.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Verification Timeline
                </h3>
                <div className="space-y-1">
                  {timeline.map((step, index) => (
                    <TimelineStep
                      key={step.id}
                      icon={step.icon}
                      label={step.label}
                      status={step.status}
                      detail={step.detail}
                      isLast={index === timeline.length - 1}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Verification Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Blockchain Status</span>
                    <BlockchainBadge verified={verificationResult.transaction?.verified} />
                  </div>
                  
                  {verificationResult.transaction?.blockNumber && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Block Number</p>
                      <p className="text-sm font-mono font-bold text-gray-800">
                        #{verificationResult.transaction.blockNumber}
                      </p>
                    </div>
                  )}

                  {verificationResult.transaction?.confirmations > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Block Confirmations</p>
                      <p className="text-sm font-mono font-bold text-gray-800">
                        {verificationResult.transaction.confirmations}
                      </p>
                    </div>
                  )}

                  {verificationResult.tally && (
                    <div className={`rounded-lg p-3 ${
                      verificationResult.tally.verified
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <p className="text-xs text-gray-500 mb-1">Vote Count Status</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {verificationResult.tally.finalized
                          ? 'Included in final count'
                          : verificationResult.tally.verified
                            ? 'Recorded in active election'
                            : 'Not found in tally'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Transaction Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TransactionCard label="Vote Verification ID" value={receipt?.verificationId} masked />
                <TransactionCard label="Transaction Hash" value={receipt?.transactionHash} masked />
                <TransactionCard label="Block Number" value={`#${receipt?.blockNumber || verificationResult.transaction?.blockNumber}`} />
                <TransactionCard label="Date & Time" value={receipt?.timestamp ? new Date(receipt.timestamp).toLocaleString() : 'N/A'} />
                <TransactionCard label="Election" value={receipt?.electionName || 'General Election'} />
                <TransactionCard label="Constituency" value={receipt?.constituency || 'N/A'} />
                <TransactionCard label="Polling Station" value={receipt?.pollingStation || 'N/A'} />
                <TransactionCard label="Wallet Address" value={receipt?.walletAddressMasked || 'N/A'} />
              </div>
            </div>

            {electionEnded && verificationResult.tally?.finalized && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BallotBoxIcon className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-800 flex items-center gap-1.5">
                      <CheckIcon className="w-4 h-4" />
                      Your vote has been included in the final vote count.
                    </h3>
                    <p className="text-green-700 text-sm mt-1">
                      Your vote was successfully counted in the official election results.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Verification QR Code
                  </h3>
                  {qrCodeUrl ? (
                    <div className="inline-block bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <img src={qrCodeUrl} alt="Verification QR Code" className="w-40 h-40 mx-auto" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                      <p className="text-gray-400 text-sm">QR Code</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Scan to verify your vote</p>
                </div>

                <div className="flex flex-col justify-center items-center md:items-start">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Download Receipt</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a PDF receipt of your vote verification for your records.
                  </p>
                  <button
                    onClick={handleDownloadReceipt}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF Receipt</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
              <div className="flex items-start space-x-3">
                <LockIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-semibold text-sm">Anonymous Verification</p>
                  <p className="text-blue-700 text-xs mt-1">
                    This verification confirms that your ballot exists and was counted in the official election results. 
                    It does not reveal which candidate you voted for. Your vote remains secret and anonymous.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!verificationResult && !isVerifying && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Vote</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter your Vote Verification ID or Transaction Hash above to verify that your vote was securely recorded on the blockchain.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <ReceiptIcon className="w-4 h-4 text-gray-500" />
                  Vote Verification ID
                </p>
                <p className="text-xs text-gray-600">Found on your vote receipt after casting your vote.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  Transaction Hash
                </p>
                <p className="text-xs text-gray-600">The blockchain transaction hash from your vote transaction.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyVotePage;