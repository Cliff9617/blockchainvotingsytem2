import { connectWallet } from './connectWallet';
import serializeBigInt from './serializeBigInt';

/**
 * Admin Actions Utility Functions
 * All functions use ethers.js v6 and the existing connectWallet() function
 * 
 * SECURITY: Uses the DeVoteNational contract's custom RBAC system via getUserRole()
 * instead of OpenZeppelin's hasRole(). The contract uses Role enum values where
 * SuperAdmin = 8, NationalElectionCommissioner = 7, etc.
 */

import { SUPER_ADMIN_ROLE } from '../config/roleConstants';

/**
 * Check if the connected wallet is the Super Admin using the contract's custom RBAC
 * @param {object} contract - The contract instance
 * @param {string} address - The wallet address to check
 * @returns {Promise<boolean>} - True if the wallet holds SuperAdmin role
 */
const isSuperAdminFromContract = async (contract, address) => {
  try {
    // Use getUserRole() which IS in the deployed ABI
    // This returns: (role, county, constituency, ward, active, assignedAt, assignedBy)
    const roleData = await contract.getUserRole(address);
    const roleIndex = Number(roleData.role);
    const isActive = roleData.active === true;
    
    // Check if the user has SuperAdmin role (index 8) AND is active
    return roleIndex === SUPER_ADMIN_ROLE && isActive;
  } catch (err) {
    console.error('[adminActions] Error checking Super Admin role:', err);
    return false;
  }
};

/**
 * Register a single voter (idempotent - safe to call multiple times)
 * @param {string} voterAddress - The wallet address to register
 * @param {string} county - Voter's county (default: '')
 * @param {string} constituency - Voter's constituency (default: '')
 * @param {string} ward - Voter's ward (default: '')
 * @returns {Promise<{success: boolean, alreadyRegistered?: boolean}>} - Success status
 */
export const registerVoter = async (voterAddress, county = '', constituency = '', ward = '') => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      throw new Error("Wallet connection failed");
    }

    const { contract } = wallet;
    
    // Check if the connected wallet is the Super Admin using the contract's custom RBAC
    const hasSuperAdminRole = await isSuperAdminFromContract(contract, wallet.address);
    console.log("[adminActions] Connected wallet:", wallet.address);
    console.log("[adminActions] Is Super Admin (role 8):", hasSuperAdminRole);
    
    if (!hasSuperAdminRole) {
      throw new Error("Only the Super Admin can perform this action.");
    }

    // Normalize address to lowercase
    const normalizedAddress = voterAddress.toLowerCase();
    
    // Check if voter is already registered on-chain first
    console.log(`[adminActions] Checking if voter is already registered: ${normalizedAddress}`);
    try {
      const isRegistered = await contract.registeredVoters(normalizedAddress);
      
      if (isRegistered) {
        console.log(`[adminActions] Voter already registered on-chain, skipping: ${normalizedAddress}`);
        return { success: true, alreadyRegistered: true };
      }
    } catch (checkError) {
      // If check fails, continue with registration attempt
      console.warn(`[adminActions] Could not check registration status, will attempt registration: ${checkError.message}`);
    }

    // Voter not registered, proceed with registration
    // FIX: Pass ALL 4 required parameters to contract.registerVoter()
    // The contract expects: registerVoter(address _voter, string _county, string _constituency, string _ward)
    console.log(`[adminActions] Registering voter on blockchain: ${normalizedAddress}`, { county, constituency, ward });
    const tx = await contract.registerVoter(normalizedAddress, county, constituency, ward);
    await tx.wait();
    
    console.log(`Successfully registered voter: ${normalizedAddress}`);
    return { success: true, alreadyRegistered: false };
  } catch (error) {
    console.error("Error registering voter:", error);
    
    // Check if error is "already registered" - treat as success
    const errorMsg = String(error.message || error);
    if (errorMsg.includes("already registered") || errorMsg.includes("Voter already registered")) {
      console.log(`[adminActions] Voter already registered on-chain (caught in registration): ${voterAddress}`);
      return { success: true, alreadyRegistered: true };
    }
    
    // Provide more specific error messages for real errors
    if (errorMsg.includes("user rejected transaction")) {
      throw new Error("Transaction rejected by user");
    } else if (errorMsg.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else if (errorMsg.includes("Only admin")) {
      throw new Error("Only admin can register voters");
    } else if (errorMsg.includes("invalid address")) {
      throw new Error("Invalid wallet address format");
    } else {
      throw new Error(`Failed to register voter: ${errorMsg}`);
    }
  }
};

/**
 * Register multiple voters from an array of addresses
 * @param {string[]} voterAddresses - Array of wallet addresses to register
 * @returns {Promise<{success: number, failed: number}>} - Registration results
 */
export const registerMultipleVoters = async (voterAddresses) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const address of voterAddresses) {
    try {
      await registerVoter(address);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ address, error: error.message });
    }
  }

  return results;
};

/**
 * Upload and register voters from CSV file
 * @param {File} file - CSV file containing voter addresses
 * @returns {Promise<{success: number, failed: number}>} - Registration results
 */
export const uploadVoterList = async (file) => {
  try {
    // Import CSV parser dynamically to avoid circular dependencies
    const { parseVoterCSV } = await import('./csvParser');
    
    const voters = await parseVoterCSV(file);
    return await registerMultipleVoters(voters);
  } catch (error) {
    console.error("Error uploading voter list:", error);
    throw error;
  }
};

/**
 * Start the election
 * @returns {Promise<boolean>} - Success status
 */
export const startElection = async () => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      throw new Error("Wallet connection failed");
    }

    const { contract } = wallet;
    
    // Check if the connected wallet is the Super Admin using the contract's custom RBAC
    const hasSuperAdminRole = await isSuperAdminFromContract(contract, wallet.address);
    console.log("[adminActions] Connected wallet:", wallet.address);
    console.log("[adminActions] Is Super Admin (role 8):", hasSuperAdminRole);
    
    if (!hasSuperAdminRole) {
      throw new Error("Only the Super Admin can perform this action.");
    }

    // FIX: Call the public startElection() function directly (SuperAdmin only).
    // The contract has a public startElection() that bypasses multi-sig for SuperAdmin.
    const tx = await contract.startElection();
    await tx.wait();
    
    console.log("Election started successfully");
    return true;
  } catch (error) {
    console.error("Error starting election:", error);
    
    if (error.message.includes("user rejected transaction")) {
      throw new Error("Transaction rejected by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else if (error.message.includes("Only admin")) {
      throw new Error("Only admin can start the election");
    } else if (error.message.includes("election already started")) {
      throw new Error("Election has already been started");
    } else {
      throw new Error(`Failed to start election: ${error.message}`);
    }
  }
};

/**
 * End the election
 * @returns {Promise<boolean>} - Success status
 */
export const endElection = async () => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      throw new Error("Wallet connection failed");
    }

    const { contract } = wallet;
    
    // Check if the connected wallet is the Super Admin using the contract's custom RBAC
    const hasSuperAdminRole = await isSuperAdminFromContract(contract, wallet.address);
    console.log("[adminActions] Connected wallet:", wallet.address);
    console.log("[adminActions] Is Super Admin (role 8):", hasSuperAdminRole);
    
    if (!hasSuperAdminRole) {
      throw new Error("Only the Super Admin can perform this action.");
    }

    // FIX: Call the public endElection() function directly (SuperAdmin only).
    // The contract has a public endElection() that bypasses multi-sig for SuperAdmin.
    const tx = await contract.endElection();
    await tx.wait();
    
    console.log("Election ended successfully");
    return true;
  } catch (error) {
    console.error("Error ending election:", error);
    
    if (error.message.includes("user rejected transaction")) {
      throw new Error("Transaction rejected by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else if (error.message.includes("Only admin")) {
      throw new Error("Only admin can end the election");
    } else if (error.message.includes("election not started")) {
      throw new Error("Election has not been started yet");
    } else if (error.message.includes("election already ended")) {
      throw new Error("Election has already been ended");
    } else {
      throw new Error(`Failed to end election: ${error.message}`);
    }
  }
};

/**
 * Add a candidate to the election
 * @param {string} candidateName - The name of the candidate
 * @param {number} positionIndex - Position index (0=President, 1=Governor, 2=Senator, 3=WomanRep, 4=MP, 5=MCA)
 * @param {string} county - Candidate's county (empty for President)
 * @param {string} constituency - Candidate's constituency (empty for President/Governor/Senator/WomanRep)
 * @param {string} ward - Candidate's ward (empty for President/Governor/Senator/WomanRep/MP)
 * @returns {Promise<boolean>} - Success status
 */
export const addCandidate = async (candidateName, positionIndex = 0, county = '', constituency = '', ward = '') => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      throw new Error("Wallet connection failed");
    }

    const { contract } = wallet;
    
    // Check if the connected wallet is the Super Admin using the contract's custom RBAC
    const hasSuperAdminRole = await isSuperAdminFromContract(contract, wallet.address);
    console.log("[adminActions] Connected wallet:", wallet.address);
    console.log("[adminActions] Is Super Admin (role 8):", hasSuperAdminRole);
    
    if (!hasSuperAdminRole) {
      throw new Error("Only the Super Admin can perform this action.");
    }

    // FIX: Pass ALL 5 required parameters to contract.addCandidate()
    // The contract expects: addCandidate(string _name, uint256 _position, string _county, string _constituency, string _ward)
    const tx = await contract.addCandidate(candidateName, positionIndex, county, constituency, ward);
    await tx.wait();
    
    console.log(`Successfully added candidate: ${candidateName}`);
    return true;
  } catch (error) {
    console.error("Error adding candidate:", error);
    
    if (error.message.includes("user rejected transaction")) {
      throw new Error("Transaction rejected by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else if (error.message.includes("Only admin")) {
      throw new Error("Only admin can add candidates");
    } else if (error.message.includes("election started")) {
      throw new Error("Cannot add candidates after election has started");
    } else if (error.message.includes("empty name")) {
      throw new Error("Candidate name cannot be empty");
    } else {
      throw new Error(`Failed to add candidate: ${error.message}`);
    }
  }
};

/**
 * Check if the connected wallet is the admin
 * @returns {Promise<boolean>} - Admin status
 */
export const isAdmin = async () => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      return false;
    }

    const { contract, address } = wallet;
    const result = await isSuperAdminFromContract(contract, address);
    
    console.log("[adminActions] isAdmin check - Connected wallet:", address);
    console.log("[adminActions] isAdmin check - Is Super Admin (role 8):", result);
    
    return result;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Get admin address from contract
 * @returns {Promise<string>} - Admin wallet address
 */
export const getAdminAddress = async () => {
  try {
    const wallet = await connectWallet();
    if (!wallet) {
      throw new Error("Wallet connection failed");
    }

    const { contract } = wallet;
    // Try to get owner from state variable first
    try {
      return await contract.owner();
    } catch (ownerErr) {
      // If owner() doesn't exist, return null or throw a more specific error
      console.warn("contract.owner() not available, admin address cannot be retrieved directly");
      throw new Error("Admin address not directly accessible via contract.owner()");
    }
  } catch (error) {
    console.error("Error getting admin address:", error);
    throw error;
  }
};

/**
 * Test all admin functions (for development/testing)
 * @returns {Promise<Object>} - Test results
 */
export const testAdminActions = async () => {
  const results = {
    adminCheck: false,
    adminAddress: null,
    registerVoter: false,
    startElection: false,
    endElection: false,
    addCandidate: false,
    errors: []
  };

  try {
    // Check admin status
    results.adminCheck = await isAdmin();
    results.adminAddress = await getAdminAddress();
    
    console.log(`Admin check: ${results.adminCheck}`);
    console.log(`Admin address: ${results.adminAddress}`);

    if (!results.adminCheck) {
      results.errors.push("Not admin - skipping admin action tests");
      return results;
    }

    // Test register voter (with a dummy address)
    try {
      await registerVoter("0x0000000000000000000000000000000000000000");
    } catch (error) {
      // Expected to fail with invalid address, but confirms admin access
      if (error.message.includes("Only admin")) {
        results.errors.push("Admin access confirmed but invalid address used");
      } else {
        results.registerVoter = true; // Admin access confirmed
      }
    }

    // Test start election
    try {
      await startElection();
      results.startElection = true;
    } catch (error) {
      results.errors.push(`Start election error: ${error.message}`);
    }

    // Test end election
    try {
      await endElection();
      results.endElection = true;
    } catch (error) {
      results.errors.push(`End election error: ${error.message}`);
    }

    // Test add candidate
    // FIX: Pass all 5 required parameters (name, positionIndex, county, constituency, ward)
    // Using positionIndex=0 (President) with empty geo data which is valid per contract validation
    try {
      await addCandidate("Test Candidate", 0, '', '', '');
      results.addCandidate = true;
    } catch (error) {
      results.errors.push(`Add candidate error: ${error.message}`);
    }

  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
  }

  return results;
};