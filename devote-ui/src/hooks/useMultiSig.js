/**
 * useMultiSig - Multi-Signature Election Control Hook
 * Professional National-Grade Election Management Platform
 * 
 * This hook provides multi-signature functionality including:
 * - Creating multi-sig proposals for critical actions
 * - Approving/rejecting proposals
 * - Monitoring proposal status
 * - Executing approved proposals
 */

import { useState, useEffect, useCallback } from 'react';
import { MULTISIG_ACTION_TYPES, MULTISIG_ACTION_NAMES, ROLE_NAMES, ROLES, VALIDATION } from '../config';
import serializeBigInt from '../utils/serializeBigInt';

const useMultiSig = (contract, account, userRole) => {
  const [proposals, setProposals] = useState([]);
  const [totalProposals, setTotalProposals] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(3);

  // Parse proposal from contract
  const parseProposal = useCallback((proposal) => {
    const actionTypeIndex = Number(proposal.actionType);
    
    return {
      id: Number(proposal.id),
      actionType: actionTypeIndex,
      actionName: MULTISIG_ACTION_NAMES[actionTypeIndex] || 'Unknown',
      proposer: proposal.proposer,
      requiredApprovals: Number(proposal.requiredApprovals),
      approvalCount: Number(proposal.approvalCount),
      executed: proposal.executed,
      rejected: proposal.rejected,
      createdAt: Number(proposal.createdAt),
      expiresAt: Number(proposal.expiresAt),
      data: proposal.data,
      // Computed fields
      isPending: !proposal.executed && !proposal.rejected && Number(proposal.expiresAt) > Math.floor(Date.now() / 1000),
      isExpired: Number(proposal.expiresAt) <= Math.floor(Date.now() / 1000) && !proposal.executed,
      approvalProgress: Number(proposal.requiredApprovals) > 0 
        ? (Number(proposal.approvalCount) / Number(proposal.requiredApprovals)) * 100 
        : 0,
    };
  }, []);


  // Format time remaining
  const getTimeRemaining = useCallback((expiresAt) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, []);

  // Fetch all proposals
  const fetchProposals = useCallback(async () => {
    if (!contract) {
      setProposals([]);
      setTotalProposals(0);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const count = await contract.multiSigProposalCount();
      const total = Number(count);
      setTotalProposals(total);

      if (total === 0) {
        setProposals([]);
        setIsLoading(false);
        return;
      }

      // Fetch all proposals
      const fetchedProposals = [];
      for (let i = 1; i <= total; i++) {
        try {
          const proposal = await contract.multiSigProposals(i);
          fetchedProposals.push(parseProposal(proposal));
        } catch (err) {
          console.error('[useMultiSig] Error fetching proposal', i, err);
        }
      }

      // Sort by most recent first
      fetchedProposals.sort((a, b) => b.createdAt - a.createdAt);
      
      setProposals(fetchedProposals);

      // Fetch threshold
      const thresholdValue = await contract.multiSigThreshold();
      setThreshold(Number(thresholdValue));
    } catch (err) {
      console.error('[useMultiSig] Error fetching proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [contract, parseProposal]);

  // Create a new multi-sig proposal
  const createProposal = useCallback(async (actionType, data = '0x') => {
    if (!contract) throw new Error('Contract not connected');
    
    // Check if user has permission to create proposals
    if (userRole < ROLES.NATIONAL_ELECTION_COMMISIONER) {
      throw new Error('Insufficient permissions to create proposals');
    }

    setIsLoading(true);
    setError('');

    try {
      const tx = await contract.createMultiSigProposal(actionType, data);
      await tx.wait();
      
      await fetchProposals();
      
      return { success: true };
    } catch (err) {
      console.error('[useMultiSig] Error creating proposal:', err);
      setError(err.reason || err.message || 'Failed to create proposal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, userRole, fetchProposals]);

  // Approve a proposal
  const approveProposal = useCallback(async (proposalId) => {
    if (!contract) throw new Error('Contract not connected');
    
    // Check if user has permission to approve
    if (userRole < ROLES.NATIONAL_ELECTION_COMMISIONER) {
      throw new Error('Insufficient permissions to approve proposals');
    }

    setIsLoading(true);
    setError('');

    try {
      const tx = await contract.approveMultiSigProposal(proposalId);
      await tx.wait();
      
      await fetchProposals();
      
      return { success: true };
    } catch (err) {
      console.error('[useMultiSig] Error approving proposal:', err);
      setError(err.reason || err.message || 'Failed to approve proposal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, userRole, fetchProposals]);

  // Get pending proposals for current user to approve
  const getPendingApprovals = useCallback(() => {
    return proposals.filter(p => p.isPending && !p.executed);
  }, [proposals]);

  // Get proposals by status
  const getProposalsByStatus = useCallback((status) => {
    switch (status) {
      case 'pending':
        return proposals.filter(p => p.isPending);
      case 'executed':
        return proposals.filter(p => p.executed);
      case 'expired':
        return proposals.filter(p => p.isExpired);
      case 'all':
      default:
        return proposals;
    }
  }, [proposals]);

  // Get proposals by action type
  const getProposalsByActionType = useCallback((actionType) => {
    return proposals.filter(p => p.actionType === actionType);
  }, [proposals]);

  // Check if current user can approve a specific proposal
  const canApprove = useCallback((proposal) => {
    if (!proposal || !proposal.isPending) return false;
    if (userRole < ROLES.NATIONAL_ELECTION_COMMISIONER) return false;
    if (!account) return false;
    
    // Cannot approve own proposal
    if (proposal.proposer.toLowerCase() === account.toLowerCase()) return false;
    
    return true;
  }, [userRole, account]);

  // Get multi-sig statistics
  const getMultiSigStats = useCallback(() => {
    const stats = {
      total: proposals.length,
      pending: proposals.filter(p => p.isPending).length,
      executed: proposals.filter(p => p.executed).length,
      expired: proposals.filter(p => p.isExpired).length,
      byActionType: {},
      threshold: threshold,
    };

    proposals.forEach(p => {
      stats.byActionType[p.actionName] = (stats.byActionType[p.actionName] || 0) + 1;
    });

    return stats;
  }, [proposals, threshold]);

  // Refresh on mount and account change
  useEffect(() => {
    fetchProposals();
  }, [contract, fetchProposals]);

  return {
    // State
    proposals,
    totalProposals,
    isLoading,
    error,
    threshold,

    // Methods
    fetchProposals,
    createProposal,
    approveProposal,
    getPendingApprovals,
    getProposalsByStatus,
    getProposalsByActionType,
    canApprove,
    getMultiSigStats,
    getTimeRemaining,

    // Constants
    MULTISIG_ACTION_TYPES,
    MULTISIG_ACTION_NAMES,
    VALIDATION,
  };
};

export default useMultiSig;