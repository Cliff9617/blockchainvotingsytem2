/**
 * permissions.js - Centralized Permission Matrix for DeVote National Election System
 * 
 * PRODUCTION-GRADE HIERARCHICAL PERMISSION SYSTEM
 * 
 * Every permission is defined ONCE in this file.
 * All components consume permissions via usePermissions() hook.
 * No scattered role checks anywhere in the codebase.
 * 
 * Permission levels align with the DeVoteNational smart contract Role enum:
 *   None(0), TechnicalSupport(1), Observer(2), Auditor(3),
 *   WardOfficer(4), ConstituencyOfficer(5), CountyReturningOfficer(6),
 *   NationalElectionCommissioner(7), SuperAdmin(8)
 * 
 * The 11-level hierarchy maps to these contract roles as follows:
 *   Level 1  -> SuperAdmin (8)
 *   Level 2  -> NationalElectionCommissioner (7)
 *   Level 3  -> CountyReturningOfficer (6)
 *   Level 4  -> ConstituencyOfficer (5)
 *   Level 5  -> WardOfficer (4) - Presiding Officer
 *   Level 6  -> WardOfficer (4) - Deputy Presiding Officer
 *   Level 7  -> TechnicalSupport (1) - Poll Clerk
 *   Level 8  -> WardOfficer (4) - Registration Officer
 *   Level 9  -> Auditor (3) - Results Verification Officer
 *   Level 10 -> Auditor (3) - Election Auditor
 *   Level 11 -> Observer (2)
 */

// ==========================================
// CONTRACT ROLE CONSTANTS (from DeVoteNational.sol)
// ==========================================
export const ROLES = {
  NONE: 0,
  TECHNICAL_SUPPORT: 1,
  OBSERVER: 2,
  AUDITOR: 3,
  WARD_OFFICER: 4,
  CONSTITUENCY_OFFICER: 5,
  COUNTY_RETURNING_OFFICER: 6,
  NATIONAL_ELECTION_COMMISSIONER: 7,
  SUPER_ADMIN: 8,
};

// ==========================================
// APPLICATION ROLE STRINGS
// ==========================================
export const APP_ROLES = {
  SUPER_ADMIN: 'super_admin',
  NATIONAL_COMMISSIONER: 'national_commissioner',
  COUNTY_OFFICER: 'county_officer',
  CONSTITUENCY_OFFICER: 'constituency_officer',
  PRESIDING_OFFICER: 'presiding_officer',
  DEPUTY_PRESIDING_OFFICER: 'deputy_presiding_officer',
  POLL_CLERK: 'poll_clerk',
  REGISTRATION_OFFICER: 'registration_officer',
  RESULTS_VERIFICATION: 'results_verification',
  AUDITOR: 'auditor',
  OBSERVER: 'observer',
};

// ==========================================
// ROLE HIERARCHY LEVELS (1 = highest authority)
// ==========================================
export const ROLE_HIERARCHY_LEVEL = {
  [APP_ROLES.SUPER_ADMIN]: 1,
  [APP_ROLES.NATIONAL_COMMISSIONER]: 2,
  [APP_ROLES.COUNTY_OFFICER]: 3,
  [APP_ROLES.CONSTITUENCY_OFFICER]: 4,
  [APP_ROLES.PRESIDING_OFFICER]: 5,
  [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: 6,
  [APP_ROLES.POLL_CLERK]: 7,
  [APP_ROLES.REGISTRATION_OFFICER]: 8,
  [APP_ROLES.RESULTS_VERIFICATION]: 9,
  [APP_ROLES.AUDITOR]: 10,
  [APP_ROLES.OBSERVER]: 11,
};

// ==========================================
// CONTRACT ROLE TO APP ROLE MAPPING
// ==========================================
// Maps the 9 contract roles to the 11 application roles
// Some contract roles map to multiple app roles (e.g., WardOfficer -> Presiding/Deputy/Registration)
export const CONTRACT_TO_APP_ROLES = {
  [ROLES.SUPER_ADMIN]: [APP_ROLES.SUPER_ADMIN],
  [ROLES.NATIONAL_ELECTION_COMMISSIONER]: [APP_ROLES.NATIONAL_COMMISSIONER],
  [ROLES.COUNTY_RETURNING_OFFICER]: [APP_ROLES.COUNTY_OFFICER],
  [ROLES.CONSTITUENCY_OFFICER]: [APP_ROLES.CONSTITUENCY_OFFICER],
  [ROLES.WARD_OFFICER]: [APP_ROLES.PRESIDING_OFFICER, APP_ROLES.DEPUTY_PRESIDING_OFFICER, APP_ROLES.REGISTRATION_OFFICER],
  [ROLES.TECHNICAL_SUPPORT]: [APP_ROLES.POLL_CLERK],
  [ROLES.AUDITOR]: [APP_ROLES.RESULTS_VERIFICATION, APP_ROLES.AUDITOR],
  [ROLES.OBSERVER]: [APP_ROLES.OBSERVER],
  [ROLES.NONE]: [],
};

// ==========================================
// APP ROLE TO CONTRACT ROLE MAPPING
// ==========================================
export const APP_TO_CONTRACT_ROLE = {
  [APP_ROLES.SUPER_ADMIN]: ROLES.SUPER_ADMIN,
  [APP_ROLES.NATIONAL_COMMISSIONER]: ROLES.NATIONAL_ELECTION_COMMISSIONER,
  [APP_ROLES.COUNTY_OFFICER]: ROLES.COUNTY_RETURNING_OFFICER,
  [APP_ROLES.CONSTITUENCY_OFFICER]: ROLES.CONSTITUENCY_OFFICER,
  [APP_ROLES.PRESIDING_OFFICER]: ROLES.WARD_OFFICER,
  [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: ROLES.WARD_OFFICER,
  [APP_ROLES.POLL_CLERK]: ROLES.TECHNICAL_SUPPORT,
  [APP_ROLES.REGISTRATION_OFFICER]: ROLES.WARD_OFFICER,
  [APP_ROLES.RESULTS_VERIFICATION]: ROLES.AUDITOR,
  [APP_ROLES.AUDITOR]: ROLES.AUDITOR,
  [APP_ROLES.OBSERVER]: ROLES.OBSERVER,
};

// ==========================================
// ROLE DISPLAY NAMES
// ==========================================
export const ROLE_DISPLAY_NAMES = {
  [APP_ROLES.SUPER_ADMIN]: 'Super Admin',
  [APP_ROLES.NATIONAL_COMMISSIONER]: 'National Election Commissioner',
  [APP_ROLES.COUNTY_OFFICER]: 'County Returning Officer',
  [APP_ROLES.CONSTITUENCY_OFFICER]: 'Constituency Returning Officer',
  [APP_ROLES.PRESIDING_OFFICER]: 'Presiding Officer',
  [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: 'Deputy Presiding Officer',
  [APP_ROLES.POLL_CLERK]: 'Poll Clerk',
  [APP_ROLES.REGISTRATION_OFFICER]: 'Registration Officer',
  [APP_ROLES.RESULTS_VERIFICATION]: 'Results Verification Officer',
  [APP_ROLES.AUDITOR]: 'Election Auditor',
  [APP_ROLES.OBSERVER]: 'Observer',
};

// ==========================================
// JURISDICTION LEVELS
// ==========================================
export const JURISDICTION = {
  NATIONAL: 'national',
  COUNTY: 'county',
  CONSTITUENCY: 'constituency',
  POLLING_STATION: 'polling_station',
  NONE: 'none',
};

// ==========================================
// ROLE JURISDICTION MAPPING
// ==========================================
export const ROLE_JURISDICTION = {
  [APP_ROLES.SUPER_ADMIN]: JURISDICTION.NATIONAL,
  [APP_ROLES.NATIONAL_COMMISSIONER]: JURISDICTION.NATIONAL,
  [APP_ROLES.COUNTY_OFFICER]: JURISDICTION.COUNTY,
  [APP_ROLES.CONSTITUENCY_OFFICER]: JURISDICTION.CONSTITUENCY,
  [APP_ROLES.PRESIDING_OFFICER]: JURISDICTION.POLLING_STATION,
  [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: JURISDICTION.POLLING_STATION,
  [APP_ROLES.POLL_CLERK]: JURISDICTION.POLLING_STATION,
  [APP_ROLES.REGISTRATION_OFFICER]: JURISDICTION.POLLING_STATION,
  [APP_ROLES.RESULTS_VERIFICATION]: JURISDICTION.NATIONAL,
  [APP_ROLES.AUDITOR]: JURISDICTION.NATIONAL,
  [APP_ROLES.OBSERVER]: JURISDICTION.NATIONAL,
};

// ==========================================
// COMPREHENSIVE PERMISSION MATRIX
// ==========================================
// Each permission is defined ONCE.
// Every role gets a true/false for each permission.
// Components check permissions, not roles directly.

export const PERMISSIONS = {
  // ===== ELECTION LIFECYCLE (Level 1 only) =====
  canStartElection: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canEndElection: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canEmergencyStop: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canConfigureElection: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== OFFICIALS MANAGEMENT =====
  canAssignElectionOfficials: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true, // Can manage county officials
    [APP_ROLES.CONSTITUENCY_OFFICER]: true, // Can manage constituency officials
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canManageAllOfficials: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canManageCountyOfficials: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canManageConstituencyOfficials: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canManagePollingStation: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== NATIONAL SETTINGS =====
  canManageNationalSettings: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canApproveNationalSettings: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== DASHBOARD VISIBILITY =====
  canViewNationalDashboard: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },
  canViewCountyDashboard: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },
  canViewConstituencyDashboard: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },
  canViewPollingStationDashboard: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },

  // ===== COUNTY OPERATIONS =====
  canManageCountyOperations: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canApproveCountyRegistration: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canMonitorCountyResults: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== CONSTITUENCY OPERATIONS =====
  canManageConstituencyOperations: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== VOTER MANAGEMENT =====
  canVerifyVoters: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canApproveRegistration: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canRejectRegistration: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canVerifyDocuments: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canRegisterVoters: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canVoterLookup: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },

  // ===== POLLING OPERATIONS =====
  canRecordPollingActivities: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canMonitorVotingProgress: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },
  canReadPollingData: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },

  // ===== RESULTS =====
  canVerifyResults: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
  canViewResultReports: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: true,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: true,
    [APP_ROLES.POLL_CLERK]: true,
    [APP_ROLES.REGISTRATION_OFFICER]: true,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: true,
  },

  // ===== AUDIT =====
  canAudit: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: false,
  },
  canViewAuditLogs: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: false,
  },
  canViewAuditTransactions: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== OVERRIDE =====
  canOverrideLowerRoles: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== BLOCKCHAIN ADMIN =====
  canManageBlockchainAdmin: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: false,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== CANDIDATE MANAGEMENT =====
  canManageCandidates: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: true,
    [APP_ROLES.CONSTITUENCY_OFFICER]: true,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },

  // ===== NATIONAL REPORTS =====
  canViewNationalReports: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: true,
    [APP_ROLES.AUDITOR]: true,
    [APP_ROLES.OBSERVER]: false,
  },
  canApproveNationalOperations: {
    [APP_ROLES.SUPER_ADMIN]: true,
    [APP_ROLES.NATIONAL_COMMISSIONER]: true,
    [APP_ROLES.COUNTY_OFFICER]: false,
    [APP_ROLES.CONSTITUENCY_OFFICER]: false,
    [APP_ROLES.PRESIDING_OFFICER]: false,
    [APP_ROLES.DEPUTY_PRESIDING_OFFICER]: false,
    [APP_ROLES.POLL_CLERK]: false,
    [APP_ROLES.REGISTRATION_OFFICER]: false,
    [APP_ROLES.RESULTS_VERIFICATION]: false,
    [APP_ROLES.AUDITOR]: false,
    [APP_ROLES.OBSERVER]: false,
  },
};

// ==========================================
// HELPER: Get all permissions for a role
// ==========================================
export const getPermissionsForRole = (appRole) => {
  const result = {};
  for (const [permission, roleMap] of Object.entries(PERMISSIONS)) {
    result[permission] = roleMap[appRole] || false;
  }
  return result;
};

// ==========================================
// HELPER: Get contract role from app role
// ==========================================
export const getContractRoleFromAppRole = (appRole) => {
  return APP_TO_CONTRACT_ROLE[appRole] || ROLES.NONE;
};

// ==========================================
// HELPER: Get app roles from contract role
// ==========================================
export const getAppRolesFromContractRole = (contractRole) => {
  return CONTRACT_TO_APP_ROLES[contractRole] || [];
};

// ==========================================
// HELPER: Check if role has jurisdiction over area
// ==========================================
export const hasJurisdictionOver = (userAppRole, userJurisdiction, targetJurisdiction) => {
  const userLevel = ROLE_HIERARCHY_LEVEL[userAppRole] || 99;
  const jurisdictionOrder = [
    JURISDICTION.NATIONAL,
    JURISDICTION.COUNTY,
    JURISDICTION.CONSTITUENCY,
    JURISDICTION.POLLING_STATION,
  ];
  
  const userJurIndex = jurisdictionOrder.indexOf(userJurisdiction);
  const targetJurIndex = jurisdictionOrder.indexOf(targetJurisdiction);
  
  // National roles can see everything
  if (userJurisdiction === JURISDICTION.NATIONAL) return true;
  
  // User must be at same or higher jurisdiction level
  return userJurIndex >= 0 && targetJurIndex >= 0 && userJurIndex <= targetJurIndex;
};

// ==========================================
// HELPER: Get role hierarchy level
// ==========================================
export const getRoleLevel = (appRole) => {
  return ROLE_HIERARCHY_LEVEL[appRole] || 99;
};

// ==========================================
// HELPER: Check if role can override another role
// ==========================================
export const canOverrideRole = (superiorAppRole, subordinateAppRole) => {
  const superiorLevel = ROLE_HIERARCHY_LEVEL[superiorAppRole] || 99;
  const subordinateLevel = ROLE_HIERARCHY_LEVEL[subordinateAppRole] || 99;
  return superiorLevel < subordinateLevel;
};

export default {
  ROLES,
  APP_ROLES,
  ROLE_HIERARCHY_LEVEL,
  CONTRACT_TO_APP_ROLES,
  APP_TO_CONTRACT_ROLE,
  ROLE_DISPLAY_NAMES,
  JURISDICTION,
  ROLE_JURISDICTION,
  PERMISSIONS,
  getPermissionsForRole,
  getContractRoleFromAppRole,
  getAppRolesFromContractRole,
  hasJurisdictionOver,
  getRoleLevel,
  canOverrideRole,
};