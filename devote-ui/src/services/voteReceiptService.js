/**
 * Vote Receipt Service
 * 
 * Generates and stores vote receipts in Firestore after a successful vote.
 * Receipts contain verification data but NEVER reveal candidate selection.
 */
import { collection, addDoc, getDoc, getDocs, doc, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ethers } from 'ethers';

const RECEIPTS_COLLECTION = 'votes_receipts';

/**
 * Generate a cryptographic Vote Verification ID from transaction data
 * This is a hash that uniquely identifies the vote without revealing the candidate
 * @param {Object} params
 * @returns {string} - Verification ID hash
 */
const generateVerificationId = ({ transactionHash, walletAddress, electionId, timestamp }) => {
  const data = `${transactionHash}-${walletAddress.toLowerCase()}-${electionId}-${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Mask a wallet address for display (e.g. 0x1234...ABCD)
 * @param {string} address - Full wallet address
 * @returns {string} - Masked address
 */
const maskWalletAddress = (address) => {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Create and store a vote receipt in Firestore
 * @param {Object} params
 * @param {string} params.transactionHash - Blockchain transaction hash
 * @param {number} params.blockNumber - Block number
 * @param {string} params.timestamp - ISO timestamp
 * @param {string} params.electionId - Election ID
 * @param {string} params.constituency - Voter's constituency
 * @param {string} params.pollingStation - Polling station name
 * @param {string} params.walletAddress - Voter's wallet address
 * @param {string} params.electionName - Name of the election
 * @returns {Promise<Object>} - The receipt object with ID
 */
export const createVoteReceipt = async ({
  transactionHash,
  blockNumber,
  timestamp,
  electionId = '1',
  constituency = '',
  pollingStation = '',
  walletAddress = '',
  electionName = 'General Election',
}) => {
  try {
    const receiptTimestamp = timestamp || new Date().toISOString();
    
    // Generate verification ID (cryptographic hash)
    const verificationId = generateVerificationId({
      transactionHash,
      walletAddress,
      electionId,
      timestamp: receiptTimestamp,
    });

    const receipt = {
      verificationId,
      transactionHash,
      blockNumber: Number(blockNumber),
      timestamp: receiptTimestamp,
      electionId: String(electionId),
      electionName,
      constituency: constituency || '',
      pollingStation: pollingStation || '',
      walletAddress: walletAddress?.toLowerCase() || '',
      walletAddressMasked: maskWalletAddress(walletAddress),
      // NEVER include candidate information
      createdAt: Timestamp.now(),
      verified: false,
      verificationCount: 0,
    };

    // Store in Firestore
    const docRef = await addDoc(collection(db, RECEIPTS_COLLECTION), receipt);
    console.log('[VoteReceiptService] Receipt created:', docRef.id, {
      verificationId: verificationId.substring(0, 10) + '...',
      transactionHash: transactionHash?.substring(0, 10) + '...',
    });

    return {
      id: docRef.id,
      ...receipt,
    };
  } catch (error) {
    console.error('[VoteReceiptService] Failed to create receipt:', error);
    // Non-critical - don't throw, return minimal receipt
    return {
      verificationId: generateVerificationId({
        transactionHash,
        walletAddress,
        electionId,
        timestamp: new Date().toISOString(),
      }),
      transactionHash,
      blockNumber: Number(blockNumber),
      timestamp: new Date().toISOString(),
      electionId: String(electionId),
      electionName,
      constituency: constituency || '',
      pollingStation: pollingStation || '',
      walletAddress: walletAddress?.toLowerCase() || '',
      walletAddressMasked: maskWalletAddress(walletAddress),
      error: 'Failed to store in database',
    };
  }
};

/**
 * Find a receipt by verification ID
 * @param {string} verificationId - The verification ID hash
 * @returns {Promise<Object|null>} - The receipt or null
 */
export const findReceiptByVerificationId = async (verificationId) => {
  try {
    const q = query(
      collection(db, RECEIPTS_COLLECTION),
      where('verificationId', '==', verificationId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error('[VoteReceiptService] Error finding receipt by verification ID:', error);
    return null;
  }
};

/**
 * Find a receipt by transaction hash
 * @param {string} transactionHash - The blockchain transaction hash
 * @returns {Promise<Object|null>} - The receipt or null
 */
export const findReceiptByTransactionHash = async (transactionHash) => {
  try {
    const normalizedHash = transactionHash.toLowerCase();
    const q = query(
      collection(db, RECEIPTS_COLLECTION),
      where('transactionHash', '==', normalizedHash),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error('[VoteReceiptService] Error finding receipt by transaction hash:', error);
    return null;
  }
};

/**
 * Find receipts by wallet address
 * @param {string} walletAddress - The voter's wallet address
 * @returns {Promise<Array>} - Array of receipts
 */
export const findReceiptsByWallet = async (walletAddress) => {
  try {
    const normalized = walletAddress.toLowerCase();
    const q = query(
      collection(db, RECEIPTS_COLLECTION),
      where('walletAddress', '==', normalized),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error('[VoteReceiptService] Error finding receipts by wallet:', error);
    return [];
  }
};

/**
 * Update verification count for a receipt
 * @param {string} receiptId - Firestore document ID
 */
export const incrementVerificationCount = async (receiptId) => {
  try {
    const receiptRef = doc(db, RECEIPTS_COLLECTION, receiptId);
    const receiptSnap = await getDoc(receiptRef);
    
    if (receiptSnap.exists()) {
      const data = receiptSnap.data();
      const currentCount = data.verificationCount || 0;
      // We use update with merge to avoid conflicts
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(receiptRef, {
        verified: true,
        verificationCount: currentCount + 1,
        lastVerifiedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('[VoteReceiptService] Error incrementing verification count:', error);
  }
};

/**
 * Get verification statistics for admin dashboard
 * @returns {Promise<Object>} - Verification stats
 */
export const getVerificationStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, RECEIPTS_COLLECTION));
    const receipts = snapshot.docs.map(docSnap => docSnap.data());
    
    const totalVotes = receipts.length;
    const verifiedVotes = receipts.filter(r => r.verified === true).length;
    const pendingConfirmations = receipts.filter(r => !r.verified).length;
    
    return {
      totalVotes,
      verifiedVotes,
      pendingConfirmations,
      failedTransactions: 0, // Would need separate tracking
      verificationRequests: receipts.reduce((sum, r) => sum + (r.verificationCount || 0), 0),
    };
  } catch (error) {
    console.error('[VoteReceiptService] Error getting verification stats:', error);
    return {
      totalVotes: 0,
      verifiedVotes: 0,
      pendingConfirmations: 0,
      failedTransactions: 0,
      verificationRequests: 0,
    };
  }
};

export default {
  createVoteReceipt,
  findReceiptByVerificationId,
  findReceiptByTransactionHash,
  findReceiptsByWallet,
  incrementVerificationCount,
  getVerificationStats,
};