import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { hashPassword, validatePassword } from "../utils/security";
import { kenyaLocations } from "../data/kenyaLocations";
import { getPositionIndex } from "../utils/electionFilters";
import { validatePhotoFile, uploadCandidatePhoto } from '../services/storageService';
import BulkVoterUpload from "./BulkVoterUpload";
import VoterRegistrationRequests from "./VoterRegistrationRequests";
import AIAdminDashboard from "./ai-admin/AIAdminDashboard";
import AIIntegrityMonitor from "./ai-integrity/AIIntegrityMonitor";
import AIReportGenerator from "./ai-report/AIReportGenerator";
import ElectionOfficialsManagement from "./ElectionOfficialsManagement";

const POSITIONS = [
  { value: "", label: "Select Position" },
  { value: "President", label: "President" },
  { value: "Governor", label: "Governor" },
  { value: "Senator", label: "Senator" },
  { value: "Woman Representative", label: "Woman Representative" },
  { value: "Member of Parliament", label: "Member of Parliament" },
  { value: "Member of County Assembly", label: "Member of County Assembly" },
];

const ADMIN_ROLES = [
  { value: "", label: "Select Role" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "IEBC Admin", label: "IEBC Admin" },
  { value: "County Officer", label: "County Officer" },
  { value: "Constituency Officer", label: "Constituency Officer" },
];

const AdminPanel = ({
  account,
  contract,
  candidates = [],
  electionStarted,
  electionEnded,
  isAdmin,
  adminAddress,
  isLoading = false,
  error = "",
  actionStatus = "",
  onAddCandidate,
  onStartElection,
  onEndElection,
  onRegisterVoter,
  onBulkRegisterVoters,
  onRefresh,
  // Super Admin authorization props
  isSuperAdmin = false,
  isSuperAdminVerified = false,
  userRole = null,
  userRoleName = '',
}) => {
  // Candidate form state
  const [candidateData, setCandidateData] = useState({
    name: "",
    party: "",
    candidateCode: "",
    position: "",
    county: "",
    constituency: "",
    ward: "",
    imageUrl: "",
  });

  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Admin management state
  const [adminUserData, setAdminUserData] = useState({
    username: "",
    walletAddress: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [voterAddress, setVoterAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Confirmation modal state
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Duplicate-submission guard for election lifecycle confirmations
  const [isConfirming, setIsConfirming] = useState(false);

  // Active admin section (for sidebar navigation)
  const [activeSection, setActiveSection] = useState("dashboard");

  // Registration requests state for AI Dashboard
  const [registrationRequests, setRegistrationRequests] = useState([]);

  // Total votes state for AI Dashboard
  const [totalVotesCount, setTotalVotesCount] = useState(0);

  // Derived location data
  const [availableConstituencies, setAvailableConstituencies] = useState([]);
  const [availableWards, setAvailableWards] = useState([]);

  // Debug logging
  useEffect(() => {
    console.log("Main contract admin:", adminAddress);
  }, [adminAddress]);

  // Update constituencies when county changes
  useEffect(() => {
    if (candidateData.county && candidateData.position !== "President") {
      const county = kenyaLocations.counties.find(
        (c) => c.name.toLowerCase() === candidateData.county.toLowerCase()
      );
      if (county && county.constituencies) {
        setAvailableConstituencies(county.constituencies.map((c) => c.name));
      } else {
        setAvailableConstituencies([]);
      }
      setCandidateData((prev) => ({ ...prev, constituency: "", ward: "" }));
      setAvailableWards([]);
    } else {
      setAvailableConstituencies([]);
      setAvailableWards([]);
    }
  }, [candidateData.county, candidateData.position]);

  // Update wards when constituency changes
  useEffect(() => {
    if (
      candidateData.county &&
      candidateData.constituency &&
      candidateData.position === "Member of County Assembly"
    ) {
      const county = kenyaLocations.counties.find(
        (c) => c.name.toLowerCase() === candidateData.county.toLowerCase()
      );
      if (county) {
        const constituency = county.constituencies.find(
          (c) => c.name.toLowerCase() === candidateData.constituency.toLowerCase()
        );
        if (constituency && constituency.wards) {
          setAvailableWards(constituency.wards);
        } else {
          setAvailableWards([]);
        }
      }
    } else {
      setAvailableWards([]);
    }
  }, [candidateData.constituency, candidateData.county, candidateData.position]);

  // Fetch registration requests for AI Dashboard
  useEffect(() => {
    const requestsRef = collection(db, 'voterRegistrationRequests');
    let unsubscribe = null;
    
    const setupRequestsListener = () => {
      try {
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const requests = [];
          snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setRegistrationRequests(requests);
        });
      } catch (err) {
        console.warn('Error setting up requests listener, trying without orderBy:', err);
        unsubscribe = onSnapshot(requestsRef, (snapshot) => {
          const requests = [];
          snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setRegistrationRequests(requests);
        });
      }
    };

    setupRequestsListener();
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Calculate total votes from candidates
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      const total = candidates.reduce((sum, c) => sum + Number(c?.voteCount || 0), 0);
      setTotalVotesCount(total);
    } else {
      setTotalVotesCount(0);
    }
  }, [candidates]);

  // Fetch admin users on mount
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "adminUsers"));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setAdminUsers(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("adminUsers");
        if (stored) {
          setAdminUsers(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Fallback to localStorage failed:", e);
      }
    }
  };

  const isBusy = isLoading || isUploading || isProcessingPhoto;

  // Check if current position requires location fields
  const getLocationRequirements = (position) => {
    switch (position) {
      case "President":
        return { showCounty: false, showConstituency: false, showWard: false, location: "National" };
      case "Governor":
      case "Senator":
      case "Woman Representative":
        return { showCounty: true, showConstituency: false, showWard: false, location: "County" };
      case "Member of Parliament":
        return { showCounty: true, showConstituency: true, showWard: false, location: "Constituency" };
      case "Member of County Assembly":
        return { showCounty: true, showConstituency: true, showWard: true, location: "Ward" };
      default:
        return { showCounty: false, showConstituency: false, showWard: false, location: "" };
    }
  };

  const locationReqs = getLocationRequirements(candidateData.position);

  const showError = (err) => {
    console.error(err);
    setStatus(`Error: ${err?.message || "Transaction failed"}`);
  };

  const handleRegisterVoter = async () => {
    const value = voterAddress.trim();

    if (!value) {
      setStatus("Please enter a wallet address");
      return;
    }

    if (!ethers.isAddress(value)) {
      setStatus("Please enter a valid Ethereum wallet address");
      return;
    }

    try {
      setStatus("Waiting for MetaMask confirmation...");
      // FIX: Pass all 4 required parameters to contract.registerVoter()
      // The contract expects: registerVoter(address, string, string, string)
      // We pass empty strings for county, constituency, ward since AdminPanel
      // doesn't have location fields for voter registration
      await onRegisterVoter(value, '', '', '');
      setStatus("✅ Voter registered successfully");
      setVoterAddress("");
      await onRefresh?.();
    } catch (err) {
      showError(err);
    }
  };

  // Photo handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error);
      setSelectedPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      return;
    }

    setPhotoError('');
    setSelectedPhoto(file);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    setPhotoError('');
    const fileInput = document.getElementById('admin-candidate-photo-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleAddCandidate = async () => {
    const name = candidateData.name.trim();
    const party = candidateData.party.trim();
    const candidateCode = candidateData.candidateCode.trim();
    const position = candidateData.position;

    // Debug logging
    console.log('[AdminPanel] handleAddCandidate called with:', {
      name,
      party,
      candidateCode,
      position,
      county: candidateData.county,
      constituency: candidateData.constituency,
      ward: candidateData.ward,
    });
    console.log('[AdminPanel] Connected wallet:', account);
    console.log('[AdminPanel] Is admin:', isAdmin);
    console.log('[AdminPanel] Admin address:', adminAddress);

    // Validation
    if (!name) {
      setStatus("Please enter a candidate name");
      return;
    }

    if (!party) {
      setStatus("Please enter a candidate party");
      return;
    }

    if (!candidateCode) {
      setStatus("Please enter a candidate code");
      return;
    }

    if (!position) {
      setStatus("Please select a position");
      return;
    }

    // Location validation based on position
    if (position !== "President") {
      if (!candidateData.county) {
        setStatus("Please select a county");
        return;
      }
      if (
        (position === "Member of Parliament" || position === "Member of County Assembly") &&
        !candidateData.constituency
      ) {
        setStatus("Please select a constituency");
        return;
      }
      if (position === "Member of County Assembly" && !candidateData.ward) {
        setStatus("Please select a ward");
        return;
      }
    }

    // Build candidate location info
    const candidateLocation = {
      position,
      county: locationReqs.showCounty ? candidateData.county : "",
      constituency: locationReqs.showConstituency ? candidateData.constituency : "",
      ward: locationReqs.showWard ? candidateData.ward : "",
      location: locationReqs.location,
    };

    // CRITICAL FIX: Calculate positionIndex from position string
    const positionIndex = getPositionIndex(position);
    
    console.log('[AdminPanel] Calculated positionIndex:', positionIndex, 'for position:', position);

    if (positionIndex < 0 || positionIndex > 5) {
      setStatus(`Invalid position index: ${positionIndex}. Please select a valid position.`);
      return;
    }

    try {
      // Process photo if selected - uses Base64 conversion (no Firebase Storage)
      let photoUrl = candidateData.imageUrl || '';
      if (selectedPhoto) {
        setIsProcessingPhoto(true);
        setStatus("Processing Image...");
        const tempId = `admin_${Date.now()}`;
        photoUrl = await uploadCandidatePhoto(
          selectedPhoto,
          tempId
        );
        setIsProcessingPhoto(false);
      }

      setStatus("Creating Candidate...");

      // Call blockchain addCandidate with name and positionIndex
      await onAddCandidate({
        name,
        party,
        candidateCode,
        position,
        positionIndex,
        county: candidateData.county,
        constituency: candidateData.constituency,
        ward: candidateData.ward,
        location: locationReqs.location,
        imageUrl: photoUrl,
      });

      console.log('[AdminPanel] Candidate added successfully to blockchain');

      setStatus("✅ Candidate added successfully");
      setCandidateData({
        name: "",
        party: "",
        candidateCode: "",
        position: "",
        county: "",
        constituency: "",
        ward: "",
        imageUrl: "",
      });
      handleRemovePhoto();
      await onRefresh?.();
    } catch (err) {
      console.error('[AdminPanel] Error adding candidate:', err);
      showError(err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleStartElection = async () => {
    setShowStartConfirm(true);
  };

  const confirmStartElection = async () => {
    if (isConfirming) return; // Prevent duplicate submissions
    setShowStartConfirm(false);
    setIsConfirming(true);
    try {
      setStatus("Waiting for MetaMask confirmation...");
      const result = await onStartElection();
      // Only mark success if the on-chain read confirms the election actually started
      setStatus(result?.message || "✅ Election started successfully");
      await onRefresh?.();
    } catch (err) {
      showError(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEndElection = async () => {
    setShowEndConfirm(true);
  };

  const confirmEndElection = async () => {
    if (isConfirming) return; // Prevent duplicate submissions
    setShowEndConfirm(false);
    setIsConfirming(true);
    try {
      setStatus("Waiting for MetaMask confirmation...");
      const result = await onEndElection();
      setStatus(result?.message || "✅ Election ended successfully");
      await onRefresh?.();
    } catch (err) {
      showError(err);
    } finally {
      setIsConfirming(false);
    }
  };


  const handleBulkUpload = async (file) => {
    if (!file) {
      setStatus("Please select a CSV or TXT file");
      return;
    }

    if (!onBulkRegisterVoters) {
      setStatus("Bulk voter upload is not connected in the frontend");
      return;
    }

    setIsUploading(true);

    try {
      setStatus("Uploading and processing voter list...");
      const result = await onBulkRegisterVoters(file);
      setStatus(
        `✅ Bulk upload completed${
          result?.count ? `: ${result.count} voter(s) registered` : ""
        }`
      );
      await onRefresh?.();
    } catch (err) {
      showError(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Admin Management handlers
  const handleAdminPasswordChange = (value) => {
    setAdminUserData((prev) => ({ ...prev, password: value }));
    if (value) {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleAddAdminUser = async () => {
    const { username, walletAddress, password, confirmPassword, role } = adminUserData;

    // Validation
    if (!username.trim()) {
      setStatus("Please enter an admin username");
      return;
    }

    if (!walletAddress.trim()) {
      setStatus("Please enter an admin wallet address");
      return;
    }

    if (!ethers.isAddress(walletAddress)) {
      setStatus("Please enter a valid Ethereum wallet address");
      return;
    }

    if (!role) {
      setStatus("Please select a role");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setStatus(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
      return;
    }

    try {
      setStatus("Creating admin user...");
      console.log("Creating admin user:", walletAddress, role);

      // Hash the password
      const passwordHash = await hashPassword(password);

      const adminRecord = {
        username: username.trim(),
        walletAddress: walletAddress.toLowerCase(),
        passwordHash,
        role,
        createdBy: account,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      // Try Firestore first, fallback to localStorage
      try {
        await addDoc(collection(db, "adminUsers"), adminRecord);
        console.log("Admin user saved to Firestore");
      } catch (firestoreError) {
        console.warn("Firestore failed, using localStorage fallback:", firestoreError);
        // Fallback to localStorage
        const stored = localStorage.getItem("adminUsers");
        const users = stored ? JSON.parse(stored) : [];
        users.push({ ...adminRecord, id: Date.now().toString() });
        localStorage.setItem("adminUsers", JSON.stringify(users));
        console.log("Admin user saved to localStorage");
      }

      setStatus("✅ Admin user created successfully");
      setAdminUserData({
        username: "",
        walletAddress: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
      setPasswordErrors([]);
      await fetchAdminUsers();
    } catch (err) {
      showError(err);
    }
  };

  const handleDeactivateAdmin = async (adminId) => {
    try {
      // Try Firestore first
      try {
        const adminRef = doc(db, "adminUsers", adminId);
        await updateDoc(adminRef, { status: "inactive", updatedAt: new Date().toISOString() });
      } catch (firestoreError) {
        // Fallback to localStorage
        const stored = localStorage.getItem("adminUsers");
        if (stored) {
          const users = JSON.parse(stored);
          const updatedUsers = users.map((u) =>
            u.id === adminId ? { ...u, status: "inactive" } : u
          );
          localStorage.setItem("adminUsers", JSON.stringify(updatedUsers));
        }
      }
      await fetchAdminUsers();
      setStatus("✅ Admin user deactivated");
    } catch (err) {
      showError(err);
    }
  };

  // Check if user is main contract admin
  const isMainAdmin = isAdmin && account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase();

  // Super Admin override via isSuperAdmin prop (from useSuperAdmin hook)
  // This is the definitive check for election lifecycle authority
  const hasElectionLifecycleAuthority = (typeof isSuperAdmin !== 'undefined') ? isSuperAdmin : isMainAdmin;
  
  // Debug logging for lifecycle authority
  console.log('[AdminPanel] 🔑 Lifecycle authority check:', {
    isSuperAdmin,
    isSuperAdminVerified,
    hasElectionLifecycleAuthority,
    userRoleName,
    account: account?.slice(0, 10),
    isMainAdmin,
  });

  // Show warning for non-main-admin users
  const showAdminWarning = isAdmin && !isMainAdmin;

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <h2 className="text-2xl font-bold text-red-700 mb-2">
          Admin Panel Locked
        </h2>
        <p className="text-gray-700">
          Connect with the contract admin wallet to access admin privileges.
        </p>
      </div>
    );
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "officials", label: "Election Officials", icon: "👥" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex-shrink-0 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">DeVote Admin</h2>
          <p className="text-xs text-gray-400 mt-1">Election Management Panel</p>
        </div>
        
        <div className="mb-4 px-3 py-2 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">Admin</p>
          <p className="text-sm font-mono truncate text-gray-300">{account ? account.slice(0, 10) + "..." : "Not connected"}</p>
          <div className="mt-1 px-2 py-0.5 bg-green-900 text-green-300 text-xs rounded-full inline-block">
            Admin Privileges Active
          </div>
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        {activeSection === "officials" ? (
          /* ========== ELECTION OFFICIALS MANAGEMENT ========== */
          <ElectionOfficialsManagement
            account={account}
            contract={contract}
            isMainAdmin={isMainAdmin}
            adminAddress={adminAddress}
          />
        ) : (
          /* ========== DASHBOARD (Existing Admin Panel Content) ========== */
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
                <p className="text-gray-500 text-sm mt-1">Manage election settings, candidates, and operations</p>
              </div>
            </div>

            {/* Action/Error Status - surface errors from lifecycle actions instead of hiding them */}
            {status && (
              <div className={`mb-4 p-4 rounded-lg border ${
                status.startsWith("✅") || status.toLowerCase().includes("success")
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <p className="text-sm font-medium">{status}</p>
              </div>
            )}

            {showAdminWarning && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ This wallet has dashboard access, but blockchain admin actions require the main contract admin wallet.
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Main admin: {adminAddress || "Not detected"}
                </p>
              </div>
            )}

            {/* AI Admin Dashboard */}
            <AIAdminDashboard
              candidates={candidates}
              registrationRequests={registrationRequests}
              electionStarted={electionStarted}
              electionEnded={electionEnded}
              totalVotes={totalVotesCount}
              onRefresh={onRefresh}
            />

            {/* AI Report Generator */}
            <AIReportGenerator
              candidates={candidates}
              registrationRequests={registrationRequests}
              electionStarted={electionStarted}
              electionEnded={electionEnded}
              onRefresh={onRefresh}
            />

            {/* Admin Actions */}
            <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Admin account:</span>{" "}
                {account || "Not connected"}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Candidates loaded:</span>{" "}
                {candidates.length}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Election started:</span>{" "}
                {electionStarted ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Election ended:</span>{" "}
                {electionEnded ? "Yes" : "No"}
              </p>
            </div>

            <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                Register Voter
              </h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={voterAddress}
                  onChange={(e) => setVoterAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  disabled={isBusy}
                />
                <button
                  onClick={handleRegisterVoter}
                  disabled={isBusy || !voterAddress.trim()}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Register"}
                </button>
              </div>
            </div>

            {/* Add Candidate Section */}
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Add Candidate
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Candidate Name *</label>
                  <input
                    type="text"
                    value={candidateData.name}
                    onChange={(e) => setCandidateData({...candidateData, name: e.target.value})}
                    placeholder="Full name..."
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isBusy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Party *</label>
                  <input
                    type="text"
                    value={candidateData.party}
                    onChange={(e) => setCandidateData({...candidateData, party: e.target.value})}
                    placeholder="Political party..."
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isBusy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Candidate Code *</label>
                  <input
                    type="text"
                    value={candidateData.candidateCode}
                    onChange={(e) => setCandidateData({...candidateData, candidateCode: e.target.value})}
                    placeholder="Unique candidate code..."
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isBusy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Position *</label>
                  <select
                    value={candidateData.position}
                    onChange={(e) => setCandidateData({...candidateData, position: e.target.value, county: "", constituency: "", ward: ""})}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    disabled={isBusy}
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                </div>
                {locationReqs.showCounty && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">County *</label>
                    <select
                      value={candidateData.county}
                      onChange={(e) => setCandidateData({...candidateData, county: e.target.value, constituency: "", ward: ""})}
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      disabled={isBusy}
                    >
                      <option value="">Select County</option>
                      {kenyaLocations.counties.map((county) => (
                        <option key={county.id} value={county.name}>{county.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {locationReqs.showConstituency && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Constituency *</label>
                    <select
                      value={candidateData.constituency}
                      onChange={(e) => setCandidateData({...candidateData, constituency: e.target.value, ward: ""})}
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      disabled={isBusy || availableConstituencies.length === 0}
                    >
                      <option value="">Select Constituency</option>
                      {availableConstituencies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {locationReqs.showWard && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Ward *</label>
                    <select
                      value={candidateData.ward}
                      onChange={(e) => setCandidateData({...candidateData, ward: e.target.value})}
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      disabled={isBusy || availableWards.length === 0}
                    >
                      <option value="">Select Ward</option>
                      {availableWards.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Candidate Photograph</label>
                  {!photoPreview ? (
                    <div className="mt-1 flex justify-center px-4 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="admin-candidate-photo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload Image</span>
                            <input id="admin-candidate-photo-upload" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoSelect} className="sr-only" disabled={isBusy} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">JPG, JPEG, PNG, WEBP (Max 5 MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="relative inline-block">
                        <img src={photoPreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm" />
                        <button type="button" onClick={handleRemovePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md" disabled={isBusy}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Click X to remove and select a different image</p>
                    </div>
                  )}
                  {isProcessingPhoto && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Image...</span>
                      </div>
                    </div>
                  )}
                  {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAddCandidate}
                  disabled={isBusy || !candidateData.name.trim() || !candidateData.party.trim() || !candidateData.candidateCode.trim() || !candidateData.position}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Add Candidate"}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <BulkVoterUpload isLoading={isBusy} onUpload={handleBulkUpload} />
            </div>

            {/* ELECTION LIFECYCLE CONTROLS - Super Admin ONLY */}
            {/* SECURITY: These controls are COMPLETELY HIDDEN for non-Super Admin users */}
            {/* Even if a malicious user tries to manually invoke startElection()/endElection(), */}
            {/* the backend guard in useElection hook will reject the request */}
            {hasElectionLifecycleAuthority && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-900">Election Lifecycle Controls</h3>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-semibold text-green-800">🟢 Super Admin</span>
                  </div>
                </div>
                <p className="text-sm text-green-700 mb-4">Election Lifecycle Authority — Only you can control the election lifecycle.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={handleStartElection}
                    disabled={isBusy || electionStarted}
                    className="p-6 bg-green-100 rounded-xl hover:shadow-lg disabled:opacity-50 text-left"
                  >
                    <span className="text-lg font-semibold">{electionStarted ? "Election Already Started" : "▶ Start Election"}</span>
                  </button>
                  <button
                    onClick={handleEndElection}
                    disabled={isBusy || !electionStarted || electionEnded}
                    className="p-6 bg-red-100 rounded-xl hover:shadow-lg disabled:opacity-50 text-left"
                  >
                    <span className="text-lg font-semibold">{electionEnded ? "Election Already Ended" : "⏹ End Election"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Admin Management Section - Only for main contract admin */}
            {isMainAdmin && (
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Admin Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">Admin Username *</label>
                    <input type="text" value={adminUserData.username} onChange={(e) => setAdminUserData({...adminUserData, username: e.target.value})} placeholder="Enter username..." className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" disabled={isBusy} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">Admin Wallet Address *</label>
                    <input type="text" value={adminUserData.walletAddress} onChange={(e) => setAdminUserData({...adminUserData, walletAddress: e.target.value})} placeholder="0x..." className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" disabled={isBusy} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">Password *</label>
                    <input type="password" value={adminUserData.password} onChange={(e) => handleAdminPasswordChange(e.target.value)} placeholder="Enter strong password..." className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" disabled={isBusy} />
                    {passwordErrors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {passwordErrors.map((err, idx) => (<div key={idx}>• {err}</div>))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">Confirm Password *</label>
                    <input type="password" value={adminUserData.confirmPassword} onChange={(e) => setAdminUserData({...adminUserData, confirmPassword: e.target.value})} placeholder="Confirm password..." className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" disabled={isBusy} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-purple-700 mb-2">Role *</label>
                    <select value={adminUserData.role} onChange={(e) => setAdminUserData({...adminUserData, role: e.target.value})} className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white" disabled={isBusy}>
                      {ADMIN_ROLES.map((role) => (<option key={role.value} value={role.value}>{role.label}</option>))}
                    </select>
                  </div>
                </div>
                <button onClick={handleAddAdminUser} disabled={isBusy || !adminUserData.username.trim() || !adminUserData.walletAddress.trim() || !adminUserData.password || !adminUserData.role} className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6">
                  {isLoading ? "Processing..." : "Create Admin User"}
                </button>
                {adminUsers.length > 0 && (
                  <div className="overflow-x-auto">
                    <h4 className="text-md font-semibold text-purple-900 mb-3">Existing Admin Users</h4>
                    <table className="w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-purple-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Wallet</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Created</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((admin, index) => (
                          <tr key={admin.id || index} className="border-b border-purple-100 hover:bg-purple-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{admin.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">{admin.walletAddress?.slice(0, 10)}...{admin.walletAddress?.slice(-8)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{admin.role}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${admin.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{admin.status}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-700">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}</td>
                            <td className="px-4 py-3">{admin.status === "active" && (<button onClick={() => handleDeactivateAdmin(admin.id)} className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200" disabled={isBusy}>Deactivate</button>)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Voter Registration Requests Section */}
            <div className="mt-8">
              <VoterRegistrationRequests onApproveVoter={onRegisterVoter} />
            </div>

            {/* DeVote AI Integrity Monitor - moved to bottom as final section */}
            <AIIntegrityMonitor onRefresh={onRefresh} />

            {(status || actionStatus) && (
              <div className="p-4 rounded-xl border bg-yellow-50 text-yellow-800 mt-4">{status || actionStatus}</div>
            )}
            {error && (
              <div className="p-4 rounded-xl border bg-red-50 text-red-800 mt-4">{error}</div>
            )}

            {/* Start Election Confirmation Modal */}
            {showStartConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start Election?</h3>
                    <p className="text-gray-600 mb-4">You are about to start the election with <strong>{candidates.length} candidates</strong>.</p>
                    {candidates.length === 0 && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                        <p className="text-sm text-red-800 font-medium">
                          ⚠️ No candidates are registered on the blockchain yet.
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          The contract requires at least one candidate (candidatesCount &gt; 0) before the
                          election can be started. Use "Add Candidate" to register candidates on-chain first.
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mb-6">This action will be recorded on the blockchain and cannot be undone.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowStartConfirm(false)} disabled={isLoading || isConfirming} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                    <button
                      onClick={confirmStartElection}
                      disabled={isLoading || isConfirming || candidates.length === 0}
                      className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || isConfirming
                        ? "Processing..."
                        : candidates.length === 0
                          ? "Add Candidates First"
                          : "Start Election"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* End Election Confirmation Modal */}
            {showEndConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                      <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">End Election?</h3>
                    <p className="text-gray-600 mb-4">Total votes cast: <strong>{totalVotesCount}</strong>.</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                      <p className="text-sm text-red-800 font-medium">⚠️ WARNING: This action cannot be reversed.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowEndConfirm(false)} disabled={isLoading || isConfirming} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                    <button onClick={confirmEndElection} disabled={isLoading || isConfirming} className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">{isLoading || isConfirming ? "Processing..." : "End Election"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
