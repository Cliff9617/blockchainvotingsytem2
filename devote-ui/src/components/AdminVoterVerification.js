import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ethers } from 'ethers';
import config from '../config';

const AdminVoterVerification = () => {
  const [pendingVoters, setPendingVoters] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'verified' | 'review' | 'rejected'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch registration requests from Firestore
  const fetchPendingVoters = async () => {
    try {
      setLoading(true);
      const votersRef = collection(db, 'voterRegistrationRequests');
      const querySnapshot = await getDocs(votersRef);
      
      const voters = [];
      querySnapshot.forEach((doc) => {
        voters.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by creation date descending
      voters.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setPendingVoters(voters);
    } catch (error) {
      console.error('Error fetching pending voters:', error);
      showNotification('Error fetching pending voters', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVoters();
  }, []);

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Approve voter
  // ============================================================================
  // FIX: Blockchain-first voter approval
  // ============================================================================
  // ROOT CAUSE: The previous implementation marked the voter as "approved" in
  // Firestore (voters collection + voterRegistrationRequests) BEFORE calling the
  // blockchain. If the blockchain transaction failed, the error was swallowed and
  // the voter remained "approved" in Firestore but was NOT registered on-chain.
  // This caused registeredVoters(wallet) to return false even though the UI showed
  // the voter as approved.
  //
  // FIX: The blockchain is now the source of truth. We:
  //   1. Call contract.registerVoter(wallet, county, constituency, ward) FIRST
  //   2. Wait for the transaction to be mined and confirmed
  //   3. Verify registeredVoters(wallet) === true on-chain
  //   4. ONLY THEN do we write "approved" to Firestore (metadata only)
  //
  // If the blockchain transaction fails, we do NOT mark the voter as approved.
  // ============================================================================
  const approveVoter = async (voter) => {
    const voterId = voter.id;
    setActionLoading(prev => ({ ...prev, [voterId]: true }));

    console.log('[AdminVoterVerification] APPROVING REQUEST DATA:', voter);
    console.log('[AdminVoterVerification] PIN VALUE:', voter.pin);

    try {
      // Check for required fields
      if (!voter.walletAddress) {
        throw new Error("Missing wallet address");
      }

      const pinValue = voter.pin || voter.votingPin || voter.voterPin || '';
      if (!pinValue) {
        alert("Cannot approve voter because PIN is missing. Ask voter to register again.");
        setActionLoading(prev => ({ ...prev, [voterId]: false }));
        return;
      }

      // Normalize the voter's wallet address
      const normalizedAddress = ethers.getAddress(String(voter.walletAddress).trim());
      console.log('[AdminVoterVerification] Normalized address:', normalizedAddress);

      // STEP 1: Register voter on the BLOCKCHAIN FIRST (source of truth)
      // The blockchain is the source of truth for voter registration.
      // Firestore is metadata storage only.
      if (!window.ethereum || !config.contractAddress) {
        throw new Error(
          "Cannot approve voter: blockchain wallet or contract not configured. " +
          "Connect MetaMask and ensure the contract address is set."
        );
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new ethers.Contract(config.contractAddress, config.contractABI, signer);

      // DIAGNOSTIC LOGGING
      console.log('[AdminVoterVerification] ===== BLOCKCHAIN REGISTRATION (SOURCE OF TRUTH) =====');
      console.log('[AdminVoterVerification] Connected wallet:', signerAddress);
      console.log('[AdminVoterVerification] Contract address:', config.contractAddress);
      console.log('[AdminVoterVerification] Voter to register:', normalizedAddress);
      console.log('[AdminVoterVerification] County:', voter.county || '');
      console.log('[AdminVoterVerification] Constituency:', voter.constituency || '');
      console.log('[AdminVoterVerification] Ward:', voter.ward || '');

      // Check if voter is already registered on-chain (idempotent)
      const isAlreadyRegistered = await contract.registeredVoters(normalizedAddress);
      console.log('[AdminVoterVerification] Already registered on-chain:', isAlreadyRegistered);

      if (!isAlreadyRegistered) {
        console.log('[AdminVoterVerification] Registering voter on blockchain with ALL 4 params...');
        console.log('[AdminVoterVerification] Params:', normalizedAddress, voter.county || '', voter.constituency || '', voter.ward || '');

        // Call contract.registerVoter(address, county, constituency, ward)
        const tx = await contract.registerVoter(
          normalizedAddress,
          voter.county || '',
          voter.constituency || '',
          voter.ward || ''
        );
        console.log('[AdminVoterVerification] Transaction sent, hash:', tx.hash);

        // Wait for the transaction to be mined and confirmed
        const receipt = await tx.wait();
        console.log('[AdminVoterVerification] Transaction mined');
        console.log('[AdminVoterVerification] Receipt status:', receipt.status);
        console.log('[AdminVoterVerification] Receipt blockNumber:', receipt.blockNumber);

        if (receipt.status !== 1) {
          throw new Error("Blockchain transaction failed - voter was not registered on-chain");
        }

        console.log('[AdminVoterVerification] ✅ Voter registered on blockchain successfully:', normalizedAddress);
      } else {
        console.log('[AdminVoterVerification] Voter already registered on-chain, skipping tx:', normalizedAddress);
      }

      // STEP 2: Verify on-chain that registeredVoters(wallet) === true
      const verifyRegistered = await contract.registeredVoters(normalizedAddress);
      console.log('[AdminVoterVerification] ✅ Blockchain verification - registeredVoters():', verifyRegistered);

      if (!verifyRegistered) {
        throw new Error(
          "Blockchain verification failed: registeredVoters(" + normalizedAddress + ") returned false " +
          "after registration. Voter will NOT be marked as approved."
        );
      }

      // STEP 3: ONLY after blockchain success, save metadata to Firestore
      // Firestore is metadata storage only - the blockchain is the source of truth.
      const voterDocId = voter.walletAddress.toLowerCase();
      const voterData = {
        fullName: voter.fullName,
        idNumber: voter.idNumber,
        walletAddress: voter.walletAddress,
        county: voter.county,
        constituency: voter.constituency,
        ward: voter.ward,
        pin: pinValue,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        sourceRequestId: voterId,
        blockchainRegistered: true,
        createdAt: voter.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[AdminVoterVerification] Blockchain success - now saving metadata to Firestore:', voterDocId);
      console.log('[AdminVoterVerification] Voter data:', voterData);

      try {
        await setDoc(doc(db, 'voters', voterDocId), voterData, { merge: true });
        console.log('VOTER COPY SUCCESS:', voterDocId);
      } catch (votersError) {
        console.error('[AdminVoterVerification] Failed to copy voter to voters collection (non-fatal - blockchain is source of truth):', votersError);
        // Don't fail - the voter IS registered on-chain, Firestore is just metadata
      }

      // Update voterRegistrationRequests status to approved
      const voterRef = doc(db, 'voterRegistrationRequests', voterId);
      await updateDoc(voterRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        blockchainRegistered: true,
        updatedAt: new Date().toISOString()
      });

      console.log('[AdminVoterVerification] Registration request updated to approved:', voterId);

      showNotification('Voter approved and registered on blockchain successfully!', 'success');
      fetchPendingVoters(); // Refresh the list
    } catch (error) {
      console.error('[AdminVoterVerification] ❌ Error approving voter:', error);
      // Do NOT mark as approved in Firestore if blockchain failed
      const reason = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
      showNotification('Failed to approve voter (blockchain registration failed): ' + reason, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [voterId]: false }));
    }
  };

  // Reject voter
  const rejectVoter = async (voter) => {
    const voterId = voter.id;
    setActionLoading(prev => ({ ...prev, [voterId]: true }));

    try {
      // Update Firestore status to rejected
      const voterRef = doc(db, 'voterRegistrationRequests', voterId);
      await updateDoc(voterRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: voter.rejectionReason || 'Admin rejection'
      });

      showNotification('Voter rejected successfully!', 'success');
      fetchPendingVoters(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting voter:', error);
      showNotification('Error rejecting voter: ' + error.message, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [voterId]: false }));
    }
  };

  // Open modal for image preview
  const openImageModal = (voter, imageType) => {
    const imageData = imageType === 'id' ? voter.idPhotoBase64 : voter.selfieBase64;
    const imageLabel = imageType === 'id' ? 'ID Photo' : 'Selfie';
    setSelectedVoter({ 
      image: imageData, 
      label: imageLabel, 
      name: voter.fullName 
    });
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedVoter(null);
  };

  // Format date - safely handle Firestore timestamps
  const formatDate = (dateData) => {
    if (!dateData) return 'Unknown date';
    
    let dateObj;
    // Check if it's a Firestore Timestamp with toDate() method
    if (dateData && typeof dateData.toDate === 'function') {
      dateObj = dateData.toDate();
    } else if (dateData instanceof Date) {
      dateObj = dateData;
    } else {
      // Try to parse as string or number
      dateObj = new Date(dateData);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Unknown date';
    }
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Voter Verification Requests
        </h2>
        <button
          onClick={fetchPendingVoters}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh List
        </button>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`mb-4 p-4 rounded ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Tabs / Filter Controls */}
      <div className="flex border-b border-gray-200 mb-6 space-x-2">
        <button
          onClick={() => setSelectedTab('all')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'all'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Requests ({pendingVoters.length})
        </button>
        <button
          onClick={() => setSelectedTab('verified')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'verified'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Smile ID Verified ({pendingVoters.filter(v => v.smileStatus === 'smile_verified' || v.status === 'approved').length})
        </button>
        <button
          onClick={() => setSelectedTab('review')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'review'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review ({pendingVoters.filter(v => v.smileStatus === 'pending_review' || (v.status === 'pending' && !v.smileStatus)).length})
        </button>
        <button
          onClick={() => setSelectedTab('rejected')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'rejected'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rejected ({pendingVoters.filter(v => v.status === 'rejected' || v.smileStatus === 'smile_rejected').length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading pending voters...</p>
        </div>
      ) : pendingVoters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No pending voter verification requests.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voter Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Smile ID KYC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingVoters.filter(voter => {
                if (selectedTab === 'verified') {
                  return voter.smileStatus === 'smile_verified' || voter.status === 'approved';
                }
                if (selectedTab === 'review') {
                  return voter.smileStatus === 'pending_review' || (voter.status === 'pending' && !voter.smileStatus);
                }
                if (selectedTab === 'rejected') {
                  return voter.status === 'rejected' || voter.smileStatus === 'smile_rejected';
                }
                return true;
              }).map((voter) => (
                <tr key={voter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{voter.fullName}</div>
                    <div className="text-sm text-gray-500">
                      Registered: {formatDate(voter.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{voter.idNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {truncateAddress(voter.walletAddress)}
                    </div>
                    {voter.walletAddress && (
                      <a
                        href={`https://sepolia.etherscan.io/address/${voter.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View on Etherscan
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {voter.smileStatus === 'smile_verified' || voter.status === 'approved' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>
                        Verified (Auto)
                      </span>
                    ) : voter.smileStatus === 'smile_rejected' || voter.status === 'rejected' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        <span className="w-1.5 h-1.5 mr-1.5 bg-red-500 rounded-full"></span>
                        Failed / Mismatch
                      </span>
                    ) : voter.smileStatus === 'pending_review' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <span className="w-1.5 h-1.5 mr-1.5 bg-yellow-500 rounded-full"></span>
                        Pending Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Standard
                      </span>
                    )}
                    {voter.smileJobId && (
                      <div className="text-[10px] text-gray-400 font-mono mt-1">
                        Job: {voter.smileJobId.substring(0, 12)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{voter.county}</div>
                    <div className="text-sm text-gray-500">
                      {voter.constituency}, {voter.ward}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-3">
                      {/* National ID Photo */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 mb-1">National ID Photo</span>
                        {voter.idPhotoBase64 ? (
                          <div className="relative">
                            <img
                              src={voter.idPhotoBase64}
                              alt="National ID Photo"
                              className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => openImageModal(voter, 'id')}
                              title="Click to enlarge"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
                            <span className="text-xs text-gray-400 text-center px-1">Image not available</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Live Selfie */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 mb-1">Live Selfie</span>
                        {voter.selfieBase64 ? (
                          <div className="relative">
                            <img
                              src={voter.selfieBase64}
                              alt="Live Selfie"
                              className="w-24 h-24 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => openImageModal(voter, 'selfie')}
                              title="Click to enlarge"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
                            <span className="text-xs text-gray-400 text-center px-1">Image not available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveVoter(voter)}
                        disabled={actionLoading[voter.id]}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading[voter.id] ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => rejectVoter(voter)}
                        disabled={actionLoading[voter.id]}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading[voter.id] ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {modalOpen && selectedVoter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedVoter.label} - {selectedVoter.name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              <div className="text-center">
                <img
                  src={selectedVoter.image}
                  alt={selectedVoter.label}
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVoterVerification;