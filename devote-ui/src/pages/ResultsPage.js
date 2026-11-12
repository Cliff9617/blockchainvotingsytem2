import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import {
  filterResultsForVoter,
  groupCandidatesByPosition,
  getPositionCounts,
  normalizePosition,
  POSITIONS,
  POSITION_NAMES,
  getPositionDisplayName,
  calculateWinnersByPosition,
  getWinnerAreaDescription,
} from "../utils/electionFilters";

const ResultsPage = ({
  candidates = [],
  electionStarted = false,
  electionEnded = false,
  isLoading: parentLoading = false,
  onRefresh,
  isConnected = false,
  onConnectWallet,
  account,
  onNavigate,
  contract,
  onLoadElectionData,
  voter = null,
  getWinnersByPosition,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [networkName, setNetworkName] = useState("Sepolia");

  // Local loading state - starts as true
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState("");

  // Position tabs configuration - matching the standardized positions
  const positionTabs = [
    { id: "All", label: "All Positions" },
    { id: POSITIONS.PRESIDENT, label: "President" },
    { id: POSITIONS.GOVERNOR, label: "Governor" },
    { id: POSITIONS.SENATOR, label: "Senator" },
    { id: POSITIONS.WOMAN_REPRESENTATIVE, label: "Women Rep" },
    { id: POSITIONS.MEMBER_OF_PARLIAMENT, label: "Parliament" },
    { id: POSITIONS.MCA, label: "County Assembly" },
  ];

  // Detect network name
  useEffect(() => {
    const detectNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (chainId === "0x267") {
            setNetworkName("Lisk Sepolia");
          } else {
            setNetworkName("Sepolia");
          }
        } catch {
          setNetworkName("Sepolia");
        }
      }
    };
    detectNetwork();
  }, []);

  // Load results on mount - runs ONLY ONCE with empty dependency array
  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      console.log("ResultsPage: Starting load...");

      try {
        // If we have a contract and a load function from parent, use it
        if (contract && typeof onLoadElectionData === "function") {
          await onLoadElectionData();
        }

        if (!mounted) return;

        setLastUpdated(new Date().toLocaleTimeString());
        console.log("ResultsPage: Load successful, candidates:", candidates.length);
      } catch (err) {
        console.error("ResultsPage: Loading error:", err);
        if (mounted) {
          setResultsError(err.message || "Failed to load results");
        }
      } finally {
        if (mounted) {
          setResultsLoading(false);
          console.log("ResultsPage: Loading finished, setting loading to false");
        }
      }
    };

    loadResults();

    return () => {
      mounted = false;
    };
  }, []); // EMPTY dependency array - runs only once on mount

  // Normalize candidate data
  const normalizeCandidate = (candidate, index) => {
    return {
      id: candidate?.id ?? candidate?.candidateId ?? candidate?.blockchainId ?? index,
      name: candidate?.name ?? candidate?.candidateName ?? "Unknown Candidate",
      voteCount: Number(candidate?.voteCount ?? candidate?.votes ?? candidate?.totalVotes ?? 0),
      party: candidate?.party ?? candidate?.Party ?? "Independent",
      position: normalizePosition(candidate?.position ?? candidate?.office ?? "president"),
      positionIndex: candidate?.positionIndex ?? null,
      county: candidate?.county ?? "",
      constituency: candidate?.constituency ?? "",
      ward: candidate?.ward ?? "",
      imageUrl: candidate?.imageUrl ?? "",
      blockchainId: candidate?.blockchainId ?? candidate?.id?.toString() ?? "",
    };
  };

  // Normalize location-filtered candidates
  const normalizedCandidates = useMemo(() => {
    return candidates.map(normalizeCandidate);
  }, [candidates]);

  // Filter candidates by voter location first
  const locationFilteredCandidates = useMemo(() => {
    console.log("[ResultsPage] Filtering candidates for voter:", voter);
    const filtered = filterResultsForVoter(normalizedCandidates, voter);
    console.log("[ResultsPage] Location filtered candidates:", filtered.length);
    return filtered;
  }, [normalizedCandidates, voter]);

  // Filter candidates by position
  const filteredCandidates = useMemo(() => {
    if (activeTab === "All") return locationFilteredCandidates;
    const normalizedTab = normalizePosition(activeTab);
    console.log("[ResultsPage] Filtering by position:", activeTab, "normalized:", normalizedTab);
    return locationFilteredCandidates.filter(
      (c) => c.position === normalizedTab
    );
  }, [locationFilteredCandidates, activeTab]);

  // Sort candidates by vote count (descending)
  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      const voteA = Number(a?.voteCount || 0);
      const voteB = Number(b?.voteCount || 0);
      return voteB - voteA;
    });
  }, [filteredCandidates]);

  // Calculate total votes for the current position
  const totalVotesForPosition = useMemo(() => {
    return sortedCandidates.reduce(
      (sum, c) => sum + Number(c?.voteCount || 0),
      0
    );
  }, [sortedCandidates]);

  // Overall total votes
  const totalVotes = useMemo(() => {
    return normalizedCandidates.reduce((sum, c) => sum + Number(c?.voteCount || 0), 0);
  }, [normalizedCandidates]);

  // Find leading candidate overall
  const leadingCandidate = useMemo(() => {
    if (normalizedCandidates.length === 0) return null;
    const sorted = [...normalizedCandidates].sort(
      (a, b) => Number(b?.voteCount || 0) - Number(a?.voteCount || 0)
    );
    return sorted[0];
  }, [normalizedCandidates]);

  // Find leading party
  const leadingParty = useMemo(() => {
    if (!leadingCandidate) return null;
    return leadingCandidate.party || leadingCandidate.Party || "N/A";
  }, [leadingCandidate]);

  // Calculate percentage safely
  const getPercentage = (votes) => {
    if (totalVotesForPosition === 0) return "0.0";
    return ((Number(votes || 0) / totalVotesForPosition) * 100).toFixed(1);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setResultsLoading(true);
    setResultsError("");
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (typeof onLoadElectionData === "function") {
        await onLoadElectionData();
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Refresh failed:", err);
      setResultsError(err.message || "Failed to refresh results");
    } finally {
      setResultsLoading(false);
    }
  };

  // Format time
  const formatTime = (date) => {
    if (typeof date === "string") return date;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get winners by position
  const winnersByPosition = useMemo(() => {
    if (getWinnersByPosition) {
      return getWinnersByPosition();
    }
    return calculateWinnersByPosition(normalizedCandidates, voter);
  }, [normalizedCandidates, voter, getWinnersByPosition]);

  // Loading state - skeleton loader ONLY when resultsLoading is true
  if (resultsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onConnectWallet={onConnectWallet}
          isConnected={isConnected}
          account={account}
          onNavigate={onNavigate}
        />

        {/* Header skeleton */}
        <section className="bg-dark-green-gradient text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-4 w-full md:w-auto">
                <div className="h-8 bg-white/20 rounded-full w-48 animate-pulse"></div>
                <div className="h-12 bg-white/20 rounded w-64 animate-pulse"></div>
                <div className="h-6 bg-white/10 rounded w-96 animate-pulse"></div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 bg-white/20 rounded-xl w-40 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats skeleton */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-dark-green-800 bg-opacity-95 rounded-2xl shadow-xl p-6 md:p-8 -mt-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-dark-green-600 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-dark-green-600 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs skeleton */}
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Results skeleton */}
        <section className="py-6 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-4 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Error state (only if loading is false AND there's an error AND no candidates)
  if (resultsError && normalizedCandidates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onConnectWallet={onConnectWallet}
          isConnected={isConnected}
          account={account}
          onNavigate={onNavigate}
        />

        <section className="py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Unable to load blockchain results
              </h3>
              <p className="text-gray-500 text-lg mb-6">{resultsError}</p>
              <button
                onClick={handleRefresh}
                className="bg-dark-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-dark-green-700 transition-all duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // MAIN CONTENT - Show results (even if empty)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
      />

      {/* 1. Hero/Header Section */}
      <section className="bg-dark-green-gradient text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  Live Tally from Blockchain
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                  {networkName}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                Election Results
              </h1>
              <p className="text-dark-green-100 text-lg max-w-xl">
                Transparent, real-time vote counts directly from the blockchain.
                Every vote is verified and immutable.
              </p>
              {voter && (
                <div className="mt-2 p-3 bg-white/10 rounded-lg">
                  <p className="text-dark-green-200 text-sm">
                    📍 Viewing results for your registered area:
                  </p>
                  <p className="text-white text-sm mt-1">
                    <strong>County:</strong> {voter.county || 'Not specified'} • 
                    <strong> Constituency:</strong> {voter.constituency || 'Not specified'} • 
                    <strong> Ward:</strong> {voter.ward || 'Not specified'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <button
                onClick={handleRefresh}
                disabled={resultsLoading}
                className={`flex items-center gap-2 bg-white text-dark-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-dark-green-50 transition-all duration-200 shadow-lg hover:shadow-xl ${
                  resultsLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <svg
                  className={`w-5 h-5 ${resultsLoading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {resultsLoading ? "Loading..." : "Refresh Results"}
              </button>
              <p className="text-dark-green-200 text-sm">
                Last updated: {formatTime(lastUpdated)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Summary Stats Card */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-dark-green-800 bg-opacity-95 rounded-2xl shadow-xl p-6 md:p-8 -mt-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Total Votes Cast */}
              <div className="text-center md:text-left">
                <p className="text-dark-green-200 text-sm font-medium uppercase tracking-wider mb-1">
                  Total Votes Cast
                </p>
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {totalVotes.toLocaleString()}
                </p>
              </div>

              {/* Currently Leading Candidate */}
              <div className="text-center md:text-left">
                <p className="text-dark-green-200 text-sm font-medium uppercase tracking-wider mb-1">
                  Leading Candidate
                </p>
                <p className="text-xl md:text-2xl font-bold text-white truncate">
                  {leadingCandidate
                    ? leadingCandidate.name || "Unknown"
                    : "No leader yet"}
                </p>
              </div>

              {/* Leading Party */}
              <div className="text-center md:text-left">
                <p className="text-dark-green-200 text-sm font-medium uppercase tracking-wider mb-1">
                  Leading Party
                </p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {leadingParty || "Pending"}
                </p>
              </div>

              {/* Blockchain Network */}
              <div className="text-center md:text-left">
                <p className="text-dark-green-200 text-sm font-medium uppercase tracking-wider mb-1">
                  Blockchain Network
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {networkName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sign-in prompt for non-logged-in users */}
      {!voter && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-800 font-medium">
                📍 Viewing national results only (Presidential)
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Sign in to view county, constituency, and ward results for your registered area.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Position Tabs */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
            {positionTabs.map((tab) => {
              const count = tab.id === "All" 
                ? locationFilteredCandidates.length 
                : locationFilteredCandidates.filter(c => c.position === normalizePosition(tab.id)).length;
              
              if (tab.id !== "All" && count === 0) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-dark-green-600 text-white shadow-lg scale-105"
                      : "bg-white text-gray-700 hover:bg-dark-green-50 border border-gray-200"
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Results List Section */}
      <section className="py-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sortedCandidates.length === 0 ? (
            /* 5. Empty State */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {activeTab === "All"
                  ? "No results available yet"
                  : `No candidates available for ${getPositionDisplayName(activeTab)} in your area yet.`}
              </h3>
              <p className="text-gray-500 text-lg mb-6">
                {activeTab === "All"
                  ? "Results will appear once candidates are added and votes are cast."
                  : "Results will appear once candidates are added for this position in your area."}
              </p>
              {activeTab !== "All" && (
                <p className="text-gray-400 text-sm">
                  Try selecting a different position.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Position header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeTab === "All"
                      ? "All Positions"
                      : `${getPositionDisplayName(activeTab)} Results`}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {sortedCandidates.length} candidate
                    {sortedCandidates.length !== 1 ? "s" : ""} •{" "}
                    {totalVotesForPosition.toLocaleString()} vote
                    {totalVotesForPosition !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Candidate cards */}
              <div className="grid gap-4 md:gap-5">
                {sortedCandidates.map((candidate, index) => {
                  const rank = index + 1;
                  const votes = Number(candidate?.voteCount || 0);
                  const percentage = getPercentage(votes);
                  const isLeading = rank === 1 && votes > 0;
                  const party =
                    candidate.party || candidate.Party || "Independent";

                  return (
                    <div
                      key={candidate.id || candidate.blockchainId || index}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 md:p-5 border-l-4 ${
                        isLeading
                          ? "border-dark-green-500"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank number */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            isLeading
                              ? "bg-dark-green-100 text-dark-green-700"
                              : rank <= 3
                              ? "bg-gray-100 text-gray-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {rank}
                        </div>

                        {/* Candidate info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {candidate.name || "Unknown Candidate"}
                            </h3>
                            {isLeading && (
                              <span className="inline-flex items-center gap-1 bg-dark-green-100 text-dark-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 bg-dark-green-500 rounded-full"></span>
                                Leading
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {party}
                            {candidate.county && ` • ${candidate.county}`}
                            {candidate.constituency && ` • ${candidate.constituency}`}
                            {candidate.ward && ` • ${candidate.ward}`}
                          </p>
                        </div>

                        {/* Vote count and percentage */}
                        <div className="flex-shrink-0 text-right min-w-[100px]">
                          <div className="text-2xl md:text-3xl font-bold text-dark-green-700">
                            {votes.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLeading
                                  ? "bg-gradient-to-r from-dark-green-500 to-dark-green-600"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Winner Section - Position-specific winners when election ends */
      electionEnded && (
        <section className="py-8 bg-yellow-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              🏆 Winners Declared
            </h2>
            
            <div className="space-y-6">
              {Object.entries(winnersByPosition).map(([position, winnerInfo]) => {
                if (!winnerInfo || position === 'unknown') return null;
                
                return (
                  <div
                    key={position}
                    className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl shadow-2xl p-6 text-white border-4 border-yellow-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">
                        🏆 {getPositionDisplayName(position)}
                      </h3>
                      <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold">
                        {winnerInfo.votes} total votes
                      </span>
                    </div>

                    {winnerInfo.isTie ? (
                      <div className="space-y-4">
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                          <p className="text-xl font-bold text-yellow-100">Tie Declared!</p>
                        </div>
                        {winnerInfo.tiedCandidates.map((tiedCandidate, idx) => (
                          <div key={idx} className="bg-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div>
                                <p className="font-bold text-xl">{tiedCandidate.name}</p>
                                <p className="text-yellow-100">
                                  {tiedCandidate.party || 'Independent'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{tiedCandidate.percentage}%</p>
                                <p className="text-yellow-200 text-sm">
                                  {getWinnerAreaDescription(position, tiedCandidate)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : winnerInfo.winner ? (
                      <div className="bg-white/10 rounded-xl p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                              <span className="text-3xl font-bold">
                                {winnerInfo.winner.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="text-center md:text-left">
                              <h3 className="text-2xl md:text-3xl font-bold">
                                {winnerInfo.winner.name || "Unknown"}
                              </h3>
                              <p className="text-yellow-100 text-lg">
                                {winnerInfo.winner.party || 'Independent'}
                              </p>
                            </div>
                          </div>

                          <div className="text-center md:text-right">
                            <div className="text-5xl font-bold">
                              {Number(winnerInfo.winner.voteCount || 0).toLocaleString()}
                            </div>
                            <div className="text-yellow-100 text-lg">Total Votes</div>
                            <div className="mt-2 bg-white bg-opacity-20 rounded-full px-4 py-1 inline-block">
                              <span className="font-semibold">
                                {winnerInfo.winner.percentage}% of total votes
                              </span>
                            </div>
                            <div className="mt-2 text-yellow-200 text-sm">
                              {getWinnerAreaDescription(position, winnerInfo.winner)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!electionEnded && electionStarted && (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-dark-green-50 border border-dark-green-200 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="w-3 h-3 bg-dark-green-500 rounded-full animate-pulse"></span>
                <h3 className="text-lg font-bold text-dark-green-800">
                  Election Still Active
                </h3>
              </div>
              <p className="text-dark-green-600">
                Voting is currently in progress. Final winners will be declared
                after the election ends.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer info */}
      <footer className="py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            DeVote Kenya Elections • Powered by Blockchain Technology
          </p>
          <p className="text-gray-400 text-xs mt-2">
            All vote data is stored on the {networkName} testnet for
            transparency and immutability.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;