/**
 * DeVote National - Security Utilities
 * Professional National-Grade Election Management Platform
 * 
 * This module provides security utilities including:
 * - Input sanitization
 * - XSS prevention
 * - Rate limiting
 * - Session management
 * - Wallet validation
 * - Replay attack protection
 */

import { SECURITY, VALIDATION } from '../config';

// ==========================================
// INPUT SANITIZATION
// ==========================================

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and javascript: protocol
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove special characters that could be used for injection
  sanitized = sanitized.replace(/[<>"'&]/g, (char) => {
    const entities = {
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#x27;',
      '&': '&',
    };
    return entities[char] || char;
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize object with multiple fields
 * @param {Object} obj - Object with string fields to sanitize
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {Object} - Object with sanitized fields
 */
export const sanitizeObject = (obj, fields) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = { ...obj };
  
  fields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field]);
    }
  });
  
  return sanitized;
};

// ==========================================
// WALLET VALIDATION
// ==========================================

/**
 * Validate Ethereum wallet address
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - True if valid
 */
export const isValidWalletAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Check basic format (0x followed by 40 hex characters)
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
};

/**
 * Normalize wallet address to lowercase
 * @param {string} address - Wallet address
 * @returns {string|null} - Normalized address or null if invalid
 */
export const normalizeWalletAddress = (address) => {
  if (!isValidWalletAddress(address)) return null;
  return address.toLowerCase();
};

// ==========================================
// RATE LIMITING
// ==========================================

const rateLimitStore = new Map();

/**
 * Check if action is rate limited
 * @param {string} key - Unique identifier for the action
 * @param {number} maxRequests - Maximum requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if rate limited
 */
export const isRateLimited = (key, maxRequests = SECURITY.RATE_LIMIT_MAX_REQUESTS, windowMs = SECURITY.RATE_LIMIT_WINDOW_MS) => {
  const now = Date.now();
  const userRequests = rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return true;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);
  
  return false;
};

/**
 * Clear rate limit for a key
 * @param {string} key - Unique identifier
 */
export const clearRateLimit = (key) => {
  rateLimitStore.delete(key);
};

// ==========================================
// SESSION MANAGEMENT
// ==========================================

const sessionStore = new Map();

/**
 * Create a new session token
 * @param {string} userId - User identifier
 * @param {number} durationMs - Session duration in milliseconds
 * @returns {string} - Session token
 */
export const createSession = (userId, durationMs = VALIDATION.SESSION_TIMEOUT_MINUTES * 60 * 1000) => {
  const token = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  sessionStore.set(token, {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMs,
    lastActivity: Date.now(),
  });
  
  return token;
};

/**
 * Validate session token
 * @param {string} token - Session token
 * @returns {Object|null} - Session data or null if invalid
 */
export const validateSession = (token) => {
  const session = sessionStore.get(token);
  
  if (!session) return null;
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }
  
  // Update last activity
  session.lastActivity = Date.now();
  sessionStore.set(token, session);
  
  return session;
};

/**
 * Invalidate session
 * @param {string} token - Session token
 */
export const invalidateSession = (token) => {
  sessionStore.delete(token);
};

/**
 * Clean up expired sessions
 */
export const cleanupSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(token);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupSessions, 5 * 60 * 1000);

// ==========================================
// REPLAY ATTACK PROTECTION
// ==========================================

const usedNonces = new Set();

/**
 * Generate a unique nonce for transaction
 * @param {string} userId - User identifier
 * @returns {string} - Unique nonce
 */
export const generateNonce = (userId) => {
  const nonce = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  return nonce;
};

/**
 * Check if nonce has been used (prevent replay attacks)
 * @param {string} nonce - Nonce to check
 * @returns {boolean} - True if nonce was already used
 */
export const isNonceUsed = (nonce) => {
  return usedNonces.has(nonce);
};

/**
 * Mark nonce as used
 * @param {string} nonce - Nonce to mark
 */
export const useNonce = (nonce) => {
  usedNonces.add(nonce);
  
  // Limit store size
  if (usedNonces.size > 10000) {
    const arr = Array.from(usedNonces);
    usedNonces.clear();
    arr.slice(-5000).forEach(n => usedNonces.add(n));
  }
};

// ==========================================
// SUSPICIOUS ACTIVITY DETECTION
// ==========================================

const activityLog = [];
const MAX_ACTIVITY_LOG = 1000;

/**
 * Log user activity for suspicious behavior detection
 * @param {string} userId - User identifier
 * @param {string} action - Action performed
 * @param {Object} metadata - Additional metadata
 */
export const logActivity = (userId, action, metadata = {}) => {
  const entry = {
    userId,
    action,
    metadata,
    timestamp: Date.now(),
    id: `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };
  
  activityLog.push(entry);
  
  // Limit log size
  if (activityLog.length > MAX_ACTIVITY_LOG) {
    activityLog.splice(0, activityLog.length - MAX_ACTIVITY_LOG);
  }
  
  return entry;
};

/**
 * Detect suspicious activity patterns
 * @param {string} userId - User identifier
 * @returns {Object} - Suspicious activity report
 */
export const detectSuspiciousActivity = (userId) => {
  const now = Date.now();
  const recentActivity = activityLog.filter(
    entry => entry.userId === userId && now - entry.timestamp < 60000 // Last minute
  );
  
  const report = {
    isSuspicious: false,
    reasons: [],
    activityCount: recentActivity.length,
  };
  
  // Check for rapid-fire requests
  if (recentActivity.length > 30) {
    report.isSuspicious = true;
    report.reasons.push('Rapid-fire requests detected');
  }
  
  // Check for repeated failed actions
  const failedActions = recentActivity.filter(a => a.metadata.success === false);
  if (failedActions.length > 5) {
    report.isSuspicious = true;
    report.reasons.push('Multiple failed actions');
  }
  
  // Check for action diversity (potential bot behavior)
  const uniqueActions = new Set(recentActivity.map(a => a.action));
  if (uniqueActions.size > 10 && recentActivity.length > 20) {
    report.isSuspicious = true;
    report.reasons.push('Unusual action diversity');
  }
  
  return report;
};

/**
 * Get activity log for user
 * @param {string} userId - User identifier
 * @param {number} limit - Maximum entries to return
 * @returns {Array} - Activity entries
 */
export const getUserActivity = (userId, limit = 50) => {
  return activityLog
    .filter(entry => entry.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

// ==========================================
// TRANSACTION SECURITY
// ==========================================

/**
 * Validate transaction parameters
 * @param {Object} txParams - Transaction parameters
 * @returns {Object} - Validation result
 */
export const validateTransaction = (txParams) => {
  const errors = [];
  
  if (!txParams.to || !isValidWalletAddress(txParams.to)) {
    errors.push('Invalid recipient address');
  }
  
  if (txParams.value !== undefined) {
    const value = Number(txParams.value);
    if (isNaN(value) || value < 0) {
      errors.push('Invalid transaction value');
    }
  }
  
  if (txParams.data && typeof txParams.data !== 'string') {
    errors.push('Invalid transaction data');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create transaction confirmation hash
 * @param {Object} txData - Transaction data
 * @returns {string} - Confirmation hash
 */
export const createConfirmationHash = async (txData) => {
  const data = JSON.stringify(txData, Object.keys(txData).sort());
  
  // Simple hash function (in production, use Web3 hashing)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
};

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * Sanitize error messages for public display
 * @param {Error} error - Error object
 * @returns {string} - Safe error message
 */
export const sanitizeErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  const message = typeof error === 'string' ? error : error.message || 'Unknown error';
  
  // Remove potentially sensitive information
  let safeMessage = message
    .replace(/0x[a-fA-F0-9]{64}/g, '[HASH]') // Hide hashes
    .replace(/0x[a-fA-F0-9]{40}/g, '[ADDRESS]') // Hide addresses
    .replace(/private[_\s]*key/gi, '[REDACTED]') // Hide private key references
    .replace(/secret/gi, '[REDACTED]') // Hide secret references
    .replace(/password/gi, '[REDACTED]') // Hide password references
    .replace(/mnemonic/gi, '[REDACTED]') // Hide mnemonic references
    .substring(0, 200); // Limit length
  
  return sanitizeInput(safeMessage);
};

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {Object} data - Event data
 */
export const logSecurityEvent = (eventType, data) => {
  console.warn(`[SECURITY] ${eventType}:`, {
    timestamp: new Date().toISOString(),
    ...data,
  });
};

// ==========================================
// PASSWORD VALIDATION & HASHING
// ==========================================

/**
 * Validate password strength
 * NOTE: This is for frontend demo-level password validation only.
 * Real production password validation and hashing must be handled server-side
 * with a proper backend and secure password hashing algorithms (bcrypt, argon2).
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, errors, and strength
 */
export const validatePassword = (password) => {
  const errors = [];
  let strengthScore = 0;

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
    };
  }

  // Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    strengthScore += 2;
  } else {
    strengthScore += 1;
  }

  // Require uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strengthScore += 1;
  }

  // Require lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strengthScore += 1;
  }

  // Require number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    strengthScore += 1;
  }

  // Require special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    strengthScore += 1;
  }

  // Determine strength
  let strength = 'weak';
  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Hash password using browser crypto API (SHA-256)
 * 
 *  IMPORTANT: This is for frontend demo-level password handling only.
 * Real production password hashing MUST be handled server-side with proper
 * password hashing algorithms like bcrypt, scrypt, or argon2.
 * SHA-256 is NOT suitable for password storage in production as it's
 * too fast and vulnerable to brute force attacks.
 * 
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} SHA-256 hash as hex string
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  try {
    // Use Web Crypto API if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
      return `0x${hashHex}`;
    }
    
    // Fallback: Simple hash for environments without crypto.subtle
    // NOTE: This is NOT cryptographically secure and should only be used
    // as a last resort fallback for demo purposes.
    console.warn('[SECURITY] crypto.subtle not available, using fallback hash (NOT SECURE)');
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  } catch (error) {
    console.error('[SECURITY] Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

const security = {
  sanitizeInput,
  sanitizeObject,
  isValidWalletAddress,
  normalizeWalletAddress,
  isRateLimited,
  clearRateLimit,
  createSession,
  validateSession,
  invalidateSession,
  generateNonce,
  isNonceUsed,
  useNonce,
  logActivity,
  detectSuspiciousActivity,
  getUserActivity,
  validateTransaction,
  createConfirmationHash,
  sanitizeErrorMessage,
  logSecurityEvent,
  validatePassword,
  hashPassword,
};

export default security;
