/**
 * officialAuditService.js - Immutable Audit Log Service for Election Officials
 * 
 * Creates and retrieves audit entries in the 'officialAuditLogs' Firestore collection.
 * Every action related to election officials is logged immutably.
 */

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { db } from "../firebase";

const AUDIT_COLLECTION = "officialAuditLogs";

/**
 * Audit action types for election officials
 */
export const AUDIT_ACTIONS = {
  CREATE: "Create",
  EDIT: "Edit",
  ROLE_ASSIGNMENT: "Role Assignment",
  ACTIVATION: "Activation",
  SUSPENSION: "Suspension",
  DELETION: "Deletion",
};

/**
 * Create an immutable audit log entry
 * @param {Object} params
 * @param {string} params.action - The action type (from AUDIT_ACTIONS)
 * @param {string} params.performedBy - Display name of person who performed the action
 * @param {string} params.performerWallet - Wallet address of the performer
 * @param {string} params.targetOfficial - Display name of the target official
 * @param {string} params.officialWallet - Wallet address of the target official
 * @param {string} params.previousRole - Previous role value
 * @param {string} params.newRole - New role value
 * @param {string} params.previousStatus - Previous status value
 * @param {string} params.newStatus - New status value
 * @param {string} params.county - County associated
 * @param {string} params.constituency - Constituency associated
 * @param {string} params.pollingStation - Polling station associated
 * @param {string} params.blockchainTxHash - Blockchain transaction hash (if any)
 * @param {string} params.ipPlaceholder - IP address placeholder
 * @param {string} params.notes - Additional notes
 * @returns {Promise<string>} The audit document ID
 */
export const createAuditLog = async ({
  action,
  performedBy = "",
  performerWallet = "",
  targetOfficial = "",
  officialWallet = "",
  previousRole = "",
  newRole = "",
  previousStatus = "",
  newStatus = "",
  county = "",
  constituency = "",
  pollingStation = "",
  blockchainTxHash = "",
  ipPlaceholder = "0.0.0.0",
  notes = "",
}) => {
  const now = Timestamp.now();

  const auditEntry = {
    action,
    performedBy,
    performerWallet,
    targetOfficial,
    officialWallet,
    previousRole,
    newRole,
    previousStatus,
    newStatus,
    county,
    constituency,
    pollingStation,
    blockchainTxHash,
    ipPlaceholder,
    notes,
    timestamp: now,
    createdAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, AUDIT_COLLECTION), auditEntry);
    console.log(`[OfficialAuditService] Audit log created: ${docRef.id} - ${action} for ${targetOfficial}`);
    return { id: docRef.id, ...auditEntry };
  } catch (err) {
    console.error("[OfficialAuditService] Failed to create audit log:", err);
    throw new Error("Failed to create audit log: " + err.message);
  }
};

/**
 * Get audit logs with optional filters
 * @param {Object} filters
 * @param {string} [filters.officialWallet] - Filter by target official's wallet
 * @param {string} [filters.action] - Filter by action type
 * @param {string} [filters.performerWallet] - Filter by performer wallet
 * @param {number} [filters.maxResults] - Maximum results to return
 * @param {Function} [onUpdate] - Real-time callback
 * @returns {Promise<Array|Function>}
 */
export const getAuditLogs = (filters = {}, onUpdate = null) => {
  const auditRef = collection(db, AUDIT_COLLECTION);

  try {
    let q = query(auditRef, orderBy("timestamp", "desc"));

    if (filters.officialWallet) {
      q = query(q, where("officialWallet", "==", filters.officialWallet.toLowerCase()));
    }
    if (filters.action) {
      q = query(q, where("action", "==", filters.action));
    }
    if (filters.performerWallet) {
      q = query(q, where("performerWallet", "==", filters.performerWallet.toLowerCase()));
    }
    if (filters.maxResults) {
      q = query(q, limit(filters.maxResults));
    }

    if (onUpdate) {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        onUpdate(logs);
      }, (err) => {
        console.error("[OfficialAuditService] Listener error:", err);
        onUpdate([]);
      });
      return unsubscribe;
    }

    return getDocs(q).then((snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      return logs;
    });
  } catch (err) {
    console.error("[OfficialAuditService] Query error:", err);
    if (onUpdate) {
      onUpdate([]);
      return () => {};
    }
    return Promise.resolve([]);
  }
};

/**
 * Get audit logs for a specific official by wallet
 * @param {string} wallet 
 * @param {number} [maxResults=50]
 * @returns {Promise<Array>}
 */
export const getAuditLogsByOfficial = async (wallet, maxResults = 50) => {
  if (!wallet) return [];
  return getAuditLogs({ officialWallet: wallet.toLowerCase(), maxResults });
};

/**
 * Format audit log for display
 * @param {Object} log 
 * @returns {Object} Formatted log entry
 */
export const formatAuditLog = (log) => {
  const ts = log.timestamp?.toDate ? log.timestamp.toDate() : 
            log.timestamp ? new Date(log.timestamp) : new Date();
  
  return {
    ...log,
    formattedDate: ts.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    formattedTimestamp: ts.toISOString(),
  };
};

export default {
  AUDIT_ACTIONS,
  createAuditLog,
  getAuditLogs,
  getAuditLogsByOfficial,
  formatAuditLog,
};