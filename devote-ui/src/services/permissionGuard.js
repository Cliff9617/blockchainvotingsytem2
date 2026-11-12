/**
 * permissionGuard.js - Backend Permission Verification Service
 * 
 * PRODUCTION-GRADE SECURITY GUARD
 * 
 * This service verifies permissions BEFORE any protected action is taken.
 * It is called by hooks and components before:
 * - Sending blockchain transactions
 * - Making Firestore writes
 * - Accessing sensitive data
 * 
 * This guard runs BEFORE any MetaMask prompt or blockchain transaction.
 * Never allow unauthorized blockchain transactions.
 * 
 * Every protected action must call:
 *   permissionGuard.verify(requiredPermission, userPermissions, actionName)
 */

import { getPermissionsForRole } from '../config/permissions';

class PermissionGuard {
  /**
   * Verify that a user has the required permission before proceeding with an action.
   * This runs BEFORE any MetaMask prompt or blockchain transaction.
   * 
   * @param {string} requiredPermission - The permission name to check
   * @param {Object} userPermissions - The user's permission object (from usePermissions)
   * @param {string} actionName - Human-readable action name for error messages
   * @throws {Error} If the user does not have the required permission
   */
  verify(requiredPermission, userPermissions, actionName) {
    if (!userPermissions) {
      console.error(`[PermissionGuard]  ${actionName} blocked: No permissions loaded`);
      throw new Error(`Access denied: You do not have permission to ${actionName}. Permissions not loaded.`);
    }

    if (userPermissions[requiredPermission] !== true) {
      console.error(`[PermissionGuard]  ${actionName} blocked: Missing permission "${requiredPermission}"`);
      console.error(`[PermissionGuard] User permissions:`, Object.keys(userPermissions).filter(k => userPermissions[k]));
      throw new Error(`Access denied: You do not have permission to ${actionName}. Required: ${requiredPermission}.`);
    }

    console.log(`[PermissionGuard]  ${actionName} authorized (permission: ${requiredPermission})`);
    return true;
  }

  /**
   * Verify jurisdiction access before proceeding.
   * 
   * @param {string} userJurisdiction - The user's jurisdiction level
   * @param {string} targetJurisdiction - The target jurisdiction level
   * @param {string} userCounty - The user's assigned county
   * @param {string} targetCounty - The target county
   * @param {string} userConstituency - The user's assigned constituency
   * @param {string} targetConstituency - The target constituency
   * @param {string} actionName - Human-readable action name
   * @throws {Error} If the user does not have jurisdiction
   */
  verifyJurisdiction(userJurisdiction, targetJurisdiction, userCounty, targetCounty, userConstituency, targetConstituency, actionName) {
    // National jurisdiction can access everything
    if (userJurisdiction === 'national') return true;

    // County jurisdiction: only their county
    if (userJurisdiction === 'county') {
      if (userCounty !== targetCounty) {
        console.error(`[PermissionGuard]  ${actionName} blocked: County jurisdiction mismatch`);
        throw new Error(`Access denied: You can only access data for your assigned county (${userCounty}).`);
      }
      return true;
    }

    // Constituency jurisdiction: only their constituency
    if (userJurisdiction === 'constituency') {
      if (userConstituency !== targetConstituency) {
        console.error(`[PermissionGuard]  ${actionName} blocked: Constituency jurisdiction mismatch`);
        throw new Error(`Access denied: You can only access data for your assigned constituency (${userConstituency}).`);
      }
      return true;
    }

    // Polling station: limited scope
    if (userJurisdiction === 'polling_station') {
      console.error(`[PermissionGuard]  ${actionName} blocked: Polling station scope too limited`);
      throw new Error(`Access denied: Your role does not have jurisdiction over this area.`);
    }

    // No jurisdiction
    console.error(`[PermissionGuard]  ${actionName} blocked: No jurisdiction (${userJurisdiction})`);
    throw new Error(`Access denied: You do not have jurisdiction to ${actionName}.`);
  }

  /**
   * Verify that a user has at least the minimum required role level.
   * 
   * @param {number} userRole - The user's contract role index
   * @param {number} minimumRole - The minimum role index required
   * @param {string} actionName - Human-readable action name
   * @throws {Error} If the user's role is below the minimum
   */
  verifyMinimumRole(userRole, minimumRole, actionName) {
    if (userRole === null || userRole === undefined) {
      throw new Error(`Access denied: No role assigned. Cannot ${actionName}.`);
    }

    if (userRole < minimumRole) {
      console.error(`[PermissionGuard]  ${actionName} blocked: Insufficient role level`);
      throw new Error(`Access denied: Your role level (${userRole}) is insufficient to ${actionName}. Minimum required: ${minimumRole}.`);
    }

    console.log(`[PermissionGuard]  ${actionName} authorized (role: ${userRole} >= ${minimumRole})`);
    return true;
  }

  /**
   * Create a wrapped action function that verifies permission before executing.
   * 
   * @param {Function} action - The async action function to wrap
   * @param {string} requiredPermission - The permission required
   * @param {Object} userPermissions - The user's permission object
   * @param {string} actionName - Human-readable action name
   * @returns {Function} - Wrapped function that checks permission first
   */
  protectAction(action, requiredPermission, userPermissions, actionName) {
    return async (...args) => {
      this.verify(requiredPermission, userPermissions, actionName);
      return action(...args);
    };
  }

  /**
   * Get a list of all permissions a user has.
   * 
   * @param {Object} userPermissions - The user's permission object
   * @returns {string[]} - Array of granted permission names
   */
  getGrantedPermissions(userPermissions) {
    if (!userPermissions) return [];
    return Object.keys(userPermissions).filter(key => userPermissions[key] === true);
  }
}

// Singleton instance
const permissionGuard = new PermissionGuard();

export default permissionGuard;