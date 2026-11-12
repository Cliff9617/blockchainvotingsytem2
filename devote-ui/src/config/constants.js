/**
 * DeVote National - Constants and Configuration
 * Professional National-Grade Election Management Platform
 */

// ==========================================
// ROLE DEFINITIONS
// ==========================================
export const ROLES = {
  NONE: 0,
  TECHNICAL_SUPPORT: 1,
  OBSERVER: 2,
  AUDITOR: 3,
  WARD_OFFICER: 4,
  CONSTITUENCY_OFFICER: 5,
  COUNTY_RETURNING_OFFICER: 6,
  NATIONAL_ELECTION_COMMISIONER: 7,
  SUPER_ADMIN: 8,
};

export const ROLE_NAMES = {
  [ROLES.NONE]: 'None',
  [ROLES.TECHNICAL_SUPPORT]: 'Technical Support',
  [ROLES.OBSERVER]: 'Observer',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.WARD_OFFICER]: 'Ward Officer',
  [ROLES.CONSTITUENCY_OFFICER]: 'Constituency Officer',
  [ROLES.COUNTY_RETURNING_OFFICER]: 'County Returning Officer',
  [ROLES.NATIONAL_ELECTION_COMMISIONER]: 'National Election Commissioner',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canAssignRoles: true,
    canRevokeRoles: true,
    canInitializeElection: true,
    canManageCandidates: true,
    canManageVoters: true,
    canViewAuditLogs: true,
    canViewResults: true,
    canCreateMultiSigProposal: true,
    canApproveMultiSig: true,
    maxGeographicScope: 'national',
  },
  [ROLES.NATIONAL_ELECTION_COMMISIONER]: {
    canAssignRoles: true,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: true,
    canManageVoters: true,
    canViewAuditLogs: true,
    canViewResults: true,
    canCreateMultiSigProposal: true,
    canApproveMultiSig: true,
    maxGeographicScope: 'national',
  },
  [ROLES.COUNTY_RETURNING_OFFICER]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: true,
    canViewAuditLogs: true,
    canViewResults: true,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'county',
  },
  [ROLES.CONSTITUENCY_OFFICER]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: true,
    canViewAuditLogs: false,
    canViewResults: true,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'constituency',
  },
  [ROLES.WARD_OFFICER]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: true,
    canViewAuditLogs: false,
    canViewResults: true,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'ward',
  },
  [ROLES.AUDITOR]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: false,
    canViewAuditLogs: true,
    canViewResults: true,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'national',
  },
  [ROLES.OBSERVER]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: false,
    canViewAuditLogs: false,
    canViewResults: true,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'national',
  },
  [ROLES.TECHNICAL_SUPPORT]: {
    canAssignRoles: false,
    canRevokeRoles: false,
    canInitializeElection: false,
    canManageCandidates: false,
    canManageVoters: false,
    canViewAuditLogs: false,
    canViewResults: false,
    canCreateMultiSigProposal: false,
    canApproveMultiSig: false,
    maxGeographicScope: 'national',
  },
};

// ==========================================
// POSITION DEFINITIONS
// ==========================================
export const POSITIONS = {
  PRESIDENT: 0,
  GOVERNOR: 1,
  SENATOR: 2,
  WOMAN_REPRESENTATIVE: 3,
  MEMBER_OF_PARLIAMENT: 4,
  MCA: 5,
};

export const POSITION_NAMES = {
  [POSITIONS.PRESIDENT]: 'President',
  [POSITIONS.GOVERNOR]: 'Governor',
  [POSITIONS.SENATOR]: 'Senator',
  [POSITIONS.WOMAN_REPRESENTATIVE]: 'Woman Representative',
  [POSITIONS.MEMBER_OF_PARLIAMENT]: 'Member of Parliament',
  [POSITIONS.MCA]: 'MCA',
};

export const POSITION_INDEX = {
  0: 'President',
  1: 'Governor',
  2: 'Senator',
  3: 'Woman Representative',
  4: 'Member of Parliament',
  5: 'MCA',
};

// ==========================================
// ACTION TYPES FOR AUDIT LOGS
// ==========================================
export const ACTION_TYPES = {
  VOTER_REGISTERED: 0,
  VOTER_APPROVED: 1,
  VOTER_REJECTED: 2,
  CANDIDATE_ADDED: 3,
  ELECTION_STARTED: 4,
  ELECTION_ENDED: 5,
  VOTE_CAST: 6,
  ROLE_ASSIGNED: 7,
  ROLE_REVOKED: 8,
  MULTISIG_APPROVED: 9,
  MULTISIG_REJECTED: 10,
  INCIDENT_REPORTED: 11,
  ELECTION_PAUSED: 12,
  ELECTION_RESUMED: 13,
};

export const ACTION_TYPE_NAMES = {
  [ACTION_TYPES.VOTER_REGISTERED]: 'Voter Registered',
  [ACTION_TYPES.VOTER_APPROVED]: 'Voter Approved',
  [ACTION_TYPES.VOTER_REJECTED]: 'Voter Rejected',
  [ACTION_TYPES.CANDIDATE_ADDED]: 'Candidate Added',
  [ACTION_TYPES.ELECTION_STARTED]: 'Election Started',
  [ACTION_TYPES.ELECTION_ENDED]: 'Election Ended',
  [ACTION_TYPES.VOTE_CAST]: 'Vote Cast',
  [ACTION_TYPES.ROLE_ASSIGNED]: 'Role Assigned',
  [ACTION_TYPES.ROLE_REVOKED]: 'Role Revoked',
  [ACTION_TYPES.MULTISIG_APPROVED]: 'Multi-Sig Approved',
  [ACTION_TYPES.MULTISIG_REJECTED]: 'Multi-Sig Rejected',
  [ACTION_TYPES.INCIDENT_REPORTED]: 'Incident Reported',
  [ACTION_TYPES.ELECTION_PAUSED]: 'Election Paused',
  [ACTION_TYPES.ELECTION_RESUMED]: 'Election Resumed',
};

// ==========================================
// MULTI-SIG ACTION TYPES
// ==========================================
export const MULTISIG_ACTION_TYPES = {
  START_ELECTION: 0,
  END_ELECTION: 1,
  PUBLISH_RESULTS: 2,
  EMERGENCY_PAUSE: 3,
  BULK_VOTER_APPROVAL: 4,
  CONFIG_CHANGE: 5,
};

export const MULTISIG_ACTION_NAMES = {
  [MULTISIG_ACTION_TYPES.START_ELECTION]: 'Start Election',
  [MULTISIG_ACTION_TYPES.END_ELECTION]: 'End Election',
  [MULTISIG_ACTION_TYPES.PUBLISH_RESULTS]: 'Publish Results',
  [MULTISIG_ACTION_TYPES.EMERGENCY_PAUSE]: 'Emergency Pause',
  [MULTISIG_ACTION_TYPES.BULK_VOTER_APPROVAL]: 'Bulk Voter Approval',
  [MULTISIG_ACTION_TYPES.CONFIG_CHANGE]: 'Configuration Change',
};

// ==========================================
// ELECTION STATUS
// ==========================================
export const ELECTION_STATUS = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
  RESULTS_PUBLISHED: 'results_published',
};

// ==========================================
// INCIDENT STATUS
// ==========================================
export const INCIDENT_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
  DISMISSED: 'dismissed',
};

export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// ==========================================
// GEOGRAPHIC HIERARCHY
// ==========================================
export const GEO_LEVELS = {
  NATIONAL: 'national',
  COUNTY: 'county',
  CONSTITUENCY: 'constituency',
  WARD: 'ward',
};

// ==========================================
// VALIDATION RULES
// ==========================================
export const VALIDATION = {
  MAX_BULK_VOTERS: 100,
  MIN_MULTISIG_THRESHOLD: 2,
  MAX_MULTISIG_THRESHOLD: 10,
  MULTISIG_EXPIRY_HOURS: 24,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_CANDIDATES_PER_POSITION: 50,
};

// ==========================================
// UI CONFIGURATION
// ==========================================
export const UI_CONFIG = {
  REFRESH_INTERVAL_MS: 30000, // 30 seconds
  TOAST_DURATION_MS: 5000,
  CONFIRMATION_DIALOG_TIMEOUT_MS: 30000,
  MAX_DISPLAY_CANDIDATES: 20,
};

// ==========================================
// SECURITY SETTINGS
// ==========================================
export const SECURITY = {
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 900000, // 15 minutes
};

export default {
  ROLES,
  ROLE_NAMES,
  ROLE_PERMISSIONS,
  POSITIONS,
  POSITION_NAMES,
  POSITION_INDEX,
  ACTION_TYPES,
  ACTION_TYPE_NAMES,
  MULTISIG_ACTION_TYPES,
  MULTISIG_ACTION_NAMES,
  ELECTION_STATUS,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  GEO_LEVELS,
  VALIDATION,
  UI_CONFIG,
  SECURITY,
};