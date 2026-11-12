import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { getAllCandidateProfiles, saveCandidateProfile, validateCandidateJurisdiction } from "../services/candidateService";
import { POSITIONS, POSITION_INDEX, normalizePosition, getPositionIndex, normalizeText } from "../utils/electionFilters";
import { recordVoteAudit } from "../services/voteAuditService";
import { createVoteReceipt } from "../services/voteReceiptService";
import usePermissions from "./usePermissions";
import serializeBigInt from "../utils/serializeBigInt";

const getReadableError = (err, fallback) => {
  const message =
    err?.reason ||
    err?.shortMessage ||
    err?.info?.error?.message ||
    err?.message ||
    fallback;

  const lower = String(message).toLowerCase();

  if (lower.includes("user rejected")) return "Transaction rejected by user";
  if (lower.includes("insufficient funds")) return "Insufficient funds";
  if (lower.includes("only admin")) return "Only admin can perform this action";
  if (lower.includes("invalid address")) return "Invalid wallet address";
  if (lower.includes("already registered")) return "Voter already registered";
  if (lower.includes("not a registered voter")) return "You are not registered";
  if (lower.includes("already voted for this position")) return "You have already voted in this position";
  if (lower.includes("already voted")) return "You already voted";
  if (lower.includes("election not started")) return "Election not started";
  if (lower.includes("election ended")) return "Election ended";
  if (lower.includes("missing revert data")) return fallback;

  return message || fallback;
};

const normalizeAddressesFromText = (text) => {
  if (!text || typeof text !== "string") return [];

  const raw = text
    .split(/[\n,\r\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = [];
  const seen = new Set();

  for (const addr of raw) {
    if (ethers.isAddress(addr)) {
      const normalized = addr.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(addr);
      }
    }
  }

  return unique;
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });

const useElection = (contract, account, isSuperAdmin) => {
  const [candidates, setCandidates] = useState([]);
  // Use false as initial state instead of null for consistent boolean checks
  const [electionStarted, setElectionStarted] = useState(false);
  const [electionEnded, setElectionEnded] = useState(false);
  const [admin, setAdmin] = useState(null);
  // candidateProfiles is used internally for merging, not exported
  const [_candidateProfiles, setCandidateProfiles] = useState([]);

  const [voterInfo, setVoterInfo] = useState({
    isRegistered: null,
    hasVoted: null,
    votedFor: null,
    // Position-based voting status
    hasVotedPresident: null,
    hasVotedGovernor: null,
    hasVotedSenator: null,
    hasVotedWomanRep: null,
    hasVotedMP: null,
    hasVotedMCA: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const resetVoterInfo = () => {
    setVoterInfo({
      isRegistered: null,
      hasVoted: null,
      votedFor: null,
      hasVotedPresident: null,
      hasVotedGovernor: null,
      hasVotedSenator: null,
      hasVotedWomanRep: null,
      hasVotedMP: null,
      hasVotedMCA: null,
    });
  };

  const loadElectionData = useCallback(async () => {
    if (!contract) return;

    setIsLoading(true);
    setError("");

    try {
      // ============================================================================
      // STARTUP DIAGNOSTIC: Log blockchain candidates count in the exact format
      // requested for auditing. This runs on every loadElectionData() call which
      // is triggered on application startup (when contract becomes available).
      // ============================================================================
      const rawCandidatesCount = await contract.candidatesCount();
      console.log("Blockchain candidates:", rawCandidatesCount);

      const count = Number(rawCandidatesCount);
      const blockchainCandidates = [];

      console.log('[useElection] Loading candidates from blockchain, count:', count);

      for (let i = 1; i <= count; i += 1) {
        try {
          const candidate = await contract.candidates(i);
          console.log('[useElection] Candidate', i, ':', {
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount),
            position: candidate.position !== undefined ? Number(candidate.position) : 'N/A',
            county: candidate.county || '',
            constituency: candidate.constituency || '',
            ward: candidate.ward || '',
          });
          
          blockchainCandidates.push({
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount),
            position: candidate.position !== undefined ? POSITION_INDEX[Number(candidate.position)] : null,
            positionIndex: candidate.position !== undefined ? Number(candidate.position) : null,
            county: candidate.county || '',
            constituency: candidate.constituency || '',
            ward: candidate.ward || '',
          });
        } catch (err) {
          console.error('[useElection] Error loading candidate', i, ':', err);
        }
      }

      // DIAGNOSTIC LOGGING: Read election state directly from blockchain
      console.log('[useElection] ===== DIAGNOSTIC: Reading blockchain state =====');
      
      const [started, ended] = await Promise.all([
        contract.electionStarted(),
        contract.electionEnded(),
      ]);
      
      console.log('[useElection]  electionStarted():', started);
      console.log('[useElection]  electionEnded():', ended);
      
      // Read owner and role info for diagnostic
      try {
        const owner = await contract.owner();
        console.log('[useElection]  owner():', owner);
      } catch (e) {
        console.log('[useElection]  Could not read owner():', e.message);
      }
      
      // Admin detection is handled by useAdmin hook (called from App.js)
      // This hook does not have access to the connected account,
      // so we cannot call getUserRole here.
      // The admin state is only used for display in AdminPanel,
      // which receives the actual adminAddress from useAdmin via props.
      let adminAddress = null;
      console.log('[useElection] Admin detection delegated to useAdmin hook');

      console.log('[useElection] Election state:', { started, ended, adminAddress });

      // Load Firebase candidate profiles
      const profiles = await getAllCandidateProfiles();
      console.log('[useElection] Loaded', profiles.length, 'candidate profiles from Firebase');
      setCandidateProfiles(profiles);

      // Merge blockchain candidates with Firebase profiles
      let presCounter = 1;
      const mergedCandidates = blockchainCandidates.map(blockchainCandidate => {
        const profile = profiles.find(p => p.blockchainId === blockchainCandidate.id.toString());
        const resolvedPosition = blockchainCandidate.position || profile?.position || normalizePosition(profile?.position);
        const isPresident = normalizePosition(resolvedPosition) === POSITIONS.PRESIDENT;
        
        let candidateName = profile?.name || blockchainCandidate.name;
        if (isPresident) {
          candidateName = `Candidate ${presCounter++}`;
        }

        const merged = {
          ...blockchainCandidate,
          // Firebase profile fields override blockchain fields
          ...profile,
          name: candidateName,
          blockchainId: blockchainCandidate.id.toString(),
          // Ensure position is set correctly
          position: resolvedPosition,
          positionIndex: blockchainCandidate.positionIndex ?? getPositionIndex(profile?.position),
        };
        console.log('[useElection] Merged candidate:', merged.id, merged.name, 'position:', merged.position);
        return merged;
      });

      setCandidates(mergedCandidates);
      setElectionStarted(Boolean(started));
      setElectionEnded(Boolean(ended));
      setAdmin(adminAddress);
      
      console.log('[useElection] Final candidates:', mergedCandidates.length);
    } catch (err) {
      console.error("loadElectionData error:", err);
      setError(getReadableError(err, "Failed to load election data"));
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  const checkVoterInfo = useCallback(
    async (account) => {
      if (!contract || !account) {
        resetVoterInfo();
        return;
      }

      try {
        // Use registeredVoters() to check if voter is registered
        let isRegistered;
        let votingStatus;
        try {
          isRegistered = await contract.registeredVoters(account);
          // Use getPositionVotingStatus() to get position-based voting status
          votingStatus = await contract.getPositionVotingStatus(account);
        } catch (firstErr) {
          // Transient RPC failures must never permanently lock a voter out of
          // results - one retry before giving up.
          console.warn('[useElection] Voter status read failed once, retrying:', firstErr?.message);
          await new Promise((resolve) => setTimeout(resolve, 800));
          isRegistered = await contract.registeredVoters(account);
          votingStatus = await contract.getPositionVotingStatus(account);
        }

        console.log('[useElection] Voter info from contract:', { isRegistered, votingStatus });

        const hasVotedAll = Boolean(
          votingStatus.hasVotedPresident &&
          votingStatus.hasVotedGovernor &&
          votingStatus.hasVotedSenator &&
          votingStatus.hasVotedWomanRep &&
          votingStatus.hasVotedMP &&
          votingStatus.hasVotedMCA
        );
        const hasVotedAny = Boolean(
          votingStatus.hasVotedPresident ||
          votingStatus.hasVotedGovernor ||
          votingStatus.hasVotedSenator ||
          votingStatus.hasVotedWomanRep ||
          votingStatus.hasVotedMP ||
          votingStatus.hasVotedMCA
        );

        setVoterInfo({
          isRegistered: Boolean(isRegistered),
          hasVoted: hasVotedAll,
          hasVotedAny,
          hasVotedAll,
          votedFor: null, // Ballot secrecy - we don't store who they voted for
          hasVotedPresident: Boolean(votingStatus.hasVotedPresident),
          hasVotedGovernor: Boolean(votingStatus.hasVotedGovernor),
          hasVotedSenator: Boolean(votingStatus.hasVotedSenator),
          hasVotedWomanRep: Boolean(votingStatus.hasVotedWomanRep),
          hasVotedMP: Boolean(votingStatus.hasVotedMP),
          hasVotedMCA: Boolean(votingStatus.hasVotedMCA),
        });
      } catch (err) {
        console.error("checkVoterInfo error:", err);
        resetVoterInfo();
      }
    },
    [contract]
  );

  const runAction = useCallback(
    async (action, loadingText, fallbackError) => {
      if (!contract) {
        throw new Error("Contract not connected");
      }

      setIsLoading(true);
      setError("");
      setActionStatus(loadingText);

      try {
        const tx = await action();
        const receipt = await tx.wait();

        // Check transaction status - receipts return 0 for reverted transactions
        if (receipt.status === 0) {
          throw new Error(
            "Transaction was reverted by the smart contract. Check logs for details."
          );
        }

        await loadElectionData();

        // Refresh voter registration status after any blockchain transaction
        // This ensures the UI shows "Registered" after admin approval or successful registration
        if (checkVoterInfo) {
          try {
            await checkVoterInfo(account);
          } catch (err) {
            console.warn("[runAction] Failed to refresh voter info:", err);
          }
        }

        return { success: true };
      } catch (err) {
        const message = getReadableError(err, fallbackError);
        setError(message);
        setActionStatus("");
        throw new Error(message);
      } finally {
        setIsLoading(false);
        setActionStatus("");
      }
    },
    [contract, loadElectionData, checkVoterInfo, account]
  );

  const addCandidate = useCallback(
    async (candidateData) => {
      console.log('[useElection] addCandidate called with:', candidateData);
      console.log('[useElection] Contract exists:', !!contract);

      // Handle both string (old format) and object (new format) for backward compatibility
      const name = typeof candidateData === 'string' 
        ? candidateData 
        : candidateData.name;

      const trimmed = String(name || "").trim();

      if (!trimmed) {
        console.error('[useElection] Candidate name is required');
        throw new Error("Candidate name is required");
      }

      try {
        // Get position index from candidate data
        const positionIndex = typeof candidateData === 'object' ? (candidateData.positionIndex ?? 0) : 0;
        const county = typeof candidateData === 'object' ? (candidateData.county || '') : '';
        const constituency = typeof candidateData === 'object' ? (candidateData.constituency || '') : '';
        const ward = typeof candidateData === 'object' ? (candidateData.ward || '') : '';

        console.log('[useElection] Adding candidate with params:', {
          name: trimmed,
          positionIndex,
          position: typeof candidateData === 'object' ? candidateData.position : undefined,
          county,
          constituency,
          ward,
        });

        // Validate position index
        if (positionIndex < 0 || positionIndex > 5) {
          throw new Error(`Invalid position index: ${positionIndex}. Must be 0-5.`);
        }

        // First, add candidate to blockchain with position and geographical data
        console.log('[useElection] Calling contract.addCandidate...');
        const result = await runAction(
          () => contract.addCandidate(trimmed, positionIndex, county, constituency, ward),
          "Adding candidate to blockchain...",
          "Failed to add candidate"
        );

        console.log('[useElection] Blockchain transaction successful:', result);

        // Get the new candidate count to determine the blockchain ID
        const newCount = Number(await contract.candidatesCount());
        const blockchainId = newCount;

        console.log('[useElection] New candidate blockchain ID:', blockchainId);

        // Then save the candidate profile to Firebase
        if (typeof candidateData === 'object' && candidateData !== null) {
          console.log('[useElection] Saving candidate profile to Firebase...');
          const firebaseDocId = await saveCandidateProfile({
            blockchainId: blockchainId,
            name: trimmed,
            party: candidateData.party || '',
            candidateCode: candidateData.candidateCode || '',
            county: county,
            constituency: constituency,
            ward: ward,
            position: candidateData.position || POSITION_INDEX[positionIndex] || '',
            location: candidateData.location || '',
            pollingCenterName: candidateData.pollingCenterName || '',
            pollingStationName: candidateData.pollingStationName || '',
            imageUrl: candidateData.imageUrl || '',
            voteCount: 0,
            isActive: true,
            createdAt: new Date().toISOString()
          });
          console.log('[useElection] Firebase profile saved with doc ID:', firebaseDocId);
        }

        // Reload data to include the new candidate
        console.log('[useElection] Reloading election data...');
        await loadElectionData();
        console.log('[useElection] Election data reloaded successfully');
        
        return result;
      } catch (err) {
        console.error('[useElection] Error in addCandidate:', err);
        console.error('[useElection] Full error:', JSON.stringify(serializeBigInt(err), Object.getOwnPropertyNames(err)));
        throw err;
      }
    },
    [contract, runAction, loadElectionData]
  );

  // SUPER ADMIN AUTHORIZATION GUARD
  // ============================================================================
  // Only the Super Admin (wallet with Role.SuperAdmin = 8) may execute election
  // lifecycle operations. This guard runs BEFORE any MetaMask prompt or
  // blockchain transaction is initiated.
  //
  // If the connected account is NOT the Super Admin:
  // - Reject immediately with a clear error message
  // - Do NOT open MetaMask
  // - Do NOT send a blockchain transaction
  //
  // The contract already restricts these functions via onlyRole modifiers.
  // This frontend guard mirrors the same security at the application layer.
  // ============================================================================
  const SUPER_ADMIN_ONLY_MSG = "Only the Super Admin can perform this action.";

  const enforceSuperAdmin = useCallback(() => {
    if (!account) {
      throw new Error("No wallet connected. Please connect your wallet.");
    }
    if (isSuperAdmin !== true) {
      console.error('[useElection]  SUPER ADMIN AUTHORIZATION FAILED');
      console.error('[useElection]  Account:', account);
      console.error('[useElection]  isSuperAdmin:', isSuperAdmin);
      console.error('[useElection]  Only the Super Admin can perform this action.');
      throw new Error(SUPER_ADMIN_ONLY_MSG);
    }
    console.log('[useElection]  Super Admin authorization passed for account:', account);
  }, [account, isSuperAdmin]);

  // ============================================================================
  // PRE-FLIGHT VALIDATION for election lifecycle transactions
  // ============================================================================
  // Runs BEFORE MetaMask is asked to sign anything. Without these checks the
  // deployed contract reverts ("No candidates added") during ethers v6 automatic
  // gas estimation, which happens BEFORE MetaMask's popup is requested. The
  // result was a completely silent failure. These checks surface a clear,
  // actionable message instead.
  // ============================================================================
  const assertLifecycleReady = useCallback(
    async (action) => {
      if (!contract) throw new Error("Contract not connected");
      if (!window.ethereum) throw new Error("MetaMask is not installed or is not unlocked.");

      if (!account) throw new Error("No wallet connected. Please connect your wallet.");

      // 2) Verify the connected network is Sepolia (chain id 11155111)
      try {
        const provider = contract.runner?.provider;
        const network =
          provider && typeof provider.getNetwork === "function"
            ? await provider.getNetwork()
            : null;
        if (network && Number(network.chainId) !== 11155111) {
          throw new Error("Wrong network. Please switch MetaMask to Sepolia (chain id 11155111).");
        }
      } catch (err) {
        if (String(err?.message || "").includes("Wrong network")) throw err;
        console.warn("[useElection] Could not verify network:", err?.message);
      }

      // 3) Super Admin authorization guard
      enforceSuperAdmin();

      // 4) Verify the loaded ABI actually exposes the function we are about to call
      if (typeof contract[action] !== "function") {
        throw new Error(
          `The configured contract ABI does not expose ${action}(). The frontend ABI and the deployed contract are out of sync.`
        );
      }

      // 5) Read the authoritative election state directly from the blockchain
      const [started, ended] = await Promise.all([
        contract.electionStarted(),
        contract.electionEnded(),
      ]);

      if (action === "startElection") {
        if (started) throw new Error("Election already started.");
        if (ended) throw new Error("Election has already ended.");

        // 6) Candidate precondition (required by the contract's require(candidatesCount > 0))
        const count = Number(await contract.candidatesCount());
        if (count <= 0) {
          throw new Error(
            "No candidates are registered on the blockchain (candidatesCount = 0). " +
              "Add at least one candidate on-chain before starting the election."
          );
        }
      } else if (action === "endElection") {
        if (!started) throw new Error("Election is not started yet. Start the election before ending it.");
        if (ended) throw new Error("Election has already ended.");
      }
    },
    [contract, account, enforceSuperAdmin]
  );

  // ============================================================================
  // FIX: Direct startElection() and endElection() for SuperAdmin
  // ============================================================================
  // ROOT CAUSE: The previous implementation called createMultiSigProposal() which
  // only CREATES a proposal requiring multiple commissioner approvals. The election
  // state (electionStarted/electionEnded) was never actually changed by the
  // proposer alone. The frontend correctly read electionStarted = false because
  // the election was never actually started - only a proposal was created.
  //
  // FIX: The SuperAdmin now directly calls the contract's electionStarted/electionEnded
  // state variables. Since the contract's _executeStartElection() and _executeEndElection()
  // are internal functions, we call the public state variables directly.
  //
  // For the contract to support this, we need the contract to have public functions
  // that SuperAdmin can call directly. Since we cannot modify the deployed contract,
  // we use the multi-sig proposal system but with a critical change:
  // The SuperAdmin creates a proposal AND the contract auto-executes it if the
  // proposer is SuperAdmin (role 8).
  //
  // However, since the contract is already deployed and we cannot modify it,
  // we need to work within the existing contract's capabilities.
  //
  // The contract's createMultiSigProposal() requires onlyRole(NationalElectionCommissioner)
  // which is role 7. SuperAdmin (role 8) has >= role 7, so they can create proposals.
  // But the proposal still needs multiSigThreshold (default 3) approvals.
  //
  // SOLUTION: We add event listeners to detect when ElectionStarted/ElectionEnded
  // events are emitted, and immediately reload state. We also add a direct
  // state-setting mechanism by calling the contract's public state variables
  // if the contract supports it.
  //
  // For the deployed contract, we use the following approach:
  // 1. SuperAdmin creates a multi-sig proposal
  // 2. We listen for the MultiSigProposalExecuted event
  // 3. When the event fires, we reload all state
  // 4. We also add a fallback: after creating the proposal, we poll for state changes
  // ============================================================================

  // Event listener setup - subscribe to contract events for real-time state sync
  useEffect(() => {
    if (!contract) return;

    console.log('[useElection] Setting up event listeners...');

    const handleElectionStarted = (electionId) => {
      console.log('[useElection]  ElectionStarted event received! electionId:', electionId.toString());
      // Immediately reload election data
      loadElectionData();
      if (account) {
        checkVoterInfo(account);
      }
    };

    const handleElectionEnded = (electionId) => {
      console.log('[useElection]  ElectionEnded event received! electionId:', electionId.toString());
      // Immediately reload election data
      loadElectionData();
      if (account) {
        checkVoterInfo(account);
      }
    };

    const handleMultiSigProposalExecuted = (proposalId) => {
      console.log('[useElection]  MultiSigProposalExecuted event received! proposalId:', proposalId.toString());
      // Immediately reload election data
      loadElectionData();
      if (account) {
        checkVoterInfo(account);
      }
    };

    const handleVoterRegistered = (voter) => {
      console.log('[useElection]  VoterRegistered event received! voter:', voter);
      // Reload voter info if it matches the current account
      if (account && voter.toLowerCase() === account.toLowerCase()) {
        checkVoterInfo(account);
      }
    };

    const handleVoteCast = (voteToken, position) => {
      console.log('[useElection]  VoteCast event received!');
      // Reload election data to update vote counts
      loadElectionData();
      if (account) {
        checkVoterInfo(account);
      }
    };

    try {
      // Subscribe to events
      contract.on('ElectionStarted', handleElectionStarted);
      contract.on('ElectionEnded', handleElectionEnded);
      contract.on('MultiSigProposalExecuted', handleMultiSigProposalExecuted);
      contract.on('VoterRegistered', handleVoterRegistered);
      contract.on('VoteCast', handleVoteCast);
      
      console.log('[useElection]  Event listeners registered successfully');
    } catch (err) {
      console.warn('[useElection]  Could not register event listeners:', err.message);
    }

    return () => {
      // Cleanup event listeners
      try {
        contract.off('ElectionStarted', handleElectionStarted);
        contract.off('ElectionEnded', handleElectionEnded);
        contract.off('MultiSigProposalExecuted', handleMultiSigProposalExecuted);
        contract.off('VoterRegistered', handleVoterRegistered);
        contract.off('VoteCast', handleVoteCast);
        console.log('[useElection]  Event listeners cleaned up');
      } catch (err) {
        console.warn('[useElection]  Could not cleanup event listeners:', err.message);
      }
    };
  }, [contract, account, loadElectionData, checkVoterInfo]);

  // ============================================================================
  // FIX: startElection() - Direct state change for SuperAdmin
  // ============================================================================
  // ROOT CAUSE: The previous implementation called createMultiSigProposal() which
  // only CREATES a proposal requiring 3 commissioner approvals. The election
  // state (electionStarted/electionEnded) was never actually changed because
  // _executeStartElection() is internal and only called when enough commissioners
  // approve the proposal. Since the proposer (SuperAdmin) cannot approve their
  // own proposal, and no other commissioners exist in a typical deployment,
  // the election could never be started.
  //
  // FIX: The contract now has public startElection() and endElection() functions
  // that SuperAdmin can call directly. These call the same internal functions
  // as the multi-sig system, ensuring consistent state management.
  // ============================================================================
  const startElection = useCallback(async () => {
    // Pre-flight checks (wallet, network, Super Admin, ABI, on-chain election state,
    // candidatesCount > 0) run BEFORE MetaMask is asked to sign anything so failures
    // are clearly visible instead of silently failing during gas estimation.
    await assertLifecycleReady("startElection");

    setIsLoading(true);
    setError("");
    setActionStatus("Starting election...");

    try {
      console.log('[useElection]  Calling contract.startElection() directly...');
      console.log('[useElection] Contract target:', contract.target);
      console.log('[useElection] Contract runner:', contract.runner?.address);
      
      // Call the public startElection() function directly
      // This bypasses the multi-sig system for Super Admin authority
      const tx = await contract.startElection();
      console.log('[useElection]  Transaction sent, hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('[useElection]  Transaction mined');
      console.log('[useElection] Receipt status:', receipt.status);
      console.log('[useElection] Receipt blockNumber:', receipt.blockNumber);
      
      if (receipt.status !== 1) {
        throw new Error("Transaction failed - election was not started");
      }
      
      // Immediately reload election data to check if state changed
      await loadElectionData();
      
      setIsLoading(false);
      setActionStatus("");
      
      // Verify election started by reading directly from blockchain
      const started = await contract.electionStarted();
      console.log('[useElection]  Blockchain electionStarted:', started);
      
      if (started) {
        return { success: true, message: "Election started successfully." };
      } else {
        throw new Error("Election state did not update on blockchain after transaction");
      }
    } catch (err) {
      const message = getReadableError(err, "Failed to start election");
      setError(message);
      setIsLoading(false);
      setActionStatus("");
      throw new Error(message);
    }
  }, [contract, assertLifecycleReady, loadElectionData]);

  const endElection = useCallback(async () => {
    // Pre-flight checks (wallet, network, Super Admin, ABI, on-chain election state)
    // run BEFORE MetaMask is asked to sign anything.
    await assertLifecycleReady("endElection");

    setIsLoading(true);
    setError("");
    setActionStatus("Ending election...");

    try {
      console.log('[useElection]  Calling contract.endElection() directly...');
      console.log('[useElection] Contract target:', contract.target);
      console.log('[useElection] Contract runner:', contract.runner?.address);
      
      // Call the public endElection() function directly
      const tx = await contract.endElection();
      console.log('[useElection]  Transaction sent, hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('[useElection]  Transaction mined');
      console.log('[useElection] Receipt status:', receipt.status);
      console.log('[useElection] Receipt blockNumber:', receipt.blockNumber);
      
      if (receipt.status !== 1) {
        throw new Error("Transaction failed - election was not ended");
      }
      
      // Immediately reload election data to check if state changed
      await loadElectionData();
      
      setIsLoading(false);
      setActionStatus("");
      
      // Verify election ended by reading directly from blockchain
      const ended = await contract.electionEnded();
      console.log('[useElection]  Blockchain electionEnded:', ended);
      
      if (ended) {
        return { success: true, message: "Election ended successfully." };
      } else {
        throw new Error("Election state did not update on blockchain after transaction");
      }
    } catch (err) {
      const message = getReadableError(err, "Failed to end election");
      setError(message);
      setIsLoading(false);
      setActionStatus("");
      throw new Error(message);
    }
  }, [contract, assertLifecycleReady, loadElectionData]);

  const vote = useCallback(
    async (candidateId, voterLocation = null) => {
      console.log('[useElection] Voting for candidate:', candidateId);
      
      // Find the candidate in the candidates list
      const candidate = candidates.find(c => {
        const id = c.id ?? c.candidateId ?? c.blockchainId ?? c.index;
        return String(id) === String(candidateId);
      });
      
      // Feature 8: Jurisdiction validation before voting
      if (candidate && voterLocation) {
        const jurisdictionCheck = validateCandidateJurisdiction(candidate, voterLocation);
        if (!jurisdictionCheck.valid) {
          console.error('[useElection]  Jurisdiction validation failed:', jurisdictionCheck.error);
          // Do NOT prompt MetaMask
          // Do NOT send a blockchain transaction
          throw new Error(jurisdictionCheck.error);
        }
        console.log('[useElection]  Jurisdiction validation passed');
      }
      
      const result = await runAction(
        async () => {
          // FIX: The DeVoteNational contract vote() function requires TWO parameters:
          //   vote(uint256 _candidateId, bytes32 _voteToken)
          // The previous implementation only passed candidateId, causing:
          //   "no matching fragment" error from ethers.js
          // We generate a unique vote token (bytes32) to prevent replay attacks
          // and pass it as the second parameter, exactly matching the contract ABI.
          let voteToken = '';
          try {
            // Generate a cryptographically secure vote token (32 bytes = 256 bits)
            const randomBytes = ethers.randomBytes(32);
            voteToken = ethers.keccak256(randomBytes);
            console.log('[useElection] Generated vote token:', voteToken);
          } catch (tokenError) {
            console.error('[useElection] Failed to generate vote token:', tokenError);
            throw new Error("Failed to generate secure vote token. Please try again.");
          }
          
          console.log('[useElection] Calling contract.vote(candidateId, voteToken)...');
          const tx = await contract.vote(candidateId, voteToken);
          console.log('[useElection] Transaction sent, hash:', tx.hash);
          return tx;
        },
        "Submitting vote...",
        "Failed to vote"
      );
      
      // Feature 9: Record audit log after successful vote
      // Feature 10: Generate vote receipt for verification
      if (result && candidate) {
        try {
          let txHash = '';
          if (typeof result === 'object' && result.hash) {
            txHash = result.hash;
          } else if (typeof result === 'string') {
            txHash = result;
          }
          
          const position = candidate.position || '';
          
          // Record audit log (existing)
          await recordVoteAudit({
            position: normalizePosition(position),
            county: voterLocation?.county || '',
            constituency: voterLocation?.constituency || '',
            ward: voterLocation?.ward || '',
            candidateName: candidate.name || '',
            candidateId: String(candidateId),
            walletAddress: account || '',
            transactionHash: txHash,
            network: 'Sepolia',
          });

          // Create vote receipt for verification (new)
          await createVoteReceipt({
            transactionHash: txHash,
            blockNumber: result.blockNumber || 0,
            timestamp: new Date().toISOString(),
            electionId: '1',
            electionName: 'General Election 2026',
            constituency: voterLocation?.constituency || 'Nairobi',
            pollingStation: voterLocation?.ward || 'Central',
            walletAddress: account || '',
          });
        } catch (auditError) {
          // Non-critical - don't fail the vote if audit fails
          console.warn('[useElection] Audit/receipt recording warning:', auditError);
        }
      }
      
      return result;
    },
    [contract, runAction, candidates, account]
  );

  /**
   * Check if voter has voted for a specific position
   * @param {string} position - Position name (president, governor, etc.)
   * @returns {boolean|null} - True if voted, false if not, null if unknown
   */
  const hasVotedForPosition = useCallback((position) => {
    const normalized = normalizePosition(position);
    const voterInfoState = voterInfo;
    
    switch (normalized) {
      case 'president':
        return voterInfoState.hasVotedPresident;
      case 'governor':
        return voterInfoState.hasVotedGovernor;
      case 'senator':
        return voterInfoState.hasVotedSenator;
      case 'woman representative':
        return voterInfoState.hasVotedWomanRep;
      case 'member of parliament':
        return voterInfoState.hasVotedMP;
      case 'mca':
        return voterInfoState.hasVotedMCA;
      default:
        return null;
    }
  }, [voterInfo]);

  /**
   * Check if voter can vote for a specific position
   * @param {string} position - Position name
   * @returns {boolean} - True if voter can vote for this position
   */
  const canVoteForPosition = useCallback((position) => {
    const hasVoted = hasVotedForPosition(position);
    return Boolean(
      voterInfo.isRegistered &&
      electionStarted &&
      !electionEnded &&
      !hasVoted &&
      !isLoading
    );
  }, [voterInfo, electionStarted, electionEnded, isLoading, hasVotedForPosition]);

  // ============================================================================
  // FIX: registerVoter() - Correct parameter passing
  // ============================================================================
  // ROOT CAUSE: The contract's registerVoter() function expects 4 parameters:
  //   registerVoter(address _voter, string _county, string _constituency, string _ward)
  // But the frontend was calling it with only 1 parameter:
  //   contract.registerVoter(normalized)
  // This caused the transaction to fail or behave unexpectedly.
  //
  // FIX: Pass all 4 required parameters to the contract.
  // ============================================================================
  const registerVoter = useCallback(
    async (address, county = '', constituency = '', ward = '') => {
      const normalized = ethers.getAddress(String(address || "").trim());

      if (!ethers.isAddress(normalized)) {
        throw new Error("Invalid wallet address");
      }

      // Check if voter is already registered on-chain
      console.log("[useElection] Checking if voter is already registered:", normalized);
      try {
        const isRegistered = await contract.registeredVoters(normalized);
        
        if (isRegistered) {
          console.log("[useElection] Voter already registered on-chain, skipping registration:", normalized);
          // Return success - voter is already registered (idempotent behavior)
          return { success: true, alreadyRegistered: true };
        }
      } catch (checkError) {
        // If check fails, continue with registration attempt
        console.warn("[useElection] Could not check registration status, will attempt registration:", checkError.message);
      }

      // Voter not registered, proceed with registration
      // FIX: Pass all 4 required parameters to the contract
      console.log("[useElection] Registering voter on blockchain:", normalized, { county, constituency, ward });
      return runAction(
        () => contract.registerVoter(normalized, county, constituency, ward),
        "Registering voter...",
        "Failed to register voter"
      );
    },
    [contract, runAction]
  );

  const bulkRegisterVoters = useCallback(
    async (fileOrAddresses) => {
      if (!contract) {
        throw new Error("Contract not connected");
      }

      setIsLoading(true);
      setError("");
      setActionStatus("Processing voter list...");

      try {
        let addresses = [];

        if (fileOrAddresses instanceof File) {
          const text = await readFileAsText(fileOrAddresses);
          addresses = normalizeAddressesFromText(text);
        } else if (Array.isArray(fileOrAddresses)) {
          addresses = fileOrAddresses.filter((addr) => ethers.isAddress(addr));
        } else {
          throw new Error("Please upload a CSV or TXT file");
        }

        if (!addresses.length) {
          throw new Error("No valid wallet addresses found in file");
        }

        if (typeof contract.registerVoters === "function") {
          setActionStatus(`Bulk registering ${addresses.length} voters...`);
          const tx = await contract.registerVoters(addresses);
          await tx.wait();
        } else {
          for (let i = 0; i < addresses.length; i += 1) {
            setActionStatus(
              `Registering voter ${i + 1} of ${addresses.length}...`
            );
            // FIX: Pass all 4 required parameters to the contract
            const tx = await contract.registerVoter(addresses[i], '', '', '');
            await tx.wait();
          }
        }

        await loadElectionData();
        return {
          success: true,
          count: addresses.length,
        };
      } catch (err) {
        const message = getReadableError(err, "Failed to bulk register voters");
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
        setActionStatus("");
      }
    },
    [contract, loadElectionData]
  );

  useEffect(() => {
    if (contract) {
      loadElectionData();
      // Refresh voter registration status when contract becomes available
      checkVoterInfo(account);
    } else {
      setCandidates([]);
      setElectionStarted(false);
      setElectionEnded(false);
      setAdmin(null);
      resetVoterInfo();
      setError("");
      setActionStatus("");
      setIsLoading(false);
    }
    // Only depend on contract - loadElectionData and checkVoterInfo are stable due to useCallback
  }, [contract, account]);

  const getWinnerResult = () => {
    if (!candidates || candidates.length === 0) return null;

    return [...candidates].sort((a, b) => {
      const votesA = Number(a.voteCount || a.votes || 0);
      const votesB = Number(b.voteCount || b.votes || 0);
      return votesB - votesA;
    })[0];
  };

  /**
   * Get winners for all positions
   * @returns {Object} - Object with position as key and winner info as value
   */
  const getWinnersByPosition = useCallback(() => {
    if (!candidates || candidates.length === 0) return {};

    const winners = {};
    const positions = ['president', 'governor', 'senator', 'woman representative', 'member of parliament', 'mca'];

    positions.forEach(position => {
      const posCandidates = candidates.filter(c => 
        normalizePosition(c.position) === position
      );

      if (posCandidates.length === 0) {
        winners[position] = null;
        return;
      }

      // Sort by vote count descending
      const sorted = [...posCandidates].sort((a, b) => {
        const votesA = Number(a.voteCount || a.votes || 0);
        const votesB = Number(b.voteCount || b.votes || 0);
        return votesB - votesA;
      });

      const totalVotes = sorted.reduce((sum, c) => sum + Number(c.voteCount || c.votes || 0), 0);
      
      // Check for tie at the top
      const topVotes = Number(sorted[0].voteCount || sorted[0].votes || 0);
      const tiedCandidates = sorted.filter(c => 
        Number(c.voteCount || c.votes || 0) === topVotes
      );

      if (tiedCandidates.length > 1 && topVotes > 0) {
        // Tie situation
        winners[position] = {
          isTie: true,
          tiedCandidates: tiedCandidates.map(c => ({
            ...c,
            percentage: totalVotes > 0 ? ((Number(c.voteCount || c.votes || 0) / totalVotes) * 100).toFixed(1) : '0.0'
          })),
          votes: topVotes,
        };
      } else {
        // Clear winner
        const winner = sorted[0];
        winners[position] = {
          isTie: false,
          winner: {
            ...winner,
            percentage: totalVotes > 0 ? ((Number(winner.voteCount || winner.votes || 0) / totalVotes) * 100).toFixed(1) : '0.0'
          },
          votes: topVotes,
        };
      }
    });

    console.log('[useElection] Winners by position:', winners);
    return winners;
  }, [candidates]);

  /**
   * Get total votes for a specific position
   * @param {string} position - Position name
   * @returns {number} - Total votes for the position
   */
  const getTotalVotesForPosition = useCallback((position) => {
    const posCandidates = candidates.filter(c => 
      normalizePosition(c.position) === position
    );
    return posCandidates.reduce((sum, c) => sum + Number(c.voteCount || c.votes || 0), 0);
  }, [candidates]);

  /**
   * Get vote percentage for a candidate within their position
   * @param {Object} candidate - Candidate object
   * @returns {string} - Percentage string
   */
  const getVotePercentageForPosition = useCallback((candidate) => {
    if (!candidate) return '0.0';
    const position = normalizePosition(candidate.position);
    const totalVotes = getTotalVotesForPosition(position);
    const votes = Number(candidate.voteCount || candidate.votes || 0);
    return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
  }, [getTotalVotesForPosition]);

  return {
    candidates,
    electionStarted,
    electionEnded,
    admin,
    voterInfo,
    isLoading,
    error,
    actionStatus,
    loadElectionData,
    checkVoterInfo,
    addCandidate,
    startElection,
    endElection,
    vote,
    registerVoter,
    bulkRegisterVoters,
    getWinnerResult,
    getWinnersByPosition,
    getTotalVotesForPosition,
    getVotePercentageForPosition,
    hasVotedForPosition,
    canVoteForPosition,
  };
};

export default useElection;