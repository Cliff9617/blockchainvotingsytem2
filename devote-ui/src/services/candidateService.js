import { collection, getDocs, addDoc, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import serializeBigInt from '../utils/serializeBigInt';
import { normalizePosition, POSITIONS, resolveVoterCountyName } from '../utils/electionFilters';

const CANDIDATE_PROFILES_COLLECTION = 'candidates';

/**
 * Get all candidate profiles from Firestore
 * @returns {Promise<Array>} Array of candidate profile objects
 */
export const getAllCandidateProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, CANDIDATE_PROFILES_COLLECTION));
    const profiles = [];
    
    querySnapshot.forEach((doc) => {
      profiles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return profiles;
  } catch (error) {
    console.error('Error fetching candidate profiles:', error);
    throw new Error('Failed to fetch candidate profiles');
  }
};

/**
 * Save a candidate profile to Firestore
 * @param {Object} candidateData - Candidate profile data
 * @param {number} candidateData.blockchainId - Blockchain candidate ID
 * @param {string} candidateData.name - Candidate name
 * @param {string} candidateData.party - Candidate party
 * @param {string} candidateData.candidateCode - Candidate code
 * @param {string} candidateData.position - Position (President, Governor, etc.)
 * @param {string} candidateData.county - County
 * @param {string} candidateData.constituency - Constituency
 * @param {string} candidateData.ward - Ward
 * @param {string} candidateData.location - Location level (National, County, Constituency, Ward)
 * @param {string} candidateData.pollingCenterName - Polling center name
 * @param {string} candidateData.pollingStationName - Polling station name
 * @param {string} candidateData.imageUrl - Image URL
 * @param {number} candidateData.voteCount - Vote count (default: 0)
 * @param {boolean} candidateData.isActive - Is candidate active (default: true)
 * @returns {Promise<string>} Document ID of the created profile
 */
export const saveCandidateProfile = async (candidateData) => {
  try {
    console.log('[candidateService] Saving candidate profile:', candidateData);
    
    const profileData = {
      blockchainId: Number(candidateData.blockchainId),
      name: candidateData.name,
      party: candidateData.party || '',
      candidateCode: candidateData.candidateCode || '',
      position: candidateData.position || '',
      county: candidateData.county || '',
      constituency: candidateData.constituency || '',
      ward: candidateData.ward || '',
      location: candidateData.location || '',
      pollingCenterName: candidateData.pollingCenterName || '',
      pollingStationName: candidateData.pollingStationName || '',
      imageUrl: candidateData.imageUrl || '',
      voteCount: candidateData.voteCount ?? 0,
      isActive: candidateData.isActive ?? true,
      createdAt: candidateData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('[candidateService] Profile data to save:', profileData);
    
    const docRef = await addDoc(collection(db, CANDIDATE_PROFILES_COLLECTION), profileData);
    
    console.log('[candidateService] Candidate profile saved with doc ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[candidateService] Error saving candidate profile:', error);
    console.error('[candidateService] Full error:', JSON.stringify(serializeBigInt(error), Object.getOwnPropertyNames(error)));
    throw new Error('Failed to save candidate profile');
  }
};

/**
 * Query candidates by position for a specific jurisdiction
 * Uses Firestore where() clauses for optimized querying - no client-side filtering needed
 * @param {string} position - The position to query
 * @param {Object} voter - Voter location { county, constituency, ward }
 * @returns {Promise<Array>} - Array of candidate objects
 */
export const queryCandidatesByJurisdiction = async (position, voter = null) => {
  try {
    const normalizedPos = normalizePosition(position);
    const constraints = [where('position', '==', normalizedPos)];
    
    // Add jurisdiction filters based on position type
    switch (normalizedPos) {
      case POSITIONS.PRESIDENT:
        // President is national - no location filter needed
        break;
      case POSITIONS.GOVERNOR:
      case POSITIONS.SENATOR:
      case POSITIONS.WOMAN_REPRESENTATIVE:
        if (voter?.county) {
          // Handle county as number (IEBC ID) or string (name) - normalize to string for Firestore query
          const countyValue = typeof voter.county === 'number' 
            ? String(voter.county) 
            : voter.county;
          constraints.push(where('county', '==', countyValue));
        }
        break;
      case POSITIONS.MEMBER_OF_PARLIAMENT:
        if (voter?.constituency) {
          constraints.push(where('constituency', '==', voter.constituency));
        }
        break;
      case POSITIONS.MCA:
        if (voter?.ward) {
          constraints.push(where('ward', '==', voter.ward));
        }
        break;
    }

    const q = query(collection(db, CANDIDATE_PROFILES_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    const profiles = [];
    
    querySnapshot.forEach((doc) => {
      profiles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return profiles;
  } catch (error) {
    console.error(`Error querying candidates for position ${position}:`, error);
    throw new Error('Failed to query candidates');
  }
};

/**
 * Optimized function to get all candidates a voter can vote for
 * Combines President candidates with jurisdiction-specific candidates
 * Uses Firestore queries instead of client-side filtering
 * @param {Object} voter - Voter location { county, constituency, ward }
 * @returns {Promise<Array>} - All candidates visible to the voter
 */
export const getVoterCandidates = async (voter) => {
  try {
    const allCandidates = [];
    
    // Always get President candidates (national)
    const presidentCandidates = await queryCandidatesByJurisdiction(POSITIONS.PRESIDENT, voter);
    allCandidates.push(...presidentCandidates);
    
    if (voter) {
      // Get jurisdiction-specific candidates
      if (voter.county) {
        const governorCandidates = await queryCandidatesByJurisdiction(POSITIONS.GOVERNOR, voter);
        allCandidates.push(...governorCandidates);
        
        const senatorCandidates = await queryCandidatesByJurisdiction(POSITIONS.SENATOR, voter);
        allCandidates.push(...senatorCandidates);
        
        const womanRepCandidates = await queryCandidatesByJurisdiction(POSITIONS.WOMAN_REPRESENTATIVE, voter);
        allCandidates.push(...womanRepCandidates);
      }
      
      if (voter.constituency) {
        const mpCandidates = await queryCandidatesByJurisdiction(POSITIONS.MEMBER_OF_PARLIAMENT, voter);
        allCandidates.push(...mpCandidates);
      }
      
      if (voter.ward) {
        const mcaCandidates = await queryCandidatesByJurisdiction(POSITIONS.MCA, voter);
        allCandidates.push(...mcaCandidates);
      }
    }
    
    return allCandidates;
  } catch (error) {
    console.error('Error getting voter candidates:', error);
    throw new Error('Failed to get voter candidates');
  }
};

/**
 * Validate that a candidate belongs to the voter's jurisdiction
 * @param {Object} candidate - Candidate object
 * @param {Object} voter - Voter location { county, constituency, ward }
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateCandidateJurisdiction = (candidate, voter) => {
  if (!candidate || !voter) {
    return { valid: false, error: 'Missing candidate or voter information' };
  }

  const position = normalizePosition(candidate.position);
  
  // President is national - always valid
  if (position === POSITIONS.PRESIDENT) {
    return { valid: true, error: null };
  }
  
  // Check jurisdiction based on position
  switch (position) {
    case POSITIONS.GOVERNOR:
    case POSITIONS.SENATOR:
    case POSITIONS.WOMAN_REPRESENTATIVE:
      if (!voter.county) {
        return { valid: false, error: 'Voter county not found' };
      }
      // FIX: Use resolveVoterCountyName to handle both numeric county IDs (e.g., 28)
      // and string county names (e.g., "Nakuru"). The candidate.county is a string
      // (e.g., "Nakuru") from the blockchain. Both are normalized to lowercase for comparison.
      const candidateCounty = String(candidate.county || '').toLowerCase().trim();
      const voterCounty = resolveVoterCountyName(voter.county);
      if (candidateCounty !== voterCounty) {
        return { valid: false, error: 'This candidate is outside your registered voting jurisdiction.' };
      }
      return { valid: true, error: null };
      
    case POSITIONS.MEMBER_OF_PARLIAMENT:
      if (!voter.constituency) {
        return { valid: false, error: 'Voter constituency not found' };
      }
      if (normalizePosition(candidate.constituency) !== normalizePosition(voter.constituency)) {
        return { valid: false, error: 'This candidate is outside your registered voting jurisdiction.' };
      }
      return { valid: true, error: null };
      
    case POSITIONS.MCA:
      if (!voter.ward) {
        return { valid: false, error: 'Voter ward not found' };
      }
      if (normalizePosition(candidate.ward) !== normalizePosition(voter.ward)) {
        return { valid: false, error: 'This candidate is outside your registered voting jurisdiction.' };
      }
      return { valid: true, error: null };
      
    default:
      return { valid: false, error: 'Unknown position' };
  }
};

/**
 * Get a candidate profile by blockchain ID
 * @param {string} blockchainId - Blockchain candidate ID
 * @returns {Promise<Object|null>} Candidate profile or null if not found
 */
export const getCandidateProfileByBlockchainId = async (blockchainId) => {
  try {
    const q = query(collection(db, CANDIDATE_PROFILES_COLLECTION), where('blockchainId', '==', blockchainId));
    const querySnapshot = await getDocs(q);
    let profile = null;
    
    querySnapshot.forEach((doc) => {
      if (!profile) {
        profile = {
          id: doc.id,
          ...doc.data()
        };
      }
    });
    
    return profile;
  } catch (error) {
    console.error('Error fetching candidate profile by blockchain ID:', error);
    throw new Error('Failed to fetch candidate profile');
  }
};

/**
 * Update a candidate profile in Firestore
 * @param {string} profileId - Firestore document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateCandidateProfile = async (profileId, updates) => {
  try {
    const profileRef = doc(db, CANDIDATE_PROFILES_COLLECTION, profileId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    throw new Error('Failed to update candidate profile');
  }
};