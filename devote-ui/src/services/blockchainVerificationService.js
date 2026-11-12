/**
 * Blockchain Verification Service
 * 
 * Verifies votes on the blockchain using ethers.js
 * Checks transaction existence, block confirmations, and election state.
 * NEVER reveals which candidate was voted for.
 */
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

/**
 * Get a provider connected to Sepolia
 * @returns {ethers.Provider} - The provider
 */
const getProvider = () => {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
};

/**
 * Verify a blockchain transaction exists and succeeded
 * @param {string} transactionHash - The transaction hash to verify
 * @returns {Promise<Object>} - Verification result
 */
export const verifyTransaction = async (transactionHash) => {
  try {
    const provider = getProvider();
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return {
        exists: false,
        confirmed: false,
        blockNumber: null,
        status: null,
        message: 'Transaction not found on the blockchain',
        verified: false,
      };
    }

    // Check transaction status (1 = success, 0 = failure)
    const succeeded = receipt.status === 1;
    
    // Get block to check confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    // Check block exists
    let blockExists = false;
    try {
      const block = await provider.getBlock(receipt.blockNumber);
      blockExists = !!block;
    } catch (e) {
      blockExists = false;
    }

    return {
      exists: true,
      confirmed: succeeded && blockExists,
      blockNumber: Number(receipt.blockNumber),
      status: succeeded ? 'success' : 'failed',
      confirmations: Math.max(0, confirmations),
      blockExists,
      timestamp: null, // Will be filled in by getBlock
      message: succeeded 
        ? `Transaction confirmed in block #${receipt.blockNumber}`
        : 'Transaction failed',
      verified: succeeded && blockExists,
    };
  } catch (error) {
    console.error('[BlockchainVerification] Error verifying transaction:', error);
    return {
      exists: false,
      confirmed: false,
      blockNumber: null,
      status: 'error',
      message: `Verification error: ${error.message || 'Unknown error'}`,
      verified: false,
    };
  }
};

/**
 * Get detailed block information for a transaction
 * @param {string} transactionHash - Transaction hash
 * @returns {Promise<Object>} - Block info
 */
export const getBlockInfo = async (transactionHash) => {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) return null;

    const block = await provider.getBlock(receipt.blockNumber);
    
    return {
      blockNumber: Number(receipt.blockNumber),
      timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed?.toString(),
      transactionIndex: receipt.index,
    };
  } catch (error) {
    console.error('[BlockchainVerification] Error getting block info:', error);
    return null;
  }
};

/**
 * Verify that the election contract is valid and active
 * @param {ethers.Contract} contract - The contract instance (optional, uses RPC if not provided)
 * @returns {Promise<Object>} - Election state
 */
export const verifyElectionState = async (contract) => {
  try {
    let electionStarted, electionEnded, admin;
    
    if (contract) {
      // Use provided contract instance
      [electionStarted, electionEnded, admin] = await Promise.all([
        contract.electionStarted(),
        contract.electionEnded(),
        contract.admin(),
      ]);
    } else {
      // Fall back to RPC provider
      const provider = getProvider();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      [electionStarted, electionEnded, admin] = await Promise.all([
        contractInstance.electionStarted(),
        contractInstance.electionEnded(),
        contractInstance.admin(),
      ]);
    }

    return {
      electionStarted: Boolean(electionStarted),
      electionEnded: Boolean(electionEnded),
      adminAddress: admin,
      isValid: true,
      message: electionEnded 
        ? 'Election has been finalized'
        : electionStarted 
          ? 'Election is active'
          : 'Election has not started',
    };
  } catch (error) {
    console.error('[BlockchainVerification] Error verifying election state:', error);
    return {
      electionStarted: false,
      electionEnded: false,
      adminAddress: null,
      isValid: false,
      message: 'Unable to verify election state',
    };
  }
};

/**
 * Verify a vote is included in the election tally
 * Checks the contract to see if the voter's address has voted (without revealing candidate)
 * @param {ethers.Contract} contract - Contract instance
 * @param {string} walletAddress - Voter's wallet address
 * @returns {Promise<Object>} - Verification result
 */
export const verifyVoteInTally = async (contract, walletAddress) => {
  try {
    if (!contract) {
      const provider = getProvider();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }

    // Check if voter is registered (which means they voted in this system)
    const isRegistered = await contract.registeredVoters(walletAddress);
    
    if (!isRegistered) {
      return {
        included: false,
        message: 'Voter record not found in the election tally',
        verified: false,
      };
    }

    // Check election state
    const [electionStarted, electionEnded] = await Promise.all([
      contract.electionStarted(),
      contract.electionEnded(),
    ]);

    if (electionEnded) {
      return {
        included: true,
        finalized: true,
        message: 'Your vote was successfully counted in the official election results.',
        verified: true,
      };
    }

    return {
      included: true,
      finalized: false,
      message: 'Your vote is recorded. The election is still ongoing.',
      verified: true,
    };
  } catch (error) {
    console.error('[BlockchainVerification] Error verifying vote in tally:', error);
    return {
      included: false,
      message: 'Unable to verify vote in tally',
      verified: false,
    };
  }
};

/**
 * Perform complete blockchain verification for a vote
 * @param {Object} params
 * @param {string} params.transactionHash - Transaction hash
 * @param {string} params.walletAddress - Voter's wallet address
 * @param {ethers.Contract} params.contract - Contract instance (optional)
 * @returns {Promise<Object>} - Complete verification result
 */
export const fullBlockchainVerification = async ({ transactionHash, walletAddress, contract }) => {
  const results = {
    transaction: null,
    blockInfo: null,
    electionState: null,
    tallyInclusion: null,
    overall: false,
    timestamp: new Date().toISOString(),
  };

  // Step 1: Verify transaction
  results.transaction = await verifyTransaction(transactionHash);
  
  if (results.transaction.exists && results.transaction.confirmed) {
    // Step 2: Get block info
    results.blockInfo = await getBlockInfo(transactionHash);
  }

  // Step 3: Verify election state
  results.electionState = await verifyElectionState(contract);

  // Step 4: Verify vote in tally (if wallet address provided)
  if (walletAddress) {
    results.tallyInclusion = await verifyVoteInTally(contract, walletAddress);
  }

  // Overall verification
  results.overall = (
    results.transaction?.verified === true &&
    (results.tallyInclusion?.verified === true || !walletAddress)
  );

  return results;
};

export default {
  verifyTransaction,
  getBlockInfo,
  verifyElectionState,
  verifyVoteInTally,
  fullBlockchainVerification,
};