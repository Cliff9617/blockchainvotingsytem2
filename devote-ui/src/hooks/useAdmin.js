import { useEffect, useState, useCallback, useRef } from "react";
import serializeBigInt from "../utils/serializeBigInt";

/**
 * useAdmin - Admin Detection Hook
 * 
 * This hook checks if the connected wallet is the contract SuperAdmin
 * by calling contract.getUserRole(account) and checking if the role
 * is SuperAdmin (index 8).
 * 
 * The DeVoteNational contract uses a custom RBAC system (not OpenZeppelin).
 * The deployer wallet is assigned Role.SuperAdmin (8) in the constructor.
 * 
 * Console Output:
 * - "Connected Wallet:" - The currently connected wallet address
 * - "User Role:" - The role index from getUserRole()
 * - "Is SuperAdmin:" - Boolean result of the comparison
 */
const useAdmin = (contract, account) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  
  // Use refs to track values without causing re-renders
  const previousAccountRef = useRef(null);
  const previousContractRef = useRef(null);
  const isCheckInProgressRef = useRef(false);

  // Role.SuperAdmin = 8 in the DeVoteNational contract
  const SUPER_ADMIN_ROLE = 8;

  /**
   * Normalize an address for comparison
   */
  const normalizeAddress = useCallback((address) => {
    if (!address) return "";
    return String(address).toLowerCase().trim();
  }, []);

  /**
   * Perform the admin check using the contract's actual RBAC system
   * Uses getUserRole() which IS in the deployed ABI
   */
  const performAdminCheck = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckInProgressRef.current) {
      console.log("[useAdmin]  Admin check already in progress, skipping...");
      return false;
    }

    console.log("[useAdmin]  Starting admin status check...");
    console.log("[useAdmin]  Contract instance exists:", !!contract);
    console.log("[useAdmin]  Connected account:", account);

    // If no contract or account, wait
    if (!contract || !account) {
      console.log("[useAdmin]  Waiting for contract or account to be available...");
      return false;
    }

    // Mark check as in progress
    isCheckInProgressRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      console.log("[useAdmin]  Checking admin via getUserRole()...");
      
      // Use getUserRole() which IS in the deployed ABI
      // This returns: (role, county, constituency, ward, active, assignedAt, assignedBy)
      const roleData = await contract.getUserRole(account);
      const roleIndex = Number(roleData.role);
      
      console.log("[useAdmin]  Raw role data:", serializeBigInt(roleData));
      console.log("[useAdmin]  Role index:", roleIndex);
      console.log("[useAdmin]  Role active:", roleData.active);
      
      // Check if the user has SuperAdmin role (index 8)
      const isSuperAdmin = roleIndex === SUPER_ADMIN_ROLE && roleData.active === true;
      
      console.log("[useAdmin]  Is SuperAdmin (role 8):", isSuperAdmin);
      
      // Also try to get the owner via the public state variable
      // Note: The ABI may not have owner() - this is a best-effort attempt
      let fetchedAdminAddress = null;
      try {
        // Try userRoles mapping which IS in the ABI
        // The owner is the address that deployed the contract
        // We can check if the connected wallet has SuperAdmin role
        if (isSuperAdmin) {
          fetchedAdminAddress = account;
        }
      } catch (ownerErr) {
        console.warn("[useAdmin]  Could not determine admin address, using role check only");
        if (isSuperAdmin) {
          fetchedAdminAddress = account;
        }
      }

      // Log results
      console.log("[useAdmin]  ===== ADMIN CHECK RESULT =====");
      console.log("[useAdmin]  Connected Wallet:", account);
      console.log("[useAdmin]  Contract Admin:", fetchedAdminAddress);
      console.log("[useAdmin]  Is Main Admin:", isSuperAdmin);
      console.log("[useAdmin]  Role Index:", roleIndex);
      console.log("[useAdmin]  Role Name:", getRoleName(roleIndex));
      console.log("[useAdmin]  Role Active:", roleData.active);

      if (isSuperAdmin) {
        console.log("[useAdmin]  SUPERADMIN DETECTED! User has full admin access.");
      } else {
        console.log("[useAdmin]  User is NOT the SuperAdmin.");
        console.log("[useAdmin]  Expected role 8 (SuperAdmin), got role", roleIndex, `(${getRoleName(roleIndex)})`);
      }

      // Update state
      setAdminAddress(fetchedAdminAddress);
      setIsAdmin(isSuperAdmin);
      setIsVerified(true);
      setIsLoading(false);
      isCheckInProgressRef.current = false;
      
      return isSuperAdmin;
    } catch (err) {
      console.error("[useAdmin]  Failed to check admin status:", err);
      console.error("[useAdmin]  Error details:", err.message);
      console.error("[useAdmin]  Error code:", err.code);

      setIsAdmin(false);
      setError(err?.message || "Failed to verify admin status. Please check console for details.");
      setIsVerified(true);
      setIsLoading(false);
      isCheckInProgressRef.current = false;
      return false;
    }
  }, [contract, account, normalizeAddress]);

  // Expose checkAdmin function for manual triggering
  const checkAdmin = useCallback(async () => {
    console.log("[useAdmin]  Manual admin check requested");
    return performAdminCheck();
  }, [performAdminCheck]);

  // Trigger admin check when contract or account changes
  useEffect(() => {
    // Skip if no contract or account
    if (!contract || !account) {
      console.log("[useAdmin]  Waiting for contract and account before checking admin...");
      // Reset state when disconnected
      if (isVerified) {
        setIsVerified(false);
        setIsAdmin(false);
        setAdminAddress(null);
        setIsLoading(true);
      }
      return;
    }

    // Check if account or contract changed
    const accountChanged = account !== previousAccountRef.current;
    const contractChanged = contract !== previousContractRef.current;

    if (accountChanged || contractChanged) {
      console.log("[useAdmin]  Account or contract changed, re-verifying admin...");
      console.log("[useAdmin]  Account changed:", accountChanged);
      console.log("[useAdmin]  Contract changed:", contractChanged);
      
      // Reset state for new verification
      setIsLoading(true);
      setIsVerified(false);
      setIsAdmin(false);
      setAdminAddress(null);
      setError("");
      previousAccountRef.current = account;
      previousContractRef.current = contract;
      
      // Perform check after state reset
      performAdminCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account]); // Only depend on contract and account changes

  // Debug: Expose admin check to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._debugCheckAdmin = checkAdmin;
      window._debugAdminState = {
        isAdmin,
        adminAddress,
        isLoading,
        isVerified,
        error,
        connectedAccount: account,
        contractExists: !!contract,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window._debugCheckAdmin;
        delete window._debugAdminState;
      }
    };
  }, [isAdmin, adminAddress, isLoading, isVerified, error, account, contract, checkAdmin]);

  return {
    isAdmin,
    adminAddress,
    isLoading,
    isVerified,
    error,
    checkAdmin,
  };
};

/**
 * Get human-readable role name from role index
 */
function getRoleName(roleIndex) {
  const names = [
    'None',           // 0
    'TechnicalSupport', // 1
    'Observer',       // 2
    'Auditor',        // 3
    'WardOfficer',    // 4
    'ConstituencyOfficer', // 5
    'CountyReturningOfficer', // 6
    'NationalElectionCommissioner', // 7
    'SuperAdmin',     // 8
  ];
  return names[roleIndex] || `Unknown (${roleIndex})`;
}

export default useAdmin;