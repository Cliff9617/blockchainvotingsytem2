/**
 * useAuditTrail - National Audit Trail System Hook
 * Professional National-Grade Election Management Platform
 * 
 * This hook provides audit trail functionality including:
 * - Fetching audit logs with filtering
 * - Verifying audit chain integrity
 * - Real-time audit log monitoring
 * - Audit log export capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ACTION_TYPES, ACTION_TYPE_NAMES, ROLE_NAMES, ROLES } from '../config';
import serializeBigInt from '../utils/serializeBigInt';

const useAuditTrail = (contract, account) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChainValid, setIsChainValid] = useState(null);
  const [filters, setFilters] = useState({
    actionType: null, // null = all types
    startDate: null,
    endDate: null,
    county: '',
    constituency: '',
    ward: '',
    actorRole: null,
  });

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      full: date.toISOString(),
    };
  };

  // Parse audit log entry
  const parseAuditLog = useCallback((log) => {
    const actionTypeIndex = Number(log.actionType);
    const actorRoleIndex = Number(log.actorRole);
    
    return {
      id: Number(log.id),
      actionType: actionTypeIndex,
      actionName: ACTION_TYPE_NAMES[actionTypeIndex] || 'Unknown',
      actor: log.actor,
      actorRole: actorRoleIndex,
      actorRoleName: ROLE_NAMES[actorRoleIndex] || 'Unknown',
      timestamp: Number(log.timestamp),
      ...formatTimestamp(log.timestamp),
      county: log.county || '',
      constituency: log.constituency || '',
      ward: log.ward || '',
      entityHash: log.entityHash,
      metadata: log.metadata || '',
      previousHash: log.previousHash,
    };
  }, []);

  // Fetch audit logs with optional filtering
  const fetchAuditLogs = useCallback(async (options = {}) => {
    if (!contract) {
      setAuditLogs([]);
      setTotalLogs(0);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get total log count
      const count = await contract.auditLogCount();
      const total = Number(count);
      setTotalLogs(total);

      if (total === 0) {
        setAuditLogs([]);
        setIsLoading(false);
        return;
      }

      // Determine range to fetch
      const startId = options.startId || 1;
      const fetchCount = options.count || Math.min(50, total);
      const actionType = options.actionType !== undefined ? options.actionType : 0; // 0 = all (VoterRegistered is used as wildcard)

      console.log('[useAuditTrail] Fetching logs:', { startId, fetchCount, actionType });

      // Fetch logs from contract
      const logs = await contract.getAuditLogs(startId, fetchCount, actionType);
      
      const parsedLogs = logs.map(parseAuditLog);
      
      // Apply additional client-side filtering if needed
      let filteredLogs = parsedLogs;
      
      if (filters.county) {
        filteredLogs = filteredLogs.filter(log => 
          log.county.toLowerCase() === filters.county.toLowerCase()
        );
      }
      
      if (filters.constituency) {
        filteredLogs = filteredLogs.filter(log => 
          log.constituency.toLowerCase() === filters.constituency.toLowerCase()
        );
      }
      
      if (filters.ward) {
        filteredLogs = filteredLogs.filter(log => 
          log.ward.toLowerCase() === filters.ward.toLowerCase()
        );
      }
      
      if (filters.actorRole !== null) {
        filteredLogs = filteredLogs.filter(log => 
          log.actorRole === filters.actorRole
        );
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.full) >= startDate
        );
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.full) <= endDate
        );
      }

      setAuditLogs(filteredLogs);
    } catch (err) {
      console.error('[useAuditTrail] Error fetching audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [contract, filters, parseAuditLog]);

  // Verify audit chain integrity
  const verifyChainIntegrity = useCallback(async () => {
    if (!contract) {
      setIsChainValid(null);
      return;
    }

    try {
      const isValid = await contract.verifyAuditChain();
      setIsChainValid(isValid);
      console.log('[useAuditTrail] Chain integrity:', isValid ? 'VALID' : 'INVALID');
      return isValid;
    } catch (err) {
      console.error('[useAuditTrail] Error verifying chain:', err);
      setIsChainValid(false);
      return false;
    }
  }, [contract]);

  // Update filter and refetch
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      actionType: null,
      startDate: null,
      endDate: null,
      county: '',
      constituency: '',
      ward: '',
      actorRole: null,
    });
  }, []);

  // Export audit logs to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'ID',
      'Timestamp',
      'Action Type',
      'Actor',
      'Actor Role',
      'County',
      'Constituency',
      'Ward',
      'Entity Hash',
      'Metadata',
    ];

    const rows = auditLogs.map(log => [
      log.id,
      log.full,
      log.actionName,
      log.actor,
      log.actorRoleName,
      log.county,
      log.constituency,
      log.ward,
      log.entityHash,
      log.metadata,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [auditLogs]);

  // Export audit logs to JSON
  const exportToJSON = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: auditLogs.length,
      chainValid: isChainValid,
      logs: auditLogs,
    };

    const blob = new Blob([JSON.stringify(serializeBigInt(exportData), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [auditLogs, isChainValid]);

  // Get audit statistics
  const getAuditStats = useCallback(() => {
    const stats = {
      totalLogs: auditLogs.length,
      byActionType: {},
      byRole: {},
      byCounty: {},
      recentActivity: [],
    };

    auditLogs.forEach(log => {
      // Count by action type
      stats.byActionType[log.actionName] = (stats.byActionType[log.actionName] || 0) + 1;
      
      // Count by role
      stats.byRole[log.actorRoleName] = (stats.byRole[log.actorRoleName] || 0) + 1;
      
      // Count by county
      if (log.county) {
        stats.byCounty[log.county] = (stats.byCounty[log.county] || 0) + 1;
      }
    });

    // Get recent activity (last 10 logs)
    stats.recentActivity = auditLogs.slice(-10).reverse();

    return stats;
  }, [auditLogs]);

  // Refresh on filter change
  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  // Initial load and chain verification
  useEffect(() => {
    if (contract) {
      fetchAuditLogs();
      verifyChainIntegrity();
    }
  }, [contract]);

  return {
    // State
    auditLogs,
    totalLogs,
    isLoading,
    error,
    isChainValid,
    filters,

    // Methods
    fetchAuditLogs,
    verifyChainIntegrity,
    updateFilters,
    resetFilters,
    exportToCSV,
    exportToJSON,
    getAuditStats,

    // Constants
    ACTION_TYPES,
    ACTION_TYPE_NAMES,
    ROLE_NAMES,
  };
};

export default useAuditTrail;