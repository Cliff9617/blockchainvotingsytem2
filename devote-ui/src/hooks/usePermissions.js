/**
 * usePermissions - Unified Permission Hook for DeVote National Election System
 * 
 * PRODUCTION-GRADE CENTRALIZED RBAC HOOK
 * 
 * Every component MUST call usePermissions() instead of implementing custom RBAC.
 * This hook determines permissions from the blockchain role (getUserRole()).
 * No hardcoded wallet addresses.
 * No scattered role checks.
 * 
 * Returns:
 *   role            - Contract role index (0-8)
 *   appRole         - Application role string
 *   permissions     - All permission flags
 *   isSuperAdmin    - Boolean
 *   isCommissioner  - Boolean
 *   isCountyOfficer - Boolean
 *   isConstituencyOfficer - Boolean
 *   isPollingOfficer - Boolean
 *   isAuditor       - Boolean
 *   isObserver      - Boolean
 *   hasPermission(permission) - Check specific permission
 *   hasRole(contractRoleIndex) - Check minimum role level
 *   jurisdiction    - The user's jurisdiction scope
 *   canAccessModule(moduleName) - Check if user can see a module
 *   loading         - Loading state
 *   error           - Error message
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import serializeBigInt from '../utils/serializeBigInt';
import {
  ROLES,
  APP_ROLES,
  CONTRACT_TO_APP_ROLES,
  PERMISSIONS,
  ROLE_JURISDICTION,
  JURISDICTION,
  ROLE_HIERARCHY_LEVEL,
  getPermissionsForRole,
  getContractRoleFromAppRole,
  getAppRolesFromContractRole,
  hasJurisdictionOver,
  getRoleLevel,
} from '../config/permissions';

// ==========================================
// MODULE ACCESS RULES
// ==========================================
// Maps UI modules to the permissions required to view them
const MODULE_PERMISSION_MAP = {
  electionControls: ['canStartElection', 'canEndElection', 'canEmergencyStop', 'canConfigureElection'],
  electionOfficials: ['canAssignElectionOfficials', 'canManageAllOfficials', 'canManageCountyOfficials', 'canManageConstituencyOfficials'],
  candidateManagement: ['canManageCandidates'],
  voterRegistration: ['canApproveRegistration', 'canRejectRegistration', 'canRegisterVoters'],
  voterVerification: ['canVerifyVoters', 'canVerifyDocuments'],
  nationalDashboard: ['canViewNationalDashboard'],
  countyDashboard: ['canViewCountyDashboard'],
  constituencyDashboard: ['canViewConstituencyDashboard'],
  pollingStationDashboard: ['canViewPollingStationDashboard'],
  resultsVerification: ['canVerifyResults'],
  resultsViewing: ['canViewResultReports'],
  auditLogs: ['canViewAuditLogs', 'canAudit'],
  auditTransactions: ['canViewAuditTransactions'],
  nationalReports: ['canViewNationalReports'],
  nationalSettings: ['canManageNationalSettings', 'canApproveNationalSettings'],
  countyOperations: ['canManageCountyOperations'],
  constituencyOperations: ['canManageConstituencyOperations'],
  pollingOperations: ['canRecordPollingActivities'],
  votingProgress: ['canMonitorVotingProgress'],
  voterLookup: ['canVoterLookup'],
};

const usePermissions = (contract, account) => {
  const [role, setRole] = useState(null); // Contract role index (0-8)
  const [appRoles, setAppRoles] = useState([]); // Application role strings
  const [primaryAppRole, setPrimaryAppRole] = useState(null); // First matched app role
  const [permissions, setPermissions] = useState(null);
  const [jurisdiction, setJurisdiction] = useState(JURISDICTION.NONE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleData, setRoleData] = useState(null);

  // Use refs to prevent concurrent checks
  const isCheckInProgress = useRef(false);
  const prevContractRef = useRef(null);
  const prevAccountRef = useRef(null);

  // Fetch role from blockchain
  const fetchRole = useCallback(async () => {
    if (isCheckInProgress.current) {
      return;
    }

    if (!contract || !account) {
      setRole(null);
      setAppRoles([]);
      setPrimaryAppRole(null);
      setPermissions(null);
      setJurisdiction(JURISDICTION.NONE);
      setRoleData(null);
      setLoading(false);
      return;
    }

    isCheckInProgress.current = true;
    setLoading(true);
    setError('');

    try {
      // Get user role from blockchain - this is the authoritative source
      const userRoleData = await contract.getUserRole(account);
      const roleIndex = Number(userRoleData.role);
      
      // Map contract role to application roles
      const matchedAppRoles = getAppRolesFromContractRole(roleIndex);
      const primaryRole = matchedAppRoles.length > 0 ? matchedAppRoles[0] : null;
      
      // Get permissions for the primary app role
      const rolePermissions = primaryRole ? getPermissionsForRole(primaryRole) : {};
      
      // Determine jurisdiction
      const userJurisdiction = primaryRole 
        ? (ROLE_JURISDICTION[primaryRole] || JURISDICTION.NONE)
        : JURISDICTION.NONE;

      // Store county/constituency/ward from the contract
      const userJurisdictionData = {
        county: userRoleData.county || '',
        constituency: userRoleData.constituency || '',
        ward: userRoleData.ward || '',
        active: Boolean(userRoleData.active),
      };

      setRole(roleIndex);
      setAppRoles(matchedAppRoles);
      setPrimaryAppRole(primaryRole);
      setPermissions(rolePermissions);
      setJurisdiction(userJurisdiction);
      setRoleData(serializeBigInt(userRoleData));

    } catch (err) {
      console.error('[usePermissions] Error fetching role:', err);
      // Default to no role on error
      setRole(ROLES.NONE);
      setAppRoles([]);
      setPrimaryAppRole(null);
      setPermissions({});
      setJurisdiction(JURISDICTION.NONE);
      setRoleData(null);
    } finally {
      setLoading(false);
      isCheckInProgress.current = false;
    }
  }, [contract, account]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionName) => {
    if (!permissions) return false;
    return permissions[permissionName] === true;
  }, [permissions]);

  // Check if user has a minimum contract role level
  const hasRole = useCallback((minimumRoleIndex) => {
    if (role === null || role === undefined) return false;
    return role >= minimumRoleIndex;
  }, [role]);

  // Check if user can access a specific UI module
  const canAccessModule = useCallback((moduleName) => {
    if (!permissions) return false;
    
    const requiredPermissions = MODULE_PERMISSION_MAP[moduleName];
    if (!requiredPermissions) return false;
    
    // User needs at least ONE of the required permissions to access the module
    return requiredPermissions.some(perm => permissions[perm] === true);
  }, [permissions]);

  // Check jurisdiction over a specific area
  const canAccessJurisdiction = useCallback((targetJurisdiction, targetCounty, targetConstituency) => {
    if (!primaryAppRole) return false;
    
    // Super Admin and National roles can access everything
    if (jurisdiction === JURISDICTION.NATIONAL) return true;
    
    // County officers: only their county
    if (jurisdiction === JURISDICTION.COUNTY) {
      if (targetJurisdiction === JURISDICTION.COUNTY || targetJurisdiction === JURISDICTION.CONSTITUENCY || targetJurisdiction === JURISDICTION.POLLING_STATION) {
        return roleData?.county === targetCounty;
      }
      return false;
    }
    
    // Constituency officers: only their constituency
    if (jurisdiction === JURISDICTION.CONSTITUENCY) {
      if (targetJurisdiction === JURISDICTION.CONSTITUENCY || targetJurisdiction === JURISDICTION.POLLING_STATION) {
        return roleData?.constituency === targetConstituency;
      }
      return false;
    }
    
    // Polling station: only their polling station
    if (jurisdiction === JURISDICTION.POLLING_STATION) {
      return targetJurisdiction === JURISDICTION.POLLING_STATION;
    }
    
    return false;
  }, [primaryAppRole, jurisdiction, roleData]);

  // Computed role flags
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isCommissioner = role === ROLES.NATIONAL_ELECTION_COMMISSIONER;
  const isCountyOfficer = role === ROLES.COUNTY_RETURNING_OFFICER;
  const isConstituencyOfficer = role === ROLES.CONSTITUENCY_OFFICER;
  const isWardOfficer = role === ROLES.WARD_OFFICER;
  const isAuditor = role === ROLES.AUDITOR;
  const isObserver = role === ROLES.OBSERVER;
  const isTechnicalSupport = role === ROLES.TECHNICAL_SUPPORT;
  const hasAnyRole = role > ROLES.NONE;

  // Role display name
  const roleDisplayName = primaryAppRole 
    ? ROLE_JURISDICTION[primaryAppRole] 
      ? `${primaryAppRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
      : 'Unknown'
    : role === ROLES.NONE 
      ? 'Voter' 
      : `Role ${role}`;

  // Fetch role on mount and when contract/account changes
  useEffect(() => {
    const contractChanged = contract !== prevContractRef.current;
    const accountChanged = account !== prevAccountRef.current;
    
    if (contractChanged || accountChanged) {
      prevContractRef.current = contract;
      prevAccountRef.current = account;
      fetchRole();
    } else if (!prevContractRef.current && contract) {
      prevContractRef.current = contract;
      fetchRole();
    }
  }, [contract, account, fetchRole]);

  return {
    // State
    role,
    appRoles,
    primaryAppRole,
    permissions,
    jurisdiction,
    loading,
    error,
    roleData,

    // Computed role flags
    isSuperAdmin,
    isCommissioner,
    isCountyOfficer,
    isConstituencyOfficer,
    isWardOfficer,
    isAuditor,
    isObserver,
    isTechnicalSupport,
    hasAnyRole,
    roleDisplayName,

    // Methods
    hasPermission,
    hasRole,
    canAccessModule,
    canAccessJurisdiction,

    // Debug
    fetchRole,

    // Constants
    ROLES,
    APP_ROLES,
    JURISDICTION,
  };
};

export default usePermissions;