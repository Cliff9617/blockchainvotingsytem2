/**
 * ElectionOfficialsManagement - Enterprise Election Officials Management Module
 * 
 * Enhanced production-grade module with:
 * - Blockchain role verification with transaction status tracking
 * - Comprehensive validation (wallet, email, phone, duplicates, on-chain role check)
 * - Named role constants (no numeric mappings)
 * - Immutable audit log (officialAuditLogs collection)
 * - Jurisdiction-aware permissions hierarchy
 * - Enhanced dashboard with role/county/constituency/polling station statistics
 * - Official profile with photo placeholder, transaction & audit history
 * - Security confirmation dialogs for destructive actions
 * - Transaction status display (preparing, waiting, submitted, confirmed, rejected)
 * - Extended search (name, wallet, role, county, constituency, polling station, ID, email)
 * - Export to CSV, Excel, PDF with filters
 * - Proper async error handling, loading states, success notifications
 * 
 * Does NOT modify: Voting, blockchain voting logic, candidate management,
 * election lifecycle, AI modules, wallet connection, authentication,
 * smart contracts, existing dashboard layout.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { kenyaLocations } from "../data/kenyaLocations";
import {
  OFFICIAL_ROLES,
  OFFICIAL_STATUSES,
  getOfficials,
  createOfficial,
  updateOfficial,
  updateOfficialStatus,
  deleteOfficial,
  validateOfficialData,
  checkBlockchainRole,
  supportsBlockchainRoleAssignment,
  searchOfficials,
  isValidWallet,
} from "../services/electionOfficialsService";
import {
  AUDIT_ACTIONS,
  createAuditLog,
  getAuditLogs,
  getAuditLogsByOfficial,
  formatAuditLog,
} from "../services/officialAuditService";
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
} from "../services/officialExportService";
import {
  ROLE_HIERARCHY,
  ROLE_JURISDICTION,
  JURISDICTION_SCOPE,
  getRoleHierarchyLevel,
  isNationalRole,
} from "../config/roleConstants";
import "./ElectionOfficialsManagement.css";

// ==========================================
// ICONS (inline SVGs)
// ==========================================
const Icon = ({ name, size = "md" }) => {
  const cls = size === "sm" ? "eo-icon eo-icon-sm" : "eo-icon";
  const icons = {
    users: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    shield: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    mapPin: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    flag: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    eye: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    checkCircle: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alertCircle: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    plus: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    edit: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    pause: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    play: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    x: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    block: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    building: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></svg>,
    download: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    history: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    user: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    link: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    filter: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    refresh: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    loader: <svg className={`${cls} eo-spinner-icon`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  };
  return icons[name] || null;
};

// ==========================================
// STATUS BADGE COLORS
// ==========================================
const STATUS_STYLES = {
  active: "bg-green-100 text-green-800 border-green-200",
  suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
  disabled: "bg-red-100 text-red-800 border-red-200",
};

// ==========================================
// ROLE STYLES
// ==========================================
const getRoleStyle = (role) => {
  const high = ["super_admin", "iebc_commissioner", "national_returning_officer"];
  const mid = ["county_returning_officer", "constituency_returning_officer", "election_auditor"];
  if (high.includes(role)) return "bg-purple-50 text-purple-700";
  if (mid.includes(role)) return "bg-blue-50 text-blue-700";
  return "bg-gray-50 text-gray-700";
};

// ==========================================
// HELPERS
// ==========================================
const truncateAddress = (addr) => {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
};

const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    return d.toLocaleDateString("en-KE", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const INITIAL_FORM = {
  fullName: "",
  nationalId: "",
  email: "",
  phoneNumber: "",
  walletAddress: "",
  role: "",
  county: "",
  constituency: "",
  ward: "",
  pollingStation: "",
  status: "active",
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const ElectionOfficialsManagement = ({
  account,
  contract,
  isMainAdmin,
  adminAddress,
  userRole,        // Current user's application role string
  userCounty,      // Current user's county (for jurisdiction filtering)
  userConstituency, // Current user's constituency
  userPollingStation, // Current user's polling station
}) => {
  // ---- State ----
  const [officials, setOfficials] = useState([]);
  const [filteredOfficials, setFilteredOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("info");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState(null);
  const [viewingOfficial, setViewingOfficial] = useState(null);
  const [deletingOfficial, setDeletingOfficial] = useState(null);
  const [suspendingOfficial, setSuspendingOfficial] = useState(null);
  const [disablingOfficial, setDisablingOfficial] = useState(null);

  // Form
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Blockchain transaction status
  const [txStatus, setTxStatus] = useState(null); // null | 'preparing' | 'waiting' | 'submitted' | 'confirmed' | 'rejected'
  const [txHash, setTxHash] = useState("");

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Location dropdowns
  const [availConstituencies, setAvailConstituencies] = useState([]);
  const [availWards, setAvailWards] = useState([]);

  // Audit logs for viewing
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  const isEditing = !!editingOfficial;

  // Jurisdiction info for current user
  const userJurisdiction = ROLE_JURISDICTION[userRole] || "national";
  const canViewAll = isNationalRole(userRole) || userRole === "election_auditor" || userRole === "read_only_observer" || userRole === "iebc_commissioner";

  // ---- Status helper ----
  const showStatus = useCallback((msg, type = "info") => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(""), 6000);
  }, []);

  // ---- Fetch officials (real-time) ----
  useEffect(() => {
    setLoading(true);
    const unsub = getOfficials({}, (data) => {
      setOfficials(data || []);
      setLoading(false);
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  // ---- Apply search, filters, and jurisdiction filtering ----
  useEffect(() => {
    let result = [...officials];

    // Jurisdiction filtering
    if (!canViewAll) {
      if (userJurisdiction === "county" && userCounty) {
        result = result.filter(o => o.county?.toLowerCase() === userCounty.toLowerCase());
      } else if (userJurisdiction === "constituency" && userConstituency) {
        result = result.filter(o =>
          o.constituency?.toLowerCase() === userConstituency.toLowerCase()
        );
      } else if (userJurisdiction === "polling_station" && userPollingStation) {
        result = result.filter(o =>
          o.pollingStation?.toLowerCase() === userPollingStation.toLowerCase()
        );
      }
    }

    // Text search
    if (searchTerm.trim()) {
      const t = searchTerm.trim().toLowerCase();
      result = result.filter(o =>
        (o.fullName && o.fullName.toLowerCase().includes(t)) ||
        (o.walletAddress && o.walletAddress.toLowerCase().includes(t)) ||
        (o.roleLabel && o.roleLabel.toLowerCase().includes(t)) ||
        (o.county && o.county.toLowerCase().includes(t)) ||
        (o.constituency && o.constituency.toLowerCase().includes(t)) ||
        (o.pollingStation && o.pollingStation.toLowerCase().includes(t)) ||
        (o.nationalId && o.nationalId.toLowerCase().includes(t)) ||
        (o.email && o.email.toLowerCase().includes(t))
      );
    }

    if (filterRole) result = result.filter(o => o.role === filterRole);
    if (filterCounty) result = result.filter(o => o.county === filterCounty);
    if (filterStatus) result = result.filter(o => o.status === filterStatus);

    setFilteredOfficials(result);
  }, [officials, searchTerm, filterRole, filterCounty, filterStatus,
      canViewAll, userJurisdiction, userCounty, userConstituency, userPollingStation]);

  // ---- Location dropdowns ----
  useEffect(() => {
    if (formData.county) {
      const county = kenyaLocations.counties.find(
        c => c.name.toLowerCase() === formData.county.toLowerCase()
      );
      if (county && county.constituencies) {
        setAvailConstituencies(county.constituencies.map(c => c.name));
        if (formData.constituency) {
          const con = county.constituencies.find(
            c => c.name.toLowerCase() === formData.constituency.toLowerCase()
          );
          setAvailWards(con && con.wards ? con.wards : []);
        } else {
          setAvailWards([]);
        }
      } else {
        setAvailConstituencies([]);
        setAvailWards([]);
      }
    } else {
      setAvailConstituencies([]);
      setAvailWards([]);
    }
  }, [formData.county, formData.constituency]);

  // ---- Dashboard stats ----
  const stats = useMemo(() => {
    const total = officials.length;
    const superAdmins = officials.filter(o => o.role === "super_admin").length;
    const iebcComm = officials.filter(o => o.role === "iebc_commissioner").length;
    const natReturning = officials.filter(o => o.role === "national_returning_officer").length;
    const countyOff = officials.filter(o => o.role === "county_returning_officer").length;
    const constituencyOff = officials.filter(o => o.role === "constituency_returning_officer").length;
    const presiding = officials.filter(o => o.role === "presiding_officer").length;
    const pollClerks = officials.filter(o => o.role === "poll_clerk").length;
    const observers = officials.filter(o => o.role === "read_only_observer").length;
    const active = officials.filter(o => o.status === "active").length;
    const suspended = officials.filter(o => o.status === "suspended").length;
    const blockchainAssigned = officials.filter(o => o.blockchainAssigned).length;
    const firestoreOnly = officials.filter(o => !o.blockchainAssigned).length;

    // By county
    const countyMap = {};
    officials.forEach(o => {
      if (o.county) {
        countyMap[o.county] = (countyMap[o.county] || 0) + 1;
      }
    });
    const topCounty = Object.entries(countyMap).sort((a, b) => b[1] - a[1])[0];
    const countyCount = Object.keys(countyMap).length;

    // Recent additions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdded = officials.filter(o => {
      if (!o.createdAt) return false;
      const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return d >= sevenDaysAgo;
    }).length;

    const recentlySuspended = officials.filter(o => {
      if (!o.updatedAt || o.status !== "suspended") return false;
      const d = o.updatedAt.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt);
      return d >= sevenDaysAgo;
    }).length;

    return {
      total, superAdmins, iebcComm, natReturning, countyOff, constituencyOff,
      presiding, pollClerks, observers, active, suspended,
      blockchainAssigned, firestoreOnly,
      countyCount, topCounty: topCounty ? topCounty[0] : "—",
      recentAdded, recentlySuspended,
    };
  }, [officials]);

  // ---- Load audit logs for viewing official ----
  useEffect(() => {
    if (showView && viewingOfficial?.walletAddress) {
      setAuditLogsLoading(true);
      getAuditLogsByOfficial(viewingOfficial.walletAddress, 20)
        .then(logs => {
          setAuditLogs(logs.map(formatAuditLog));
        })
        .catch(() => {
          setAuditLogs([]);
        })
        .finally(() => {
          setAuditLogsLoading(false);
        });
    }
  }, [showView, viewingOfficial]);

  // ---- Form handlers ----
  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setEditingOfficial(null);
    setAvailConstituencies([]);
    setAvailWards([]);
    setTxStatus(null);
    setTxHash("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (official) => {
    setFormData({
      fullName: official.fullName || "",
      nationalId: official.nationalId || "",
      email: official.email || "",
      phoneNumber: official.phoneNumber || "",
      walletAddress: official.walletAddress || "",
      role: official.role || "",
      county: official.county || "",
      constituency: official.constituency || "",
      ward: official.ward || "",
      pollingStation: official.pollingStation || "",
      status: official.status || "active",
    });
    setEditingOfficial(official);
    setFormErrors({});
    setShowForm(true);
  };

  const openView = async (official) => {
    setViewingOfficial(official);
    setAuditLogs([]);
    setShowView(true);
  };

  const openDelete = (official) => {
    setDeletingOfficial(official);
    setShowDelete(true);
  };

  const openSuspendConfirm = (official) => {
    setSuspendingOfficial(official);
    setShowSuspend(true);
  };

  const openDisableConfirm = (official) => {
    setDisablingOfficial(official);
    setShowDisable(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === "county" ? { constituency: "", ward: "" } : {}),
      ...(field === "constituency" ? { ward: "" } : {}),
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // ---- Blockchain role pre-check on wallet change ----
  const [blockchainRoleWarning, setBlockchainRoleWarning] = useState("");

  useEffect(() => {
    const checkWalletRole = async () => {
      if (!formData.walletAddress || !isValidWallet(formData.walletAddress) || !contract) {
        setBlockchainRoleWarning("");
        return;
      }
      try {
        const result = await checkBlockchainRole(contract, formData.walletAddress);
        if (result.hasRole) {
          setBlockchainRoleWarning(
            `⚠️ This wallet already has a blockchain role (Role #${result.role}). Assigning a new role will override it.`
          );
        } else {
          setBlockchainRoleWarning("");
        }
      } catch {
        setBlockchainRoleWarning("");
      }
    };
    checkWalletRole();
  }, [formData.walletAddress, contract]);

  // ---- Submit handler with transaction status ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMainAdmin) {
      showStatus("Only the Main Admin can manage election officials.", "error");
      return;
    }

    // Client-side validation first
    const validation = await validateOfficialData(formData, officials, editingOfficial?.id);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setTxStatus("preparing");
    setTxHash("");

    try {
      if (isEditing) {
        await updateOfficial(editingOfficial.id, formData, account);

        // Create audit log for edit
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.EDIT,
            performedBy: formData.fullName || account,
            performerWallet: account,
            targetOfficial: formData.fullName,
            officialWallet: formData.walletAddress,
            previousRole: editingOfficial.role,
            newRole: formData.role,
            previousStatus: editingOfficial.status,
            newStatus: formData.status,
            county: formData.county,
            constituency: formData.constituency,
            pollingStation: formData.pollingStation,
            notes: isEditing ? "Official details updated" : "",
          });
        } catch (auditErr) {
          console.warn("[Audit] Failed to log edit:", auditErr);
        }

        showStatus(`✅ ${formData.fullName} updated successfully.`, "success");
      } else {
        // For creation, attempt blockchain assignment with tx tracking
        const blockchainSupported = supportsBlockchainRoleAssignment(contract);

        if (blockchainSupported && formData.walletAddress && account) {
          setTxStatus("waiting");
          showStatus("⏳ Waiting for MetaMask confirmation...", "info");
        }

        const result = await createOfficial(formData, contract, account);

        if (result.blockchainTxHash) {
          setTxStatus("confirmed");
          setTxHash(result.blockchainTxHash);
          showStatus(`✅ ${formData.fullName} created with blockchain role assignment. TX: ${truncateAddress(result.blockchainTxHash)}`, "success");
        } else if (result.blockchainError && result.blockchainError.includes("not supported by the current deployed contract")) {
          setTxStatus(null);
          showStatus(`✅ ${formData.fullName} created (Firestore only). Blockchain role assignment is not supported by the current deployed contract.`, "success");
        } else if (result.blockchainError) {
          setTxStatus("rejected");
          showStatus(`✅ ${formData.fullName} created (Firestore only). Blockchain: ${result.blockchainError}`, "success");
        } else {
          setTxStatus(null);
          showStatus(`✅ ${formData.fullName} created (Firestore only).`, "success");
        }

        // Create audit log for creation
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.CREATE,
            performedBy: formData.fullName || account,
            performerWallet: account,
            targetOfficial: formData.fullName,
            officialWallet: formData.walletAddress,
            newRole: formData.role,
            newStatus: formData.status,
            county: formData.county,
            constituency: formData.constituency,
            pollingStation: formData.pollingStation,
            blockchainTxHash: result.blockchainTxHash || "",
            notes: "Official created",
          });
        } catch (auditErr) {
          console.warn("[Audit] Failed to log creation:", auditErr);
        }
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      setTxStatus("rejected");
      showStatus(`❌ ${err.message}`, "error");
    } finally {
      setSubmitting(false);
      if (!isEditing) {
        // Keep tx status visible for a bit
        setTimeout(() => {
          setTxStatus(null);
          setTxHash("");
        }, 8000);
      }
    }
  };

  // ---- Status change handlers with security confirmation ----
  const handleActivate = async (official) => {
    if (!isMainAdmin) {
      showStatus("Only the Main Admin can change official status.", "error");
      return;
    }
    try {
      await updateOfficialStatus(official.id, "active", account);

      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.ACTIVATION,
          performerWallet: account,
          targetOfficial: official.fullName,
          officialWallet: official.walletAddress,
          previousStatus: official.status,
          newStatus: "active",
          county: official.county,
          constituency: official.constituency,
          pollingStation: official.pollingStation,
          notes: "Official activated",
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log activation:", auditErr);
      }

      showStatus(`✅ ${official.fullName} activated successfully.`, "success");
    } catch (err) {
      showStatus(`❌ ${err.message}`, "error");
    }
  };

  const handleSuspend = async () => {
    if (!isMainAdmin || !suspendingOfficial) {
      showStatus("Only the Main Admin can suspend officials.", "error");
      return;
    }
    try {
      await updateOfficialStatus(suspendingOfficial.id, "suspended", account);

      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.SUSPENSION,
          performerWallet: account,
          targetOfficial: suspendingOfficial.fullName,
          officialWallet: suspendingOfficial.walletAddress,
          previousStatus: suspendingOfficial.status,
          newStatus: "suspended",
          county: suspendingOfficial.county,
          constituency: suspendingOfficial.constituency,
          pollingStation: suspendingOfficial.pollingStation,
          notes: "Official suspended",
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log suspension:", auditErr);
      }

      showStatus(`✅ ${suspendingOfficial.fullName} suspended successfully.`, "success");
      setShowSuspend(false);
      setSuspendingOfficial(null);
    } catch (err) {
      showStatus(`❌ ${err.message}`, "error");
    }
  };

  const handleDisable = async () => {
    if (!isMainAdmin || !disablingOfficial) {
      showStatus("Only the Main Admin can disable officials.", "error");
      return;
    }
    try {
      await updateOfficialStatus(disablingOfficial.id, "disabled", account);

      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.SUSPENSION,
          performerWallet: account,
          targetOfficial: disablingOfficial.fullName,
          officialWallet: disablingOfficial.walletAddress,
          previousStatus: disablingOfficial.status,
          newStatus: "disabled",
          county: disablingOfficial.county,
          constituency: disablingOfficial.constituency,
          pollingStation: disablingOfficial.pollingStation,
          notes: "Official disabled",
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log disable:", auditErr);
      }

      showStatus(`✅ ${disablingOfficial.fullName} disabled successfully.`, "success");
      setShowDisable(false);
      setDisablingOfficial(null);
    } catch (err) {
      showStatus(`❌ ${err.message}`, "error");
    }
  };

  const handleDelete = async () => {
    if (!isMainAdmin || !deletingOfficial) {
      showStatus("Only the Main Admin can delete officials.", "error");
      return;
    }
    try {
      await deleteOfficial(deletingOfficial.id);

      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.DELETION,
          performerWallet: account,
          targetOfficial: deletingOfficial.fullName,
          officialWallet: deletingOfficial.walletAddress,
          previousRole: deletingOfficial.role,
          previousStatus: deletingOfficial.status,
          county: deletingOfficial.county,
          constituency: deletingOfficial.constituency,
          pollingStation: deletingOfficial.pollingStation,
          notes: "Official deleted from system",
        });
      } catch (auditErr) {
        console.warn("[Audit] Failed to log deletion:", auditErr);
      }

      showStatus(`✅ ${deletingOfficial.fullName} removed successfully.`, "success");
      setShowDelete(false);
      setDeletingOfficial(null);
    } catch (err) {
      showStatus(`❌ ${err.message}`, "error");
    }
  };

  // ---- Export handlers ----
  const handleExport = (format) => {
    const dataToExport = filteredOfficials.length > 0 ? filteredOfficials : officials;

    switch (format) {
      case "csv":
        exportToCsv(dataToExport);
        showStatus("✅ CSV exported successfully.", "success");
        break;
      case "excel":
        exportToExcel(dataToExport);
        showStatus("✅ Excel exported successfully.", "success");
        break;
      case "pdf":
        exportToPdf(dataToExport, "Election Officials Report");
        showStatus("✅ PDF report opened.", "success");
        break;
      default:
        break;
    }
    setShowExport(false);
  };

  // ---- Render helpers ----
  const renderStatusBadge = (status) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.active;
    const label = OFFICIAL_STATUSES.find(s => s.value === status)?.label || status;
    return <span className={`eo-badge ${style}`}>{label}</span>;
  };

  const renderRoleBadge = (role, label) => {
    return <span className={`eo-cell-role ${getRoleStyle(role)}`}>{label || role}</span>;
  };

  const renderBlockchainBadge = (official) => {
    if (official.blockchainAssigned) {
      return (
        <span className="eo-bc-badge eo-bc-badge-success" title={`TX: ${official.blockchainTxHash || "N/A"}`}>
          <Icon name="checkCircle" size="sm" />
          <span>On-Chain</span>
        </span>
      );
    }
    return (
      <span className="eo-bc-badge eo-bc-badge-failed" title={official.blockchainError || "Firestore only"}>
        <Icon name="alertCircle" size="sm" />
        <span>Firestore</span>
      </span>
    );
  };

  const renderTxStatus = () => {
    if (!txStatus) return null;
    const statusConfig = {
      preparing: { icon: "loader", text: "Preparing transaction...", className: "eo-tx-preparing" },
      waiting: { icon: "loader", text: "Waiting for MetaMask confirmation...", className: "eo-tx-waiting" },
      submitted: { icon: "loader", text: "Transaction submitted, waiting for confirmation...", className: "eo-tx-submitted" },
      confirmed: { icon: "checkCircle", text: "Confirmed", className: "eo-tx-confirmed" },
      rejected: { icon: "alertCircle", text: "Transaction rejected by user or failed", className: "eo-tx-rejected" },
    };
    const cfg = statusConfig[txStatus] || statusConfig.preparing;
    return (
      <div className={`eo-tx-status ${cfg.className}`}>
        <Icon name={cfg.icon} size="sm" />
        <span>{cfg.text}</span>
        {txHash && (
          <span className="eo-tx-hash" title={txHash}>
            TX: {truncateAddress(txHash)}
          </span>
        )}
      </div>
    );
  };

  // ---- Access denied ----
  if (!isMainAdmin) {
    return (
      <div className="eo-container">
        <div className="eo-access-denied">
          <div className="eo-access-denied-icon"><Icon name="shield" /></div>
          <h2>Access Restricted</h2>
          <p>Only the Main Admin (SuperAdmin) can manage election officials.</p>
          <p className="eo-access-denied-hint">Connect with the contract admin wallet to access this module.</p>
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="eo-container">
      {/* Header */}
      <div className="eo-header">
        <div className="eo-header-left">
          <h1 className="eo-title">Election Officials Management</h1>
          <p className="eo-subtitle">Enterprise-grade management for all election officials, roles, permissions, and audit</p>
        </div>
        <div className="eo-header-right">
          <button className="eo-btn eo-btn-secondary" onClick={() => setShowExport(true)} title="Export officials">
            <Icon name="download" />
            <span>Export</span>
          </button>
          <button className="eo-btn eo-btn-primary" onClick={openCreate}>
            <Icon name="plus" />
            <span>Add Official</span>
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className={`eo-status eo-status-${statusType}`}>
          <span>{statusMsg}</span>
          <button className="eo-status-close" onClick={() => setStatusMsg("")}>
            <Icon name="x" size="sm" />
          </button>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="eo-dashboard">
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-blue"><Icon name="users" /></div>
          <div className="eo-card-label">Total Officials</div>
          <div className="eo-card-value">{stats.total}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-purple"><Icon name="shield" /></div>
          <div className="eo-card-label">Super Admins</div>
          <div className="eo-card-value">{stats.superAdmins}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-indigo"><Icon name="building" /></div>
          <div className="eo-card-label">County Officers</div>
          <div className="eo-card-value">{stats.countyOff}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-cyan"><Icon name="mapPin" /></div>
          <div className="eo-card-label">Constituency Officers</div>
          <div className="eo-card-value">{stats.constituencyOff}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-green"><Icon name="flag" /></div>
          <div className="eo-card-label">Presiding Officers</div>
          <div className="eo-card-value">{stats.presiding}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-yellow"><Icon name="eye" /></div>
          <div className="eo-card-label">Observers</div>
          <div className="eo-card-value">{stats.observers}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-green"><Icon name="checkCircle" /></div>
          <div className="eo-card-label">Active</div>
          <div className="eo-card-value">{stats.active}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-red"><Icon name="alertCircle" /></div>
          <div className="eo-card-label">Suspended</div>
          <div className="eo-card-value">{stats.suspended}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-blue"><Icon name="link" /></div>
          <div className="eo-card-label">Blockchain Assigned</div>
          <div className="eo-card-value">{stats.blockchainAssigned}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-yellow"><Icon name="block" /></div>
          <div className="eo-card-label">Firestore Only</div>
          <div className="eo-card-value">{stats.firestoreOnly}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-cyan"><Icon name="mapPin" /></div>
          <div className="eo-card-label">Counties Covered</div>
          <div className="eo-card-value">{stats.countyCount}</div>
        </div>
        <div className="eo-card">
          <div className="eo-card-icon eo-card-icon-purple"><Icon name="user" /></div>
          <div className="eo-card-label">Recently Added (7d)</div>
          <div className="eo-card-value">{stats.recentAdded}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="eo-toolbar">
        <div className="eo-search-wrapper">
          <span className="eo-search-icon"><Icon name="search" size="sm" /></span>
          <input
            type="text"
            className="eo-search-input"
            placeholder="Search by name, wallet, role, county, constituency, polling station, ID, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="eo-filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {OFFICIAL_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select className="eo-filter-select" value={filterCounty} onChange={e => setFilterCounty(e.target.value)}>
          <option value="">All Counties</option>
          {kenyaLocations.counties.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select className="eo-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {OFFICIAL_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="eo-table-wrapper">
        {loading ? (
          <div className="eo-loading">
            <div className="eo-spinner" />
            <span>Loading officials...</span>
          </div>
        ) : filteredOfficials.length === 0 ? (
          <div className="eo-empty-message">
            <div className="eo-empty-icon"><Icon name="users" /></div>
            <p><strong>No officials found</strong></p>
            <p>{searchTerm || filterRole || filterCounty || filterStatus ? "Try adjusting your search or filters." : "Click 'Add Official' to create the first election official."}</p>
          </div>
        ) : (
          <table className="eo-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Wallet</th>
                <th>County</th>
                <th>Constituency</th>
                <th>Polling Station</th>
                <th>Status</th>
                <th>Blockchain</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfficials.map((official) => (
                <tr key={official.id}>
                  <td>
                    <span className="eo-cell-name">{official.fullName}</span>
                  </td>
                  <td>{renderRoleBadge(official.role, official.roleLabel)}</td>
                  <td><span className="eo-cell-wallet">{truncateAddress(official.walletAddress)}</span></td>
                  <td>{official.county || "—"}</td>
                  <td>{official.constituency || "—"}</td>
                  <td>{official.pollingStation || "—"}</td>
                  <td className="eo-cell-status">{renderStatusBadge(official.status)}</td>
                  <td>{renderBlockchainBadge(official)}</td>
                  <td>{formatDate(official.createdAt)}</td>
                  <td>
                    <div className="eo-cell-actions">
                      <button className="eo-btn eo-btn-icon" title="View" onClick={() => openView(official)}>
                        <Icon name="eye" size="sm" />
                      </button>
                      <button className="eo-btn eo-btn-icon" title="Edit" onClick={() => openEdit(official)}>
                        <Icon name="edit" size="sm" />
                      </button>
                      {official.status !== "active" && (
                        <button className="eo-btn eo-btn-icon" title="Activate" onClick={() => handleActivate(official)}>
                          <Icon name="play" size="sm" />
                        </button>
                      )}
                      {official.status === "active" && (
                        <button className="eo-btn eo-btn-icon" title="Suspend" onClick={() => openSuspendConfirm(official)}>
                          <Icon name="pause" size="sm" />
                        </button>
                      )}
                      {official.status === "suspended" && (
                        <button className="eo-btn eo-btn-icon eo-btn-icon-danger" title="Disable" onClick={() => openDisableConfirm(official)}>
                          <Icon name="block" size="sm" />
                        </button>
                      )}
                      <button className="eo-btn eo-btn-icon eo-btn-icon-danger" title="Delete" onClick={() => openDelete(official)}>
                        <Icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ========== CREATE/EDIT FORM MODAL ========== */}
      {showForm && (
        <div className="eo-overlay" onClick={() => { if (!submitting) { setShowForm(false); resetForm(); } }}>
          <div className="eo-modal" onClick={e => e.stopPropagation()}>
            <div className="eo-modal-header">
              <h2 className="eo-modal-title">{isEditing ? "Edit Official" : "Add Election Official"}</h2>
              <button className="eo-modal-close" onClick={() => { setShowForm(false); resetForm(); }} disabled={submitting}>
                <Icon name="x" size="sm" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="eo-modal-body">
                {/* Blockchain role warning */}
                {blockchainRoleWarning && (
                  <div className="eo-form-warning">
                    <Icon name="alertCircle" size="sm" />
                    <span>{blockchainRoleWarning}</span>
                  </div>
                )}

                {/* Transaction status */}
                {renderTxStatus()}

                <div className="eo-form-grid">
                  {/* Full Name */}
                  <div className="eo-form-group eo-form-group-full">
                    <label className="eo-form-label eo-form-label-required">Full Name</label>
                    <input
                      type="text"
                      className="eo-form-input"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={e => handleFormChange("fullName", e.target.value)}
                      disabled={submitting}
                    />
                    {formErrors.fullName && <span className="eo-form-error">{formErrors.fullName}</span>}
                  </div>

                  {/* National ID */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">National ID / Staff Number</label>
                    <input
                      type="text"
                      className="eo-form-input"
                      placeholder="e.g. ID123456"
                      value={formData.nationalId}
                      onChange={e => handleFormChange("nationalId", e.target.value)}
                      disabled={submitting}
                    />
                    {formErrors.nationalId && <span className="eo-form-error">{formErrors.nationalId}</span>}
                  </div>

                  {/* Email */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Email</label>
                    <input
                      type="email"
                      className="eo-form-input"
                      placeholder="official@iebc.go.ke"
                      value={formData.email}
                      onChange={e => handleFormChange("email", e.target.value)}
                      disabled={submitting}
                    />
                    {formErrors.email && <span className="eo-form-error">{formErrors.email}</span>}
                  </div>

                  {/* Phone */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="eo-form-input"
                      placeholder="+254 7XX XXX XXX"
                      value={formData.phoneNumber}
                      onChange={e => handleFormChange("phoneNumber", e.target.value)}
                      disabled={submitting}
                    />
                    {formErrors.phoneNumber && <span className="eo-form-error">{formErrors.phoneNumber}</span>}
                  </div>

                  {/* Wallet Address */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Wallet Address (Ethereum)</label>
                    <input
                      type="text"
                      className="eo-form-input"
                      placeholder="0x..."
                      value={formData.walletAddress}
                      onChange={e => handleFormChange("walletAddress", e.target.value)}
                      disabled={submitting}
                    />
                    {formErrors.walletAddress && <span className="eo-form-error">{formErrors.walletAddress}</span>}
                  </div>

                  {/* Role */}
                  <div className="eo-form-group">
                    <label className="eo-form-label eo-form-label-required">Role</label>
                    <select
                      className="eo-form-select"
                      value={formData.role}
                      onChange={e => handleFormChange("role", e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">Select Role</option>
                      {OFFICIAL_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {formErrors.role && <span className="eo-form-error">{formErrors.role}</span>}
                  </div>

                  {/* County */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">County</label>
                    <select
                      className="eo-form-select"
                      value={formData.county}
                      onChange={e => handleFormChange("county", e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">Select County</option>
                      {kenyaLocations.counties.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Constituency */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Constituency</label>
                    <select
                      className="eo-form-select"
                      value={formData.constituency}
                      onChange={e => handleFormChange("constituency", e.target.value)}
                      disabled={submitting || availConstituencies.length === 0}
                    >
                      <option value="">Select Constituency</option>
                      {availConstituencies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ward */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Ward</label>
                    <select
                      className="eo-form-select"
                      value={formData.ward}
                      onChange={e => handleFormChange("ward", e.target.value)}
                      disabled={submitting || availWards.length === 0}
                    >
                      <option value="">Select Ward</option>
                      {availWards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Polling Station */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Polling Station</label>
                    <input
                      type="text"
                      className="eo-form-input"
                      placeholder="e.g. Kasarani Primary School"
                      value={formData.pollingStation}
                      onChange={e => handleFormChange("pollingStation", e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  {/* Status */}
                  <div className="eo-form-group">
                    <label className="eo-form-label">Status</label>
                    <select
                      className="eo-form-select"
                      value={formData.status}
                      onChange={e => handleFormChange("status", e.target.value)}
                      disabled={submitting}
                    >
                      {OFFICIAL_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="eo-modal-footer">
                <button type="button" className="eo-btn eo-btn-secondary" onClick={() => { setShowForm(false); resetForm(); }} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="eo-btn eo-btn-primary" disabled={submitting}>
                  {submitting ? "Processing..." : isEditing ? "Update Official" : "Create Official"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== VIEW MODAL (Official Profile) ========== */}
      {showView && viewingOfficial && (
        <div className="eo-overlay" onClick={() => { setShowView(false); setViewingOfficial(null); }}>
          <div className="eo-modal eo-view-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className="eo-modal-header">
              <h2 className="eo-modal-title">Official Profile</h2>
              <button className="eo-modal-close" onClick={() => { setShowView(false); setViewingOfficial(null); }}>
                <Icon name="x" size="sm" />
              </button>
            </div>
            <div className="eo-modal-body">
              {/* Photo placeholder */}
              <div className="eo-profile-photo">
                <div className="eo-profile-avatar">
                  {(viewingOfficial.fullName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="eo-profile-initials">
                  <h3>{viewingOfficial.fullName}</h3>
                  {renderRoleBadge(viewingOfficial.role, viewingOfficial.roleLabel)}
                  {renderStatusBadge(viewingOfficial.status)}
                </div>
              </div>

              <div className="eo-view-grid">
                <div className="eo-view-field">
                  <span className="eo-view-label">Wallet</span>
                  <span className="eo-view-value eo-view-value-mono">{viewingOfficial.walletAddress || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">National ID</span>
                  <span className="eo-view-value">{viewingOfficial.nationalId || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Email</span>
                  <span className="eo-view-value">{viewingOfficial.email || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Phone</span>
                  <span className="eo-view-value">{viewingOfficial.phoneNumber || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">County</span>
                  <span className="eo-view-value">{viewingOfficial.county || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Constituency</span>
                  <span className="eo-view-value">{viewingOfficial.constituency || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Ward</span>
                  <span className="eo-view-value">{viewingOfficial.ward || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Polling Station</span>
                  <span className="eo-view-value">{viewingOfficial.pollingStation || "—"}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Date Created</span>
                  <span className="eo-view-value">{formatDateTime(viewingOfficial.createdAt)}</span>
                </div>
                <div className="eo-view-field">
                  <span className="eo-view-label">Created By</span>
                  <span className="eo-view-value eo-view-value-mono">{truncateAddress(viewingOfficial.createdBy)}</span>
                </div>
              </div>

              {/* Blockchain Status */}
              <div className="eo-profile-section">
                <h4 className="eo-profile-section-title">
                  <Icon name="link" size="sm" />
                  <span>Blockchain Status</span>
                </h4>
                <div className={`eo-view-blockchain ${viewingOfficial.blockchainAssigned ? "" : "eo-view-blockchain-failed"}`}>
                  {viewingOfficial.blockchainAssigned ? (
                    <>
                      <Icon name="checkCircle" size="sm" />
                      <span>Role assigned on-chain successfully</span>
                      {viewingOfficial.blockchainTxHash && (
                        <span className="eo-tx-hash" title={viewingOfficial.blockchainTxHash}>
                          TX: {truncateAddress(viewingOfficial.blockchainTxHash)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Icon name="alertCircle" size="sm" />
                      <span>{viewingOfficial.blockchainError || "Blockchain role not assigned (saved to Firestore only)"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Transaction History */}
              {viewingOfficial.blockchainTxHash && (
                <div className="eo-profile-section">
                  <h4 className="eo-profile-section-title">
                    <Icon name="history" size="sm" />
                    <span>Transaction History</span>
                  </h4>
                  <div className="eo-tx-history">
                    <div className="eo-tx-history-item">
                      <span className="eo-tx-history-label">Role Assignment TX</span>
                      <span className="eo-tx-history-value eo-view-value-mono">{viewingOfficial.blockchainTxHash}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit History */}
              <div className="eo-profile-section">
                <h4 className="eo-profile-section-title">
                  <Icon name="history" size="sm" />
                  <span>Audit History</span>
                </h4>
                {auditLogsLoading ? (
                  <div className="eo-loading" style={{ padding: "1rem" }}>
                    <div className="eo-spinner" style={{ width: "20px", height: "20px" }} />
                    <span>Loading audit history...</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="eo-profile-empty">No audit entries found for this official.</p>
                ) : (
                  <div className="eo-audit-list">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="eo-audit-item">
                        <div className="eo-audit-item-header">
                          <span className={`eo-audit-action eo-audit-action-${log.action?.toLowerCase().replace(/\s+/g, "-")}`}>
                            {log.action}
                          </span>
                          <span className="eo-audit-date">{log.formattedDate}</span>
                        </div>
                        <div className="eo-audit-item-details">
                          {log.previousRole && log.newRole && log.previousRole !== log.newRole && (
                            <span>Role: {log.previousRole} → {log.newRole}</span>
                          )}
                          {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                            <span>Status: {log.previousStatus} → {log.newStatus}</span>
                          )}
                          {log.blockchainTxHash && (
                            <span className="eo-view-value-mono">TX: {truncateAddress(log.blockchainTxHash)}</span>
                          )}
                        </div>
                        <div className="eo-audit-item-performer">
                          By: {truncateAddress(log.performerWallet)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="eo-modal-footer">
              <button className="eo-btn eo-btn-secondary" onClick={() => { setShowView(false); setViewingOfficial(null); }}>
                Close
              </button>
              <button className="eo-btn eo-btn-primary" onClick={() => { setShowView(false); setViewingOfficial(null); openEdit(viewingOfficial); }}>
                <Icon name="edit" size="sm" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {showDelete && deletingOfficial && (
        <div className="eo-overlay" onClick={() => { setShowDelete(false); setDeletingOfficial(null); }}>
          <div className="eo-modal eo-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="eo-delete-content">
              <div className="eo-delete-icon"><Icon name="trash" /></div>
              <h3>Delete Official?</h3>
              <p>You are about to permanently remove <strong>{deletingOfficial.fullName}</strong>.</p>
              <div className="eo-consequences">
                <h4>Consequences:</h4>
                <ul>
                  <li>This official's record will be permanently deleted from Firestore.</li>
                  <li>Blockchain role assignments will NOT be automatically revoked.</li>
                  <li>Audit logs will be preserved for compliance.</li>
                  <li>This action <strong>cannot be undone</strong>.</li>
                </ul>
              </div>
            </div>
            <div className="eo-modal-footer">
              <button className="eo-btn eo-btn-secondary" onClick={() => { setShowDelete(false); setDeletingOfficial(null); }}>
                Cancel
              </button>
              <button className="eo-btn eo-btn-danger" onClick={handleDelete}>
                Delete Official
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== SUSPEND CONFIRMATION MODAL ========== */}
      {showSuspend && suspendingOfficial && (
        <div className="eo-overlay" onClick={() => { setShowSuspend(false); setSuspendingOfficial(null); }}>
          <div className="eo-modal eo-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="eo-delete-content">
              <div className="eo-delete-icon" style={{ color: "#d97706" }}><Icon name="pause" /></div>
              <h3>Suspend Official?</h3>
              <p>You are about to suspend <strong>{suspendingOfficial.fullName}</strong>.</p>
              <div className="eo-consequences">
                <h4>Consequences:</h4>
                <ul>
                  <li>The official will be unable to perform their duties.</li>
                  <li>Blockchain role will remain but marked inactive on-chain if supported.</li>
                  <li>They can be reactivated at any time.</li>
                </ul>
              </div>
            </div>
            <div className="eo-modal-footer">
              <button className="eo-btn eo-btn-secondary" onClick={() => { setShowSuspend(false); setSuspendingOfficial(null); }}>
                Cancel
              </button>
              <button className="eo-btn eo-btn-warning" onClick={handleSuspend}>
                Suspend Official
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DISABLE CONFIRMATION MODAL ========== */}
      {showDisable && disablingOfficial && (
        <div className="eo-overlay" onClick={() => { setShowDisable(false); setDisablingOfficial(null); }}>
          <div className="eo-modal eo-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="eo-delete-content">
              <div className="eo-delete-icon" style={{ color: "#dc2626" }}><Icon name="block" /></div>
              <h3>Disable Official?</h3>
              <p>You are about to disable <strong>{disablingOfficial.fullName}</strong>.</p>
              <div className="eo-consequences">
                <h4>Consequences:</h4>
                <ul>
                  <li>The official will be permanently deactivated.</li>
                  <li>This is more severe than suspension.</li>
                  <li>Reactivation may require re-verification.</li>
                </ul>
              </div>
            </div>
            <div className="eo-modal-footer">
              <button className="eo-btn eo-btn-secondary" onClick={() => { setShowDisable(false); setDisablingOfficial(null); }}>
                Cancel
              </button>
              <button className="eo-btn eo-btn-danger" onClick={handleDisable}>
                Disable Official
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EXPORT MODAL ========== */}
      {showExport && (
        <div className="eo-overlay" onClick={() => setShowExport(false)}>
          <div className="eo-modal eo-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="eo-modal-header">
              <h2 className="eo-modal-title">Export Officials</h2>
              <button className="eo-modal-close" onClick={() => setShowExport(false)}>
                <Icon name="x" size="sm" />
              </button>
            </div>
            <div className="eo-modal-body">
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Export {filteredOfficials.length > 0 ? filteredOfficials.length : officials.length} official records.
                {filteredOfficials.length > 0 && filteredOfficials.length !== officials.length && (
                  <span> (filtered from {officials.length} total)</span>
                )}
              </p>
              <div className="eo-export-buttons">
                <button className="eo-btn eo-btn-primary" onClick={() => handleExport("csv")}>
                  <Icon name="download" />
                  <span>Export CSV</span>
                </button>
                <button className="eo-btn eo-btn-success" onClick={() => handleExport("excel")}>
                  <Icon name="download" />
                  <span>Export Excel</span>
                </button>
                <button className="eo-btn eo-btn-secondary" onClick={() => handleExport("pdf")}>
                  <Icon name="download" />
                  <span>Export PDF (Print)</span>
                </button>
              </div>
            </div>
            <div className="eo-modal-footer">
              <button className="eo-btn eo-btn-secondary" onClick={() => setShowExport(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionOfficialsManagement;