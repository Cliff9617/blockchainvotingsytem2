/**
 * DeVote National - Contract Configuration
 * This file imports the REAL ABI from Hardhat artifacts
 * DO NOT manually edit this ABI - it must match the deployed contract
 */

// Import the REAL ABI from Hardhat compiled artifact (copied into src/abi)
import DeVoteNationalArtifact from "../abi/DeVoteNational.json";

// Extract the ABI from the artifact
export const CONTRACT_ABI = DeVoteNationalArtifact.abi;

// Contract address (single source of truth)
// NEW DEPLOYMENT: Added public startElection() and endElection() functions
// Fixes the bug where startElection only created a multi-sig proposal
export const CONTRACT_ADDRESS = "0xDD733444cEb047859F0BAc4e6E8d8BcC07c8d3E9";

console.log("[Contract Config] ABI loaded from Hardhat artifact");
console.log("[Contract Config] Contract address:", CONTRACT_ADDRESS);
console.log("[Contract Config] ABI functions count:", CONTRACT_ABI.filter(item => item.type === 'function').length);

export default {
  CONTRACT_ABI,
  CONTRACT_ADDRESS
};