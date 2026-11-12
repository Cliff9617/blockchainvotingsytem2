/**
 * useSuperAdmin - Super Admin Authorization Hook
 * 
 * This hook checks if the connected wallet holds the SuperAdmin role (role 8)
 * in the DeVoteNational contract's custom RBAC system.
 * 
 * The contract constructor assigns Role.SuperAdmin (8) to the deployer wallet.
 * Only this wallet may execute election lifecycle operations:
 * - Start Election
 * - End Election
 * - Restart Election
 * - Emergency Controls
 * - Election Configuration
 * 
 * All other roles (IEBC Commissioner, National Returning Officer, etc.)
 * must NEVER be able to execute these functions.
 * 
 * Console Output:
 * - "Connected Wallet:" - The currently connected wallet address
 * - "User Role:" - The role index from getUserRole()
 * - "Is SuperAdmin:" - Boolean result of the comparison
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SUPER_ADMIN_ROLE } from '../config/roleConstants';
import serializeBigInt from '../utils/serializeBigInt';

const useSuperAdmin = (contract, account) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  // Use refs to prevent concurrent checks
  const isCheckInProgressRef = useRef(false);
  const previousAccountRef = useRef(null);
  const previousContractRef = useRef(null);

  /**
   * Perform the Super Admin check using the contract's custom RBAC system
   * Uses getUserRole() which returns (role, county, constituency, ward, active, assignedAt, assignedBy)
   */
  const checkSuperAdmin = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckInProgressRef.current) {
      console.log('[useSuperAdmin]  Check already in progress, skipping...');
      return false;
    }

    console.log('[useSuperAdmin]  Starting Super Admin status check...');
    console.log('[useSuperAdmin]  Contract instance exists:', !!contract);
    console.log('[useSuperAdmin]  Connected account:', account);

    // If no contract or account, wait
    if (!contract || !account) {
      console.log('[useSuperAdmin]  Waiting for contract or account to be available...');
      setIsLoading(true);
      setIsVerified(false);
      setIsSuperAdmin(false);
      return false;
    }

    isCheckInProgressRef.current = true;
    setIsLoading(true);
    setError('');

    try {
      console.log('[useSuperAdmin]  Checking role via getUserRole()...');

      // Use getUserRole() which IS in the deployed ABI
      // This returns: (role, county, constituency, ward, active, assignedAt, assignedBy)
      const roleData = await contract.getUserRole(account);
      const roleIndex = Number(roleData.role);

      console.log('[useSuperAdmin]  Raw role data:', serializeBigInt(roleData));
      console.log('[useSuperAdmin]  Role index:', roleIndex);
      console.log('[useSuperAdmin]  Role active:', roleData.active);

      // Check if the user has SuperAdmin role (index 8) AND is active
      const hasSuperAdminRole = roleIndex === SUPER_ADMIN_ROLE && roleData.active === true;

      console.log('[useSuperAdmin]  Is SuperAdmin (role 8):', hasSuperAdminRole);

      // Log results
      console.log('[useSuperAdmin]  ===== SUPER ADMIN CHECK RESULT =====');
      console.log('[useSuperAdmin]  Connected Wallet:', account);
      console.log('[useSuperAdmin]  Role Index:', roleIndex);
      console.log('[useSuperAdmin]  Is SuperAdmin:', hasSuperAdminRole);
      console.log('[useSuperAdmin]  Role Active:', roleData.active);

      if (hasSuperAdminRole) {
        console.log('[useSuperAdmin]  SUPERADMIN DETECTED! User has full election lifecycle authority.');
      } else {
        console.log('[useSuperAdmin]  User is NOT the SuperAdmin.');
        console.log('[useSuperAdmin]  Expected role 8 (SuperAdmin), got role', roleIndex);
      }

      // Update state
      setIsSuperAdmin(hasSuperAdminRole);
      setIsVerified(true);
      setIsLoading(false);
      isCheckInProgressRef.current = false;

      return hasSuperAdminRole;
    } catch (err) {
      console.error('[useSuperAdmin]  Failed to check Super Admin status:', err);
      console.error('[useSuperAdmin]  Error details:', err.message);

      setIsSuperAdmin(false);
      setError(err?.message || 'Failed to verify Super Admin status');
      setIsVerified(true);
      setIsLoading(false);
      isCheckInProgressRef.current = false;
      return false;
    }
  }, [contract, account]);

  // Expose recheck function for manual triggering
  const recheck = useCallback(async () => {
    console.log('[useSuperAdmin]  Manual Super Admin recheck requested');
    return checkSuperAdmin();
  }, [checkSuperAdmin]);

  // Trigger Super Admin check when contract or account changes
  useEffect(() => {
    // Skip if no contract or account
    if (!contract || !account) {
      console.log('[useSuperAdmin]  Waiting for contract and account before checking...');
      if (isVerified) {
        setIsVerified(false);
        setIsSuperAdmin(false);
        setIsLoading(true);
      }
      return;
    }

    // Check if account or contract changed
    const accountChanged = account !== previousAccountRef.current;
    const contractChanged = contract !== previousContractRef.current;

    if (accountChanged || contractChanged) {
      console.log('[useSuperAdmin]  Account or contract changed, re-verifying...');
      console.log('[useSuperAdmin]  Account changed:', accountChanged);
      console.log('[useSuperAdmin]  Contract changed:', contractChanged);

      // Reset state for new verification
      setIsLoading(true);
      setIsVerified(false);
      setIsSuperAdmin(false);
      setError('');
      previousAccountRef.current = account;
      previousContractRef.current = contract;

      // Perform check after state reset
      checkSuperAdmin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, account]);

  // Debug: Expose Super Admin check to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._debugSuperAdmin = {
        isSuperAdmin,
        isLoading,
        isVerified,
        error,
        connectedAccount: account,
        contractExists: !!contract,
        recheck,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window._debugSuperAdmin;
      }
    };
  }, [isSuperAdmin, isLoading, isVerified, error, account, contract, recheck]);

  return {
    isSuperAdmin,
    isLoading,
    isVerified,
    error,
    recheck,
  };
};

export default useSuperAdmin;