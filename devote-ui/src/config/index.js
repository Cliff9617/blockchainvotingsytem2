/**
 * DeVote National - Main Configuration
 * Professional National-Grade Election Management Platform
 */

import constants from './constants';

// Import contract ABI and address from the dedicated contract config
// This ensures we use the REAL ABI from Hardhat artifacts
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contract';

// Re-export contract config
export { CONTRACT_ABI, CONTRACT_ADDRESS };

// Re-export all constants
export const ROLES = constants.ROLES;
export const ROLE_NAMES = constants.ROLE_NAMES;
export const ROLE_PERMISSIONS = constants.ROLE_PERMISSIONS;
export const POSITIONS = constants.POSITIONS;
export const POSITION_NAMES = constants.POSITION_NAMES;
export const POSITION_INDEX = constants.POSITION_INDEX;
export const ACTION_TYPES = constants.ACTION_TYPES;
export const ACTION_TYPE_NAMES = constants.ACTION_TYPE_NAMES;
export const MULTISIG_ACTION_TYPES = constants.MULTISIG_ACTION_TYPES;
export const MULTISIG_ACTION_NAMES = constants.MULTISIG_ACTION_NAMES;
export const ELECTION_STATUS = constants.ELECTION_STATUS;
export const INCIDENT_STATUS = constants.INCIDENT_STATUS;
export const INCIDENT_SEVERITY = constants.INCIDENT_SEVERITY;
export const GEO_LEVELS = constants.GEO_LEVELS;
export const VALIDATION = constants.VALIDATION;
export const UI_CONFIG = constants.UI_CONFIG;
export const SECURITY = constants.SECURITY;

// ==========================================
// NETWORK CONFIGURATION
// ==========================================
export const SEPOLIA_NETWORK = {
  chainId: "0xaa36a7",
  chainName: "Sepolia Testnet",
  rpcUrls: ["https://rpc.sepolia.org"],
  nativeCurrency: {
    name: "SepoliaETH",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

console.log("[Config] Main configuration loaded");
console.log("[Config] Contract address:", CONTRACT_ADDRESS);
console.log("[Config] ABI functions count:", CONTRACT_ABI.filter(item => item.type === 'function').length);

export default {
  SEPOLIA_NETWORK,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  ...constants,
};
