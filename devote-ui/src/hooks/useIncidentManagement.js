/**
 * useIncidentManagement - Election Incident & Dispute Management Hook
 * Professional National-Grade Election Management Platform
 * 
 * This hook provides incident management functionality including:
 * - Reporting election incidents
 * - Filing complaints and disputes
 * - Tracking incident status
 * - Managing recount requests
 */

import { useState, useEffect, useCallback } from 'react';
import { INCIDENT_STATUS, INCIDENT_SEVERITY } from '../config';
import serializeBigInt, { safeStringify, safeParse } from '../utils/serializeBigInt';

const useIncidentManagement = (contract, account, userRole) => {
  const [incidents, setIncidents] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    escalated: 0,
    dismissed: 0,
  });

  // Incident categories
  const INCIDENT_CATEGORIES = {
    VOTER_INTEGRATION: 'voter_intimidation',
    BALLOT_TAMPERING: 'ballot_tampering',
    EQUIPMENT_FAILURE: 'equipment_failure',
    PROCEDURAL_VIOLATION: 'procedural_violation',
    VOTER_ELIGIBILITY: 'voter_eligibility',
    COUNTING_DISPUTE: 'counting_dispute',
    RESULT_DISPUTE: 'result_dispute',
    TECHNICAL_ISSUE: 'technical_issue',
    ACCESSIBILITY_ISSUE: 'accessibility_issue',
    OTHER: 'other',
  };

  const INCIDENT_CATEGORY_NAMES = {
    [INCIDENT_CATEGORIES.VOTER_INTEGRATION]: 'Voter Intimidation',
    [INCIDENT_CATEGORIES.BALLOT_TAMPERING]: 'Ballot Tampering',
    [INCIDENT_CATEGORIES.EQUIPMENT_FAILURE]: 'Equipment Failure',
    [INCIDENT_CATEGORIES.PROCEDURAL_VIOLATION]: 'Procedural Violation',
    [INCIDENT_CATEGORIES.VOTER_ELIGIBILITY]: 'Voter Eligibility',
    [INCIDENT_CATEGORIES.COUNTING_DISPUTE]: 'Counting Dispute',
    [INCIDENT_CATEGORIES.RESULT_DISPUTE]: 'Result Dispute',
    [INCIDENT_CATEGORIES.TECHNICAL_ISSUE]: 'Technical Issue',
    [INCIDENT_CATEGORIES.ACCESSIBILITY_ISSUE]: 'Accessibility Issue',
    [INCIDENT_CATEGORIES.OTHER]: 'Other',
  };

  // Parse incident from contract (if on-chain) or create local structure
  const parseIncident = useCallback((data, id) => {
    return {
      id: id || data.id || Date.now(),
      category: data.category || INCIDENT_CATEGORIES.OTHER,
      categoryName: INCIDENT_CATEGORY_NAMES[data.category] || 'Other',
      title: data.title || '',
      description: data.description || '',
      location: {
        county: data.county || '',
        constituency: data.constituency || '',
        ward: data.ward || '',
        pollingStation: data.pollingStation || '',
      },
      reporter: data.reporter || account || '',
      reporterRole: data.reporterRole || userRole || 0,
      status: data.status || INCIDENT_STATUS.OPEN,
      severity: data.severity || INCIDENT_SEVERITY.MEDIUM,
      evidence: data.evidence || [],
      assignedTo: data.assignedTo || null,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      resolvedAt: data.resolvedAt || null,
      resolution: data.resolution || '',
      relatedIncidents: data.relatedIncidents || [],
    };
  }, [account, userRole]);

  // Fetch incidents (from Firebase or local storage for off-chain data)
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load from localStorage (in production, this would be Firebase/Backend)
      const storedIncidents = localStorage.getItem('election_incidents');
      const incidentsList = storedIncidents ? JSON.parse(storedIncidents) : [];
      
      const parsedIncidents = incidentsList.map((incident, index) => 
        parseIncident(incident, index + 1)
      );

      setIncidents(parsedIncidents);

      // Filter my incidents
      if (account) {
        const myIncs = parsedIncidents.filter(inc => 
          inc.reporter.toLowerCase() === account.toLowerCase()
        );
        setMyIncidents(myIncs);
      }

      // Calculate stats
      const newStats = {
        total: parsedIncidents.length,
        open: parsedIncidents.filter(i => i.status === INCIDENT_STATUS.OPEN).length,
        underReview: parsedIncidents.filter(i => i.status === INCIDENT_STATUS.UNDER_REVIEW).length,
        resolved: parsedIncidents.filter(i => i.status === INCIDENT_STATUS.RESOLVED).length,
        escalated: parsedIncidents.filter(i => i.status === INCIDENT_STATUS.ESCALATED).length,
        dismissed: parsedIncidents.filter(i => i.status === INCIDENT_STATUS.DISMISSED).length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('[useIncidentManagement] Error fetching incidents:', err);
      setError('Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  }, [account, parseIncident]);

  // Submit a new incident report
  const submitIncident = useCallback(async (incidentData) => {
    if (!contract) throw new Error('Contract not connected');
    if (!account) throw new Error('Must be connected to report incidents');

    setIsLoading(true);
    setError('');

    try {
      const newIncident = {
        ...incidentData,
        reporter: account,
        reporterRole: userRole || 0,
        status: INCIDENT_STATUS.OPEN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save to localStorage (in production, save to Firebase/Backend)
      const storedIncidents = localStorage.getItem('election_incidents');
      const incidentsList = storedIncidents ? JSON.parse(storedIncidents) : [];
      incidentsList.push(newIncident);
      localStorage.setItem('election_incidents', safeStringify(incidentsList));

      // Also log to blockchain audit trail if possible
      try {
        // This would be a contract call in production
        console.log('[useIncidentManagement] Incident logged:', newIncident);
      } catch (chainError) {
        console.warn('[useIncidentManagement] Could not log to chain:', chainError);
      }

      await fetchIncidents();
      
      return { success: true, incident: newIncident };
    } catch (err) {
      console.error('[useIncidentManagement] Error submitting incident:', err);
      setError(err.message || 'Failed to submit incident');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, userRole, fetchIncidents]);

  // Update incident status (for authorized users)
  const updateIncidentStatus = useCallback(async (incidentId, newStatus, resolution = '') => {
    if (!contract) throw new Error('Contract not connected');
    if (userRole < 3) throw new Error('Insufficient permissions'); // Auditor or higher

    setIsLoading(true);
    setError('');

    try {
      const storedIncidents = localStorage.getItem('election_incidents');
      const incidentsList = storedIncidents ? JSON.parse(storedIncidents) : [];
      
      const incidentIndex = incidentsList.findIndex(inc => 
        inc.reporter && inc.createdAt
      );
      
      // Find and update the incident
      let updated = false;
      let count = 0;
      for (let i = incidentsList.length - 1; i >= 0; i--) {
        count++;
        if (count === incidentId) {
          incidentsList[i] = {
            ...incidentsList[i],
            status: newStatus,
            updatedAt: Date.now(),
            resolution: resolution,
            resolvedAt: newStatus === INCIDENT_STATUS.RESOLVED ? Date.now() : null,
          };
          updated = true;
          break;
        }
      }

      if (updated) {
        localStorage.setItem('election_incidents', safeStringify(incidentsList));
        await fetchIncidents();
        return { success: true };
      } else {
        throw new Error('Incident not found');
      }
    } catch (err) {
      console.error('[useIncidentManagement] Error updating incident:', err);
      setError(err.message || 'Failed to update incident');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, userRole, fetchIncidents]);

  // Escalate incident to higher authority
  const escalateIncident = useCallback(async (incidentId, reason) => {
    return updateIncidentStatus(incidentId, INCIDENT_STATUS.ESCALATED, reason);
  }, [updateIncidentStatus]);

  // Dismiss incident
  const dismissIncident = useCallback(async (incidentId, reason) => {
    return updateIncidentStatus(incidentId, INCIDENT_STATUS.DISMISSED, reason);
  }, [updateIncidentStatus]);

  // Resolve incident
  const resolveIncident = useCallback(async (incidentId, resolution) => {
    return updateIncidentStatus(incidentId, INCIDENT_STATUS.RESOLVED, resolution);
  }, [updateIncidentStatus]);

  // Get incidents by status
  const getIncidentsByStatus = useCallback((status) => {
    return incidents.filter(inc => inc.status === status);
  }, [incidents]);

  // Get incidents by severity
  const getIncidentsBySeverity = useCallback((severity) => {
    return incidents.filter(inc => inc.severity === severity);
  }, [incidents]);

  // Get incidents by category
  const getIncidentsByCategory = useCallback((category) => {
    return incidents.filter(inc => inc.category === category);
  }, [incidents]);

  // Get incidents by location
  const getIncidentsByLocation = useCallback((county, constituency, ward) => {
    return incidents.filter(inc => {
      if (county && inc.location.county !== county) return false;
      if (constituency && inc.location.constituency !== constituency) return false;
      if (ward && inc.location.ward !== ward) return false;
      return true;
    });
  }, [incidents]);

  // Export incidents report
  const exportIncidentsReport = useCallback(() => {
    const report = {
      exportedAt: new Date().toISOString(),
      summary: stats,
      incidents: incidents.map(inc => ({
        ...inc,
        // Remove sensitive data for public export
        reporter: '[REDACTED]',
      })),
    };

    const blob = new Blob([JSON.stringify(serializeBigInt(report), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `incident_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [incidents, stats]);

  // Refresh on mount
  useEffect(() => {
    fetchIncidents();
  }, []);

  return {
    // State
    incidents,
    myIncidents,
    isLoading,
    error,
    stats,

    // Methods
    fetchIncidents,
    submitIncident,
    updateIncidentStatus,
    escalateIncident,
    dismissIncident,
    resolveIncident,
    getIncidentsByStatus,
    getIncidentsBySeverity,
    getIncidentsByCategory,
    getIncidentsByLocation,
    exportIncidentsReport,

    // Constants
    INCIDENT_CATEGORIES,
    INCIDENT_CATEGORY_NAMES,
    INCIDENT_STATUS,
    INCIDENT_SEVERITY,
  };
};

export default useIncidentManagement;