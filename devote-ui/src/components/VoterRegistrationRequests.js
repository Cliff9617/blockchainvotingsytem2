import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAllRegistrationRequests, updateRegistrationStatus } from '../services/registrationService';

const VoterRegistrationRequests = ({ onApproveVoter }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const listenerUnsubRef = useRef(null);

  // Set up real-time listener for registration requests
  useEffect(() => {
    console.log('Loading voter registration requests...');
    
    // Set up real-time listener using onSnapshot
    const requestsRef = collection(db, 'voterRegistrationRequests');
    
    // Try with orderBy first, fallback to without orderBy if index is missing
    const setupListener = async () => {
      try {
        // Try with orderBy first
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        listenerUnsubRef.current = onSnapshot(q, 
          (snapshot) => {
            const loadedRequests = [];
            snapshot.forEach((doc) => {
              loadedRequests.push({ id: doc.id, ...doc.data() });
            });
            setRequests(loadedRequests);
            console.log('Requests loaded:', loadedRequests.length);
            console.log('Requests data:', loadedRequests);
            setIsLoading(false);
          },
          (err) => {
            console.warn('[VoterRegistrationRequests] Real-time listener error:', err);
            // Fallback: try without orderBy
            console.log('Falling back to unsorted query...');
            listenerUnsubRef.current = onSnapshot(requestsRef,
              (snapshot) => {
                const loadedRequests = [];
                snapshot.forEach((doc) => {
                  loadedRequests.push({ id: doc.id, ...doc.data() });
                });
                // Sort manually by createdAt
                loadedRequests.sort((a, b) => {
                  const dateA = new Date(a.createdAt?._seconds ? a.createdAt._seconds * 1000 : a.createdAt || 0);
                  const dateB = new Date(b.createdAt?._seconds ? b.createdAt._seconds * 1000 : b.createdAt || 0);
                  return dateB - dateA;
                });
                setRequests(loadedRequests);
                console.log('Requests loaded (fallback):', loadedRequests.length);
                console.log('Requests data:', loadedRequests);
                setIsLoading(false);
              },
              (fallbackErr) => {
                console.error('[VoterRegistrationRequests] Fallback listener error:', fallbackErr);
                // Last resort: load from localStorage
                loadFromLocalStorage();
              }
            );
          }
        );
      } catch (err) {
        console.error('[VoterRegistrationRequests] Error setting up listener:', err);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      console.log('Loading from localStorage as fallback...');
      const storedRequests = JSON.parse(localStorage.getItem('voterRegistrationRequests') || '[]');
      setRequests(storedRequests);
      console.log('Requests loaded from localStorage:', storedRequests.length);
      setIsLoading(false);
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (listenerUnsubRef.current) {
        listenerUnsubRef.current();
        console.log('[VoterRegistrationRequests] Real-time listener cleaned up');
      }
    };
  }, []);

  // Filter requests when filter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(r => r.status === activeFilter));
    }
  }, [activeFilter, requests]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllRegistrationRequests();
      // Sort by date (newest first)
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setRequests(sorted);
      console.log('[VoterRegistrationRequests] Loaded', sorted.length, 'requests');
    } catch (err) {
      console.error('[VoterRegistrationRequests] Error loading requests:', err);
      setError('Failed to load registration requests');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // FIX: Blockchain-first voter approval
  // ============================================================================
  // ROOT CAUSE: The previous implementation caught blockchain errors and
  // continued to mark the voter as "approved" in Firestore regardless of whether
  // the on-chain registration succeeded. This caused registeredVoters(wallet) to
  // return false even though the UI showed the voter as approved.
  //
  // FIX: The blockchain is the source of truth. We:
  //   1. Call onApproveVoter(wallet, county, constituency, ward) which invokes
  //      contract.registerVoter() and waits for tx.wait()
  //   2. Only if that succeeds do we write "approved" to Firestore (metadata)
  //
  // If the blockchain transaction fails, we do NOT mark the voter as approved.
  // "Voter already registered" is treated as success (idempotent).
  // ============================================================================
  const handleApprove = async (request) => {
    if (!window.confirm(`Approve registration for ${request.fullName}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[VoterRegistrationRequests] Approving voter:', request.fullName, 'Wallet:', request.walletAddress);

      // STEP 1: Register voter on the BLOCKCHAIN FIRST (source of truth)
      if (!onApproveVoter || !request.walletAddress) {
        throw new Error(
          "Cannot approve voter: blockchain registration function or wallet address is missing. " +
          "The voter cannot be approved without on-chain registration."
        );
      }

      console.log('[VoterRegistrationRequests] Registering voter on blockchain (source of truth):', request.walletAddress);

      try {
        // Call contract.registerVoter(address, county, constituency, ward) via the prop
        // The prop (from useElection) waits for tx.wait() and verifies the result.
        await onApproveVoter(
          request.walletAddress,
          request.county || '',
          request.constituency || '',
          request.ward || ''
        );
        console.log('[VoterRegistrationRequests] ✅ Voter registered on blockchain');
      } catch (blockchainError) {
        const errorMessage = String(blockchainError.message || blockchainError);
        // "Voter already registered" is idempotent - treat as success
        if (errorMessage.includes('Voter already registered') || errorMessage.includes('already registered')) {
          console.warn('[VoterRegistrationRequests] Voter already registered on-chain, continuing:', request.walletAddress);
        } else {
          // Any other blockchain error is BLOCKING - do not mark as approved
          console.error('[VoterRegistrationRequests] ❌ Blockchain registration failed:', blockchainError);
          throw new Error(
            "Blockchain registration failed: " + (blockchainError.reason || blockchainError.shortMessage || blockchainError.message) +
            ". Voter has NOT been approved."
          );
        }
      }

      // STEP 2: ONLY after blockchain success, save metadata to Firestore
      // Firestore is metadata storage only - the blockchain is the source of truth.
      const wallet = request.walletAddress.toLowerCase();
      const voterData = {
        fullName: request.fullName || "",
        idNumber: String(request.idNumber || ""),
        pin: String(request.pin || ""),
        walletAddress: wallet,
        county: request.county || "",
        constituency: request.constituency || "",
        ward: request.ward || "",
        status: "approved",
        approvedAt: serverTimestamp(),
        sourceRequestId: request.id,
        blockchainRegistered: true,
        hasVotedPresident: false,
        hasVotedGovernor: false,
        hasVotedSenator: false,
        hasVotedMP: false,
        hasVotedWomanRepresentative: false,
        hasVotedMCA: false
      };

      console.log('[VoterRegistrationRequests] Blockchain success - saving metadata to Firestore:', wallet);
      console.log("Voter data:", voterData);

      await setDoc(doc(db, "voters", wallet), voterData, { merge: true });
      console.log("Voter document saved successfully");

      // Update Firestore approval status
      await updateRegistrationStatus(request.id, 'approved');
      console.log('[VoterRegistrationRequests] Firestore approval completed for:', request.id);

      // Update local state
      setRequests(prev => prev.map(r =>
        r.id === request.id ? { ...r, status: 'approved', updatedAt: new Date().toISOString() } : r
      ));
    } catch (err) {
      console.error('[VoterRegistrationRequests] ❌ Error approving request:', err);
      alert('Failed to approve registration: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowModal(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await updateRegistrationStatus(selectedRequest.id, 'rejected', rejectionReason);
      console.log('[VoterRegistrationRequests] Rejected request:', selectedRequest.id);
      
      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === selectedRequest.id ? { 
          ...r, 
          status: 'rejected', 
          rejectionReason,
          updatedAt: new Date().toISOString() 
        } : r
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      console.error('[VoterRegistrationRequests] Error rejecting request:', err);
      alert('Failed to reject registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading registration requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Voter Registration Requests</h2>
        <button
          onClick={loadRequests}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {stats[filter]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No {activeFilter !== 'all' ? activeFilter : ''} registration requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`border rounded-lg p-4 transition-all ${
                request.status === 'pending' 
                  ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{request.fullName}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">ID:</span> {request.maskedNationalId || '******'}
                    </div>
                    <div>
                      <span className="text-gray-500">County:</span> {request.county}
                    </div>
                    <div>
                      <span className="text-gray-500">Constituency:</span> {request.constituency}
                    </div>
                    <div>
                      <span className="text-gray-500">Ward:</span> {request.ward}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <span>Submitted: {formatDate(request.createdAt)}</span>
                    {request.walletAddress && (
                      <span className="ml-3">
                        Wallet: {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                      </span>
                    )}
                    {request.rejectionReason && (
                      <span className="ml-3 text-red-600">
                        Reason: {request.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Pending Requests */}
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* View Photos Button */}
                <div className="flex gap-2">
                  {request.idPhotoUrl && (
                    <a
                      href={request.idPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                    >
                      View ID
                    </a>
                  )}
                  {request.selfieUrl && (
                    <a
                      href={request.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                    >
                      View Selfie
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Registration</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject the registration for <strong>{selectedRequest?.fullName}</strong>?
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterRegistrationRequests;