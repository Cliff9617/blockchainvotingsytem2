/**
 * roleConstants.js - Named Role Constants for DeVote National Election Officials
 * 
 * This file centralizes all role constants used across the Election Officials Management system.
 * It replaces all numeric role mappings with named constants for clarity and maintainability.
 * 
 * These constants align with the DeVoteNational smart contract's Role enum:
 *   None(0), TechnicalSupport(1), Observer(2), Auditor(3),
 *   WardOfficer(4), ConstituencyOfficer(5), CountyReturningOfficer(6),
 *   NationalElectionCommissioner(7), SuperAdmin(8)
 */

// ==========================================
// NAMED ROLE CONSTANTS
// ==========================================
// These map directly to the DeVoteNational.sol Role enum values
export const SUPER_ADMIN_ROLE = 8;
export const IEBC_COMMISSIONER_ROLE = 7;
export const NATIONAL_RETURNING_OFFICER_ROLE = 7; // Maps to NationalElectionCommissioner
export const COUNTY_RETURNING_OFFICER_ROLE = 6;
export const CONSTITUENCY_RETURNING_OFFICER_ROLE = 5;
export const PRESIDING_OFFICER_ROLE = 4; // Maps to WardOfficer
export const DEPUTY_PRESIDING_OFFICER_ROLE = 4; // Maps to WardOfficer
export const POLL_CLERK_ROLE = 1; // Maps to TechnicalSupport
export const REGISTRATION_OFFICER_ROLE = 4; // Maps to WardOfficer
export const RESULTS_VERIFICATION_ROLE = 3; // Maps to Auditor
export const AUDITOR_ROLE = 3;
export const OBSERVER_ROLE = 2;

// ==========================================
// APPLICATION ROLE MAPPING
// ==========================================
// Maps application-specific role string values to contract role enum values
export const APP_ROLE_TO_CONTRACT_ROLE = {
  'super_admin': SUPER_ADMIN_ROLE,
  'iebc_commissioner': IEBC_COMMISSIONER_ROLE,
  'national_returning_officer': NATIONAL_RETURNING_OFFICER_ROLE,
  'county_returning_officer': COUNTY_RETURNING_OFFICER_ROLE,
  'constituency_returning_officer': CONSTITUENCY_RETURNING_OFFICER_ROLE,
  'presiding_officer': PRESIDING_OFFICER_ROLE,
  'deputy_presiding_officer': DEPUTY_PRESIDING_OFFICER_ROLE,
  'poll_clerk': POLL_CLERK_ROLE,
  'voter_registration_officer': REGISTRATION_OFFICER_ROLE,
  'results_verification_officer': RESULTS_VERIFICATION_ROLE,
  'election_auditor': AUDITOR_ROLE,
  'read_only_observer': OBSERVER_ROLE,
};

// ==========================================
// CONTRACT ROLE NAMES (for display)
// ==========================================
export const CONTRACT_ROLE_NAMES = {
  [SUPER_ADMIN_ROLE]: 'Super Admin',
  [IEBC_COMMISSIONER_ROLE]: 'IEBC Commissioner / National Returning Officer',
  [COUNTY_RETURNING_OFFICER_ROLE]: 'County Returning Officer',
  [CONSTITUENCY_RETURNING_OFFICER_ROLE]: 'Constituency Returning Officer',
  [PRESIDING_OFFICER_ROLE]: 'Presiding Officer / Deputy / Registration Officer',
  [POLL_CLERK_ROLE]: 'Poll Clerk',
  [RESULTS_VERIFICATION_ROLE]: 'Results Verification / Auditor',
  [AUDITOR_ROLE]: 'Auditor',
  [OBSERVER_ROLE]: 'Observer',
};

// ==========================================
// ROLE HIERARCHY (higher number = more authority)
// ==========================================
export const ROLE_HIERARCHY = {
  'super_admin': 12,
  'iebc_commissioner': 11,
  'national_returning_officer': 10,
  'county_returning_officer': 9,
  'constituency_returning_officer': 8,
  'presiding_officer': 7,
  'deputy_presiding_officer': 6,
  'poll_clerk': 5,
  'voter_registration_officer': 5,
  'results_verification_officer': 4,
  'election_auditor': 3,
  'read_only_observer': 2,
};

// ==========================================
// JURISDICTION LEVEL BY ROLE
// ==========================================
export const ROLE_JURISDICTION = {
  'super_admin': 'national',
  'iebc_commissioner': 'national',
  'national_returning_officer': 'national',
  'county_returning_officer': 'county',
  'constituency_returning_officer': 'constituency',
  'presiding_officer': 'polling_station',
  'deputy_presiding_officer': 'polling_station',
  'poll_clerk': 'polling_station',
  'voter_registration_officer': 'ward',
  'results_verification_officer': 'national',
  'election_auditor': 'national',
  'read_only_observer': 'national',
};

// ==========================================
// JURISDICTION PERMISSIONS
// ==========================================
// Defines what data each jurisdiction level can see
export const JURISDICTION_SCOPE = {
  'national': { level: 4, label: 'National', canViewAll: true },
  'county': { level: 3, label: 'County', canViewAll: false },
  'constituency': { level: 2, label: 'Constituency', canViewAll: false },
  'ward': { level: 1, label: 'Ward', canViewAll: false },
  'polling_station': { level: 0, label: 'Polling Station', canViewAll: false },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get the contract role enum value for an application role string
 * @param {string} appRole - The application role string (e.g. 'super_admin')
 * @returns {number|null} The contract role enum value or null if not found
 */
export const getContractRole = (appRole) => {
  return APP_ROLE_TO_CONTRACT_ROLE[appRole] ?? null;
};

/**
 * Check if a role has national-level access
 * @param {string} appRole 
 * @returns {boolean}
 */
export const isNationalRole = (appRole) => {
  return ROLE_JURISDICTION[appRole] === 'national';
};

/**
 * Check if a role is a high-level administrative role
 * @param {string} appRole 
 * @returns {boolean}
 */
export const isAdminRole = (appRole) => {
  const hierarchy = ROLE_HIERARCHY[appRole] || 0;
  return hierarchy >= 10;
};

/**
 * Get the hierarchy level for a role
 * @param {string} appRole 
 * @returns {number}
 */
export const getRoleHierarchyLevel = (appRole) => {
  return ROLE_HIERARCHY[appRole] || 0;
};

export default {
  SUPER_ADMIN_ROLE,
  IEBC_COMMISSIONER_ROLE,
  NATIONAL_RETURNING_OFFICER_ROLE,
  COUNTY_RETURNING_OFFICER_ROLE,
  CONSTITUENCY_RETURNING_OFFICER_ROLE,
  PRESIDING_OFFICER_ROLE,
  DEPUTY_PRESIDING_OFFICER_ROLE,
  POLL_CLERK_ROLE,
  REGISTRATION_OFFICER_ROLE,
  RESULTS_VERIFICATION_ROLE,
  AUDITOR_ROLE,
  OBSERVER_ROLE,
  APP_ROLE_TO_CONTRACT_ROLE,
  CONTRACT_ROLE_NAMES,
  ROLE_HIERARCHY,
  ROLE_JURISDICTION,
  JURISDICTION_SCOPE,
  getContractRole,
  isNationalRole,
  isAdminRole,
  getRoleHierarchyLevel,
};