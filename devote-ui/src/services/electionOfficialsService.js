/**
 * electionOfficialsService.js - Enterprise Election Officials Firestore Service
 * 
 * Provides CRUD operations for election officials in Firestore.
 * Integrates with existing RBAC architecture without modifying existing
 * election, voter, candidate, AI, or blockchain functionality.
 * 
 * Enhanced with:
 * - Named role constants (no numeric mappings exposed)
 * - Comprehensive validation (wallet format, email, phone, duplicates)
 * - Blockchain role verification (checks if wallet already has a role)
 * - Transaction hash tracking
 */

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { ethers } from "ethers";
import { db } from "../firebase";
import { getContractRole, APP_ROLE_TO_CONTRACT_ROLE } from "../config/roleConstants";

// Collection name for election officials
const OFFICIALS_COLLECTION = "electionOfficials";

/**
 * Official roles supported by the system.
 * The list is easily extendable by adding new entries.
 */
export const OFFICIAL_ROLES = [
  { value: "super_admin", label: "Super Admin", description: "Full system control — assign all roles, manage blockchain, configure elections" },
  { value: "iebc_commissioner", label: "IEBC Commissioner", description: "Independent Electoral and Boundaries Commission member" },
  { value: "national_returning_officer", label: "National Returning Officer", description: "Oversees national-level election operations" },
  { value: "county_returning_officer", label: "County Returning Officer", description: "Manages election operations at the county level" },
  { value: "constituency_returning_officer", label: "Constituency Returning Officer", description: "Manages election operations at the constituency level" },
  { value: "presiding_officer", label: "Polling Station Presiding Officer", description: "Presides over a specific polling station" },
  { value: "deputy_presiding_officer", label: "Deputy Presiding Officer", description: "Assists the presiding officer at a polling station" },
  { value: "poll_clerk", label: "Poll Clerk", description: "Assists with voter check-in and ballot issuance" },
  { value: "voter_registration_officer", label: "Voter Registration Officer", description: "Handles voter registration operations" },
  { value: "results_verification_officer", label: "Results Verification Officer", description: "Verifies and validates election results" },
  { value: "election_auditor", label: "Election Auditor", description: "Audits election processes and records" },
  { value: "read_only_observer", label: "Read-Only Observer", description: "View-only access to monitor election activities" },
];

export const OFFICIAL_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "suspended", label: "Suspended", color: "yellow" },
  { value: "disabled", label: "Disabled", color: "red" },
];

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate wallet address format
 */
export const isValidWallet = (address) => {
  if (!address) return false;
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate phone number format (international or Kenyan)
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // optional field
  return /^(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,6}$/.test(phone);
};

/**
 * Check if a wallet address is already assigned to another official
 */
export const isWalletAssigned = async (walletAddress, excludeId = null) => {
  if (!walletAddress) return false;
  const normalizedWallet = walletAddress.toLowerCase();
  
  try {
    const q = query(
      collection(db, OFFICIALS_COLLECTION),
      where("walletAddress", "==", normalizedWallet)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    // If we have an excludeId, check if the only match is the current document
    if (excludeId) {
      let otherMatch = false;
      snapshot.forEach((doc) => {
        if (doc.id !== excludeId) otherMatch = true;
      });
      return otherMatch;
    }
    
    return true;
  } catch (err) {
    console.error("[ElectionOfficialsService] Wallet check error:", err);
    return false; // On error, allow (fail open for availability)
  }
};

/**
 * Check if a wallet already has a blockchain role via the contract
 * @param {Object} contract - Ethers contract instance
 * @param {string} walletAddress 
 * @returns {Promise<{hasRole: boolean, role: number|null, roleName: string|null}>}
 */
export const checkBlockchainRole = async (contract, walletAddress) => {
  if (!contract || !walletAddress) {
    return { hasRole: false, role: null, roleName: null };
  }

  try {
    // Check if getUserRole function exists on the contract
    if (typeof contract.getUserRole === "function") {
      const result = await contract.getUserRole(walletAddress);
      const roleValue = Number(result.role);
      const isActive = result.active;

      // Role 0 = None, so any role > 0 means assigned
      return {
        hasRole: roleValue > 0 && isActive,
        role: roleValue,
        roleName: result.role !== undefined ? `Role #${roleValue}` : null,
        county: result.county || "",
        constituency: result.constituency || "",
        ward: result.ward || "",
      };
    }

    return { hasRole: false, role: null, roleName: null };
  } catch (err) {
    console.warn("[ElectionOfficialsService] Blockchain role check unavailable:", err.message);
    return { hasRole: false, role: null, roleName: null, error: err.message };
  }
};

/**
 * Comprehensive validation for official data
 * Returns { valid: boolean, errors: Object }
 */
export const validateOfficialData = async (data, existingOfficials = [], excludeId = null) => {
  const errors = {};

  // Required fields
  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = "Full name is required";
  }

  if (!data.role) {
    errors.role = "Role is required";
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.email = "Invalid email format";
  }

  // Phone validation
  if (data.phoneNumber && !isValidPhone(data.phoneNumber)) {
    errors.phoneNumber = "Invalid phone number format";
  }

  // Wallet validation
  if (data.walletAddress) {
    if (!isValidWallet(data.walletAddress)) {
      errors.walletAddress = "Invalid Ethereum address format";
    } else {
      // Check if wallet is already assigned (duplicate check)
      const assigned = await isWalletAssigned(data.walletAddress, excludeId);
      if (assigned) {
        errors.walletAddress = "This wallet is already assigned to another official";
      }
    }
  }

  // National ID duplicate check
  if (data.nationalId && data.nationalId.trim()) {
    const duplicateId = existingOfficials.find(
      (o) =>
        o.nationalId?.toLowerCase() === data.nationalId.trim().toLowerCase() &&
        o.id !== excludeId
    );
    if (duplicateId) {
      errors.nationalId = "This National ID is already assigned to another official";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Get all election officials from Firestore with optional filters.
 * Supports real-time updates via onSnapshot callback.
 */
export const getOfficials = (filters = {}, onUpdate = null) => {
  const officialsRef = collection(db, OFFICIALS_COLLECTION);
  
  try {
    let q = query(officialsRef, orderBy("createdAt", "desc"));

    if (filters.role) {
      q = query(q, where("role", "==", filters.role));
    }
    if (filters.county) {
      q = query(q, where("county", "==", filters.county));
    }
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (onUpdate) {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const officials = [];
        snapshot.forEach((doc) => {
          officials.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(officials);
      }, (err) => {
        console.error("[ElectionOfficialsService] Error in real-time listener:", err);
        if (filters.role || filters.county || filters.status) {
          console.warn("[ElectionOfficialsService] Filtered query failed, falling back to unfiltered");
          return getOfficials({}, onUpdate);
        }
        onUpdate([]);
      });
      return unsubscribe;
    }

    return getDocs(q).then((snapshot) => {
      const officials = [];
      snapshot.forEach((doc) => {
        officials.push({ id: doc.id, ...doc.data() });
      });
      
      let filtered = officials;
      if (filters.role) {
        filtered = filtered.filter(o => o.role === filters.role);
      }
      if (filters.county) {
        filtered = filtered.filter(o => o.county === filters.county);
      }
      if (filters.status) {
        filtered = filtered.filter(o => o.status === filters.status);
      }
      
      return filtered;
    });
  } catch (err) {
    console.error("[ElectionOfficialsService] Query error:", err);
    if (onUpdate) {
      onUpdate([]);
      return () => {};
    }
    return Promise.resolve([]);
  }
};

/**
 * Check if the deployed contract supports blockchain role assignment.
 * This function inspects the contract ABI for assignRole() existence.
 * @param {Object} contract - Ethers contract instance
 * @returns {boolean}
 */
export const supportsBlockchainRoleAssignment = (contract) => {
  if (!contract) return false;
  try {
    return typeof contract.assignRole === "function";
  } catch {
    return false;
  }
};

/**
 * Create a new election official in Firestore with blockchain role assignment.
 * 
 * BLOCKCHAIN ROLE ASSIGNMENT:
 * - Inspects contract for assignRole() function
 * - If available: uses blockchain, waits for confirmation, saves tx hash
 * - If NOT available: saves to Firestore only with clear message
 */
export const createOfficial = async (officialData, contract = null, adminAccount = null) => {
  const now = Timestamp.now();
  
  // Find the role label
  const roleEntry = OFFICIAL_ROLES.find(r => r.value === officialData.role);
  
  const docData = {
    fullName: officialData.fullName.trim(),
    nationalId: officialData.nationalId.trim(),
    email: officialData.email.trim().toLowerCase(),
    phoneNumber: officialData.phoneNumber.trim(),
    walletAddress: officialData.walletAddress?.trim().toLowerCase() || "",
    role: officialData.role,
    roleLabel: roleEntry ? roleEntry.label : officialData.role,
    county: officialData.county || "",
    constituency: officialData.constituency || "",
    ward: officialData.ward || "",
    pollingStation: officialData.pollingStation || "",
    status: officialData.status || "active",
    blockchainAssigned: false,
    blockchainTxHash: "",
    blockchainError: "",
    createdBy: adminAccount || "",
    createdAt: now,
    updatedAt: now,
    updatedBy: adminAccount || "",
  };

  // ==========================================
  // BLOCKCHAIN ROLE ASSIGNMENT
  // ==========================================
  // First check if blockchain role assignment is supported
  const blockchainSupported = supportsBlockchainRoleAssignment(contract);

  if (blockchainSupported && docData.walletAddress && adminAccount) {
    try {
      // Map our official role to the smart contract role using NAMED CONSTANTS
      const contractRole = getContractRole(docData.role);
      
      if (contractRole !== null && contractRole !== undefined) {
        console.log(
          `[ElectionOfficialsService] Attempting blockchain role assignment for ${docData.walletAddress}: role=${contractRole}`
        );
        
        // Use the contract's assignRole function
        // assignRole(address, role, county, constituency, ward)
        const tx = await contract.assignRole(
          docData.walletAddress,
          contractRole,
          docData.county || "",
          docData.constituency || "",
          docData.ward || ""
        );
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        docData.blockchainAssigned = true;
        docData.blockchainTxHash = tx.hash || receipt.transactionHash;
        docData.blockchainError = "";
        
        console.log(`[ElectionOfficialsService] ✅ Blockchain role assigned. TX: ${docData.blockchainTxHash}`);
      }
    } catch (blockchainErr) {
      // Blockchain assignment failed - save to Firestore only
      console.warn(
        "[ElectionOfficialsService] Blockchain assignment unavailable, saving to Firestore only:",
        blockchainErr.message
      );
      docData.blockchainAssigned = false;
      docData.blockchainTxHash = "";
      docData.blockchainError = blockchainErr.message;
    }
  } else if (docData.walletAddress && !blockchainSupported) {
    // Blockchain is NOT supported - clear message stored
    docData.blockchainError = "Blockchain role assignment is not supported by the current deployed contract.";
    console.log("[ElectionOfficialsService]", docData.blockchainError);
  }

  // Save to Firestore
  try {
    const docRef = await addDoc(collection(db, OFFICIALS_COLLECTION), docData);
    console.log(`[ElectionOfficialsService] Official created with ID: ${docRef.id}`);
    return { id: docRef.id, ...docData };
  } catch (firestoreErr) {
    console.error("[ElectionOfficialsService] Firestore save failed:", firestoreErr);
    throw new Error("Failed to save election official: " + firestoreErr.message);
  }
};

/**
 * Update an existing election official.
 */
export const updateOfficial = async (officialId, updateData, adminAccount = null) => {
  const officialRef = doc(db, OFFICIALS_COLLECTION, officialId);
  
  const updatedFields = {
    ...updateData,
    updatedAt: Timestamp.now(),
    updatedBy: adminAccount || "",
  };

  // Update role label if role changed
  if (updateData.role) {
    const roleEntry = OFFICIAL_ROLES.find(r => r.value === updateData.role);
    if (roleEntry) {
      updatedFields.roleLabel = roleEntry.label;
    }
  }

  await updateDoc(officialRef, updatedFields);
  return { id: officialId, ...updatedFields };
};

/**
 * Change official status (activate, suspend, disable).
 */
export const updateOfficialStatus = async (officialId, newStatus, adminAccount = null) => {
  const officialRef = doc(db, OFFICIALS_COLLECTION, officialId);
  await updateDoc(officialRef, {
    status: newStatus,
    updatedAt: Timestamp.now(),
    updatedBy: adminAccount || "",
  });
  return { id: officialId, status: newStatus };
};

/**
 * Delete an election official from Firestore.
 */
export const deleteOfficial = async (officialId) => {
  await deleteDoc(doc(db, OFFICIALS_COLLECTION, officialId));
  return { id: officialId, deleted: true };
};

/**
 * Search officials by name, wallet, role, county, constituency, polling station,
 * national ID, or email. Uses client-side filtering for flexibility.
 */
export const searchOfficials = async (searchTerm, officials) => {
  if (!searchTerm || !searchTerm.trim()) return officials;
  
  const term = searchTerm.trim().toLowerCase();
  
  return officials.filter((official) => {
    return (
      (official.fullName && official.fullName.toLowerCase().includes(term)) ||
      (official.walletAddress && official.walletAddress.toLowerCase().includes(term)) ||
      (official.roleLabel && official.roleLabel.toLowerCase().includes(term)) ||
      (official.role && official.role.toLowerCase().includes(term)) ||
      (official.county && official.county.toLowerCase().includes(term)) ||
      (official.constituency && official.constituency.toLowerCase().includes(term)) ||
      (official.pollingStation && official.pollingStation.toLowerCase().includes(term)) ||
      (official.nationalId && official.nationalId.toLowerCase().includes(term)) ||
      (official.email && official.email.toLowerCase().includes(term))
    );
  });
};

/**
 * Map application official role to smart contract ROLES constant.
 * Uses named constants from roleConstants.js
 * Returns null if no mapping exists (Firestore-only fallback).
 */
export const mapRoleToContractRole = (officialRole) => {
  return getContractRole(officialRole);
};

export default {
  OFFICIAL_ROLES,
  OFFICIAL_STATUSES,
  getOfficials,
  createOfficial,
  updateOfficial,
  updateOfficialStatus,
  deleteOfficial,
  searchOfficials,
  mapRoleToContractRole,
  validateOfficialData,
  isValidWallet,
  isValidEmail,
  isValidPhone,
  isWalletAssigned,
  checkBlockchainRole,
  supportsBlockchainRoleAssignment,
};