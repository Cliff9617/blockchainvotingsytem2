/**
 * Registration Service
 * Handles voter registration requests with Firebase Firestore and localStorage fallback
 */

import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import {
  verifyPin,
  verifyNationalId,
  normalizeFullName,
} from '../utils/security';
import { safeStringify } from '../utils/serializeBigInt';

const REGISTRATION_COLLECTION = 'voterRegistrationRequests';
const LOCAL_STORAGE_KEY = 'voterRegistrationRequests';

/**
 * Submit a new registration request
 * @param {Object} registrationData - The registration data
 * @returns {Promise<Object>} - The created registration request
 */
export const submitRegistration = async (registrationData) => {
  const request = {
    ...registrationData,
    createdAt: serverTimestamp(),
    status: 'pending',
  };

  try {
    // Try Firebase first
    const docRef = await addDoc(collection(db, REGISTRATION_COLLECTION), request);
    console.log('[RegistrationService] Registration saved to Firebase with ID:', docRef.id);
    return { ...request, id: docRef.id };
  } catch (firebaseError) {
    console.warn('[RegistrationService] Firebase save failed, using localStorage:', firebaseError);
    
    // Fallback to localStorage
    const storedRequests = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const newRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    storedRequests.push(newRequest);
    localStorage.setItem(LOCAL_STORAGE_KEY, safeStringify(storedRequests));
    console.log('[RegistrationService] Registration saved to localStorage');
    return newRequest;
  }
};

/**
 * Get all registration requests (for admin)
 * @returns {Promise<Array>} - Array of registration requests
 */
export const getAllRegistrationRequests = async () => {
  try {
    // Try Firebase first
    const querySnapshot = await getDocs(collection(db, REGISTRATION_COLLECTION));
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    console.log('[RegistrationService] Loaded', requests.length, 'requests from Firebase');
    return requests;
  } catch (firebaseError) {
    console.warn('[RegistrationService] Firebase load failed, using localStorage:', firebaseError);
    
    // Fallback to localStorage
    const storedRequests = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    console.log('[RegistrationService] Loaded', storedRequests.length, 'requests from localStorage');
    return storedRequests;
  }
};

/**
 * Get registration request by wallet address
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<Object|null>} - The registration request or null
 */
export const getRegistrationByWallet = async (walletAddress) => {
  try {
    // Try Firebase first
    const q = query(collection(db, REGISTRATION_COLLECTION), where('walletAddress', '==', walletAddress));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      return requests[0] || null;
    }
    return null;
  } catch (firebaseError) {
    console.warn('[RegistrationService] Firebase query failed, using localStorage:', firebaseError);
    
    // Fallback to localStorage
    const storedRequests = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    return storedRequests.find(req => req.walletAddress === walletAddress) || null;
  }
};

/**
 * Update registration request status
 * @param {string} requestId - The request ID
 * @param {string} status - New status ('approved', 'rejected')
 * @param {string} rejectionReason - Optional rejection reason
 * @returns {Promise<void>}
 */
export const updateRegistrationStatus = async (requestId, status, rejectionReason = '') => {
  const updateData = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  try {
    // Try Firebase first
    const requestRef = doc(db, REGISTRATION_COLLECTION, requestId);
    await updateDoc(requestRef, updateData);
    console.log('[RegistrationService] Registration status updated in Firebase:', status);
  } catch (firebaseError) {
    console.warn('[RegistrationService] Firebase update failed, using localStorage:', firebaseError);
    
    // Fallback to localStorage
    const storedRequests = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const index = storedRequests.findIndex(req => req.id === requestId);
    
    if (index !== -1) {
      storedRequests[index] = {
        ...storedRequests[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, safeStringify(storedRequests));
      console.log('[RegistrationService] Registration status updated in localStorage:', status);
    }
  }
};

/**
 * Get registration statistics
 * @returns {Promise<Object>} - Statistics object
 */
export const getRegistrationStats = async () => {
  const requests = await getAllRegistrationRequests();
  
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };
  
  return stats;
};

/**
 * Check if a voter is approved
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<boolean>} - True if approved
 */
export const isVoterApproved = async (walletAddress) => {
  const registration = await getRegistrationByWallet(walletAddress);
  return registration?.status === 'approved';
};

/**
 * Authenticate a voter by verifying their credentials against the voters collection
 * @param {string} fullName - The voter's full name
 * @param {string} nationalId - The voter's National ID
 * @param {string} pin - The voter's PIN
 * @returns {Promise<Object>} - Authentication result with voter info or error
 */
export const authenticateVoter = async (fullName, nationalId, pin) => {
  // Normalize input values for comparison
  const normalizedFullName = fullName.trim().toLowerCase();
  const normalizedIdNumber = nationalId.trim();
  const normalizedPin = pin.trim();
  
  console.log('[RegistrationService] Login attempt with:', {
    fullName: normalizedFullName,
    idNumber: normalizedIdNumber,
    pinLength: normalizedPin.length
  });
  
  try {
    // Query the voters collection for approved voters
    const votersRef = collection(db, 'voters');
    const q = query(votersRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[RegistrationService] No approved voters found in voters collection');
      return {
        success: false,
        error: 'Registration not found',
        errorCode: 'NOT_FOUND',
      };
    }
    
    const voters = [];
    querySnapshot.forEach((doc) => {
      voters.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[RegistrationService] Found', voters.length, 'approved voters in voters collection');
    
    // Find a matching voter by idNumber and fullName and pin
    const matchingVoter = voters.find(voter => {
      const voterName = (voter.fullName || '').trim().toLowerCase();
      const voterIdNumber = (voter.idNumber || '').trim();
      const voterPin = (voter.pin || '').trim();
      
      return voterName === normalizedFullName && 
             voterIdNumber === normalizedIdNumber && 
             voterPin === normalizedPin;
    });
    
    if (!matchingVoter) {
      console.log('[RegistrationService] No matching voter found. Checked', voters.length, 'voters.');
      return {
        success: false,
        error: 'Invalid login details',
        errorCode: 'INVALID_CREDENTIALS',
      };
    }
    
    console.log('[RegistrationService] Voter authenticated successfully:', matchingVoter.id);
    
    // Authentication successful
    return {
      success: true,
      voter: {
        id: matchingVoter.id,
        fullName: matchingVoter.fullName,
        idNumber: matchingVoter.idNumber,
        county: matchingVoter.county,
        constituency: matchingVoter.constituency,
        ward: matchingVoter.ward,
        walletAddress: matchingVoter.walletAddress,
        status: matchingVoter.status,
      },
    };
    
  } catch (error) {
    console.error('[RegistrationService] Authentication error:', error.message);
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
      errorCode: 'ERROR',
    };
  }
};

export default {
  submitRegistration,
  getAllRegistrationRequests,
  getRegistrationByWallet,
  updateRegistrationStatus,
  getRegistrationStats,
  isVoterApproved,
  authenticateVoter,
};
