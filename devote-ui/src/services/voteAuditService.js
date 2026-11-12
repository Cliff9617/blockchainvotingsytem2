/**
 * Vote Audit Service - Records vote audit logs to Firestore
 * 
 * Whenever a vote is successfully submitted, this service records:
 * - Position voted for
 * - County, Constituency, Ward of the voter
 * - Candidate voted for
 * - Voter wallet address
 * - Timestamp
 * - Blockchain transaction hash
 */
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const VOTE_AUDIT_COLLECTION = 'voteAuditLogs';

/**
 * Record a vote audit entry after successful blockchain submission
 * @param {Object} params
 * @param {string} params.position - The position voted for
 * @param {string} params.county - Voter's registered county
 * @param {string} params.constituency - Voter's registered constituency
 * @param {string} params.ward - Voter's registered ward
 * @param {string} params.candidateName - Name of candidate voted for
 * @param {string} params.candidateId - ID of candidate voted for
 * @param {string} params.walletAddress - Voter's wallet address
 * @param {string} params.transactionHash - Blockchain transaction hash
 * @param {string} params.network - Blockchain network name
 * @returns {Promise<string>} - Audit document ID
 */
export const recordVoteAudit = async ({
  position,
  county = '',
  constituency = '',
  ward = '',
  candidateName = '',
  candidateId = '',
  walletAddress = '',
  transactionHash = '',
  network = 'Sepolia',
}) => {
  try {
    const auditEntry = {
      position: position || '',
      county: county || '',
      constituency: constituency || '',
      ward: ward || '',
      candidateName: candidateName || '',
      candidateId: candidateId || '',
      walletAddress: walletAddress?.toLowerCase() || '',
      transactionHash: transactionHash || '',
      network: network || 'Sepolia',
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, VOTE_AUDIT_COLLECTION), auditEntry);
    console.log('[VoteAuditService] Vote audit recorded:', docRef.id, {
      position,
      county,
      constituency,
      ward,
      candidateName,
    });
    return docRef.id;
  } catch (error) {
    // Audit logging should never throw - it's non-critical
    console.error('[VoteAuditService] Failed to record vote audit:', error);
    return null;
  }
};

export default {
  recordVoteAudit,
};