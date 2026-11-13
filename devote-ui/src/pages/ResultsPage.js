import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  BarChartIcon,
  RefreshIcon,
  LockIcon,
  BallotBoxIcon,
} from "../components/common/Icons";
import {
  filterResultsForVoter,
  normalizePosition,
  POSITIONS,
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
      try {
        // If we have a contract and a load function from parent, use it
        if (contract && typeof onLoadElectionData === "function") {
          await onLoadElectionData();
        }

        if (!mounted) return;

        setLastUpdated(new Date());
      } catch (err) {
        console.error("ResultsPage: Loading error:", err);
        if (mounted) {
          setResultsError(err.message || "Failed to load results");
        }
      } finally {
        if (mounted) {
          setResultsLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Normalize candidates
  const normalizedCandidates = useMemo(() => {
    return candidates.map(normalizeCandidate);
  }, [candidates]);

  // Filter candidates by voter location first
  const locationFilteredCandidates = useMemo(() => {
    return filterResultsForVoter(normalizedCandidates, voter);
  }, [normalizedCandidates, voter]);

  // Filter candidates by position
  const filteredCandidates = useMemo(() => {
    if (activeTab === "All") return locationFilteredCandidates;
    const normalizedTab = normalizePosition(activeTab);
    return locationFilteredCandidates.filter((c) => c.position === normalizedTab);
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
    return sortedCandidates.reduce((sum, c) => sum + Number(c?.voteCount || 0), 0);
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

  // Leading party
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
      setLastUpdated(new Date());
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
    try {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Get winners by position
  const winnersByPosition = useMemo(() => {
    if (getWinnersByPosition) {
      return getWinnersByPosition();
    }
    return calculateWinnersByPosition(normalizedCandidates, voter);
  }, [normalizedCandidates, voter, getWinnersByPosition]);

  const winnerEntries = useMemo(() => {
    return Object.entries(winnersByPosition)
      .filter(([position, info]) => info && position !== "unknown" && (info.isTie || info.winner))
      .map(([position, info]) => {
        const posTotal = normalizedCandidates
          .filter((c) => c.position === normalizePosition(position))
          .reduce((s, c) => s + Number(c.voteCount || 0), 0);
        const pct = (c) => {
          if (!c) return "0.0";
          if (c.percentage) return c.percentage;
          const v = Number(c.voteCount || 0);
          return posTotal > 0 ? ((v / posTotal) * 100).toFixed(1) : "0.0";
        };
        if (info.isTie) {
          return [position, { ...info, tiedCandidates: (info.tiedCandidates || []).map((c) => ({ ...c, percentage: pct(c) })) }];
        }
        return [position, { ...info, winner: { ...info.winner, percentage: pct(info.winner) } }];
      });
  }, [winnersByPosition, normalizedCandidates]);

  /* ---------------------------------- */
  /* Loading skeleton - compact          */
  /* ---------------------------------- */
  if (resultsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onConnectWallet={onConnectWallet}
          isConnected={isConnected}
          account={account}
          onNavigate={onNavigate}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-4 bg-gray-100 rounded w-40 animate-pulse mb-6"></div>
          <div className="h-10 bg-gray-100 rounded w-72 animate-pulse mb-10"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5">
                <div className="h-3 bg-gray-100 rounded w-20 animate-pulse mb-3"></div>
                <div className="h-8 bg-gray-100 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-lg w-28 animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-48 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-6 bg-gray-100 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* Error state                         */
  /* ---------------------------------- */
  if (resultsError && normalizedCandidates.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onConnectWallet={onConnectWallet}
          isConnected={isConnected}
          account={account}
          onNavigate={onNavigate}
        />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangleIcon className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Unable to load blockchain results
          </h3>
          <p className="text-gray-500 mb-6">{resultsError}</p>
          <button
            onClick={handleRefresh}
            className="bg-dark-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-dark-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* Main content                        */
  /* ---------------------------------- */
  const electionStatus = electionEnded
    ? { label: "Final results", tone: "text-dark-green-700 bg-dark-green-50", dot: "bg-dark-green-500" }
    : electionStarted
    ? { label: "Voting in progress", tone: "text-blue-700 bg-blue-50", dot: "bg-blue-500 animate-pulse" }
    : { label: "Election not started", tone: "text-amber-700 bg-amber-50", dot: "bg-amber-500" };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header - single compact row */}
        <header className="pt-10 pb-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${electionStatus.tone}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${electionStatus.dot}`}></span>
                  {electionStatus.label}
                </span>
                <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">
                  Live tally from {networkName} blockchain
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-dark-green-600 flex items-center justify-center flex-shrink-0">
                  <BallotBoxIcon className="w-5 h-5 text-white" />
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Election Results
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Updated {formatTime(lastUpdated)}
              </span>
              <button
                onClick={handleRefresh}
                disabled={resultsLoading}
                className={`inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors ${
                  resultsLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <RefreshIcon className={`w-4 h-4 ${resultsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Area context - single quiet line */}
          {voter && (
            <p className="mt-3 text-sm text-gray-500">
              Showing results for{" "}
              <span className="font-medium text-gray-900">
                {[voter.county, voter.constituency, voter.ward].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
          {!voter && (
            <p className="mt-3 text-sm text-gray-500 inline-flex items-center gap-1.5">
              <LockIcon className="w-3.5 h-3.5 text-blue-500" />
              Showing national (Presidential) results. Sign in on the Vote page to see your county, constituency, and ward races.
            </p>
          )}
        </header>

        {/* Stats - one tight band */}
        <section className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-white p-4 md:p-5">
              <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Total votes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {totalVotes.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 md:p-5">
              <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Candidates</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {locationFilteredCandidates.length}
              </p>
            </div>
            <div className="bg-white p-4 md:p-5">
              <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Leading candidate</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {leadingCandidate ? leadingCandidate.name : "—"}
              </p>
            </div>
            <div className="bg-white p-4 md:p-5">
              <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Leading party</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {leadingParty || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Position tabs */}
        <section className="pb-4">
          <div className="flex flex-wrap gap-2">
            {positionTabs.map((tab) => {
              const count = tab.id === "All"
                ? locationFilteredCandidates.length
                : locationFilteredCandidates.filter((c) => c.position === normalizePosition(tab.id)).length;

              if (tab.id !== "All" && count === 0) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-dark-green-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs ${activeTab === tab.id ? "text-dark-green-100" : "text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results list */}
        <section className="pb-10 flex-1">
          {sortedCandidates.length === 0 ? (
            <div className="border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChartIcon className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {activeTab === "All"
                  ? "No results available yet"
                  : `No candidates for ${getPositionDisplayName(activeTab)} in your area yet`}
              </h3>
              <p className="text-gray-500 text-sm">
                Results will appear once candidates are added and votes are cast.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  {activeTab === "All"
                    ? "All Positions"
                    : `${getPositionDisplayName(activeTab)} Results`}
                </h2>
                <p className="text-sm text-gray-500">
                  {totalVotesForPosition.toLocaleString()} votes counted
                </p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                {sortedCandidates.map((candidate, index) => {
                  const rank = index + 1;
                  const votes = Number(candidate?.voteCount || 0);
                  const percentage = getPercentage(votes);
                  const isLeader = rank === 1 && votes > 0;
                  const party = candidate.party || candidate.Party || "Independent";
                  const location = [candidate.county, candidate.constituency, candidate.ward]
                    .filter(Boolean)
                    .join(" · ");
                  const initial = candidate.name?.charAt(0)?.toUpperCase() || "?";

                  return (
                    <div key={candidate.id || candidate.blockchainId || index} className="p-4 md:px-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Rank */}
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            isLeader ? "bg-dark-green-600 text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {rank}
                        </span>

                        {/* Photo */}
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="flex-shrink-0 w-10 h-10 rounded-full object-cover bg-dark-green-50"
                          />
                        ) : (
                          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-dark-green-50 text-dark-green-700 flex items-center justify-center font-bold text-sm">
                            {initial}
                          </span>
                        )}

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {candidate.name}
                            </h3>
                            {isLeader && electionEnded && (
                              <CheckCircleIcon className="w-4 h-4 text-dark-green-600 flex-shrink-0" />
                            )}
                            {isLeader && !electionEnded && (
                              <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-dark-green-700">
                                Leading
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {party}
                            {location && ` · ${location}`}
                          </p>
                        </div>

                        {/* Votes */}
                        <div className="flex-shrink-0 text-right w-24 md:w-32">
                          <div className="font-bold text-gray-900 text-lg">
                            {votes.toLocaleString()}
                          </div>
                          <div className="text-xs font-semibold text-gray-600">{percentage}%</div>
                        </div>
                      </div>

                      {/* Share bar */}
                      <div className="mt-3 ml-10 md:ml-14">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLeader ? "bg-dark-green-500" : "bg-gray-200"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Certified winners - only once the election has ended */}
        {electionEnded && winnerEntries.length > 0 && (
          <section className="pb-10">
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
              Certified winners
            </h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
              {winnerEntries.map(([position, info]) => (
                <div
                  key={position}
                  className="p-4 md:px-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                >
                  <div className="w-40 flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {getPositionDisplayName(position)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getWinnerAreaDescription(position, info.winner || info.tiedCandidates?.[0] || {})}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {info.isTie ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          Tie declared
                        </span>
                        {info.tiedCandidates.map((tc, idx) => (
                          <span key={idx} className="text-sm text-gray-600">
                            {tc.name} ({tc.percentage}%)
                            {idx < info.tiedCandidates.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-dark-green-600 flex-shrink-0" />
                        {info.winner?.name}{" "}
                        <span className="font-normal text-gray-500 text-sm">
                          {info.winner?.party || "Independent"}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-gray-900">
                      {(info.isTie
                        ? Number(info.tiedCandidates?.[0]?.voteCount || 0)
                        : Number(info.winner?.voteCount || 0)
                      ).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-gray-400">votes</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {info.isTie
                        ? `${info.tiedCandidates?.[0]?.percentage}%`
                        : `${info.winner?.percentage}% of votes`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer - single quiet line */}
      <footer className="border-t border-gray-200 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="text-xs text-gray-500">
            DeVote Kenya Elections — official tally published on the {networkName} blockchain
          </p>
          <p className="text-xs text-gray-400">
            Every record is verifiable and immutable
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
