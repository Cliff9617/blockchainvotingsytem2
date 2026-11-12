import React, { useState } from "react";
import { LockIcon, ShieldCheckIcon, ChevronRightIcon, RefreshIcon, InfoIcon } from "./common/Icons";

/**
 * ResultsGate - Restricts premature tally view until a voter casts their ballot
 * Prevents voter bandwagon bias and protects democratic integrity.
 *
 * Unlock rule (matches App.js): the gate opens for ANY wallet that has cast
 * at least one ballot, at any time - including voters who registered or voted
 * before this session. Results also open to officials and once the election ends.
 */
const ResultsGate = ({ onNavigateToVote, onRecheckVoterStatus, voterInfo, isConnected }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [recheckDone, setRecheckDone] = useState(false);

  const handleRecheck = async () => {
    if (typeof onRecheckVoterStatus !== "function") return;
    setIsChecking(true);
    try {
      await onRecheckVoterStatus();
    } catch (err) {
      console.warn("[ResultsGate] Re-check failed:", err?.message);
    } finally {
      setIsChecking(false);
      setRecheckDone(true);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8 text-center animate-in fade-in zoom-in duration-200">
        {/* Seal Icon */}
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200">
          <LockIcon className="w-8 h-8 text-slate-700" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">
          <ShieldCheckIcon className="w-4 h-4" />
          Ballot Confidentiality Protocol
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          Election Results Are Sealed
        </h2>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
          Live tallies stay sealed until your connected wallet has cast its first
          ballot. This protects voter independence and prevents bandwagon
          influence - and the moment you vote, results unlock permanently for
          that wallet.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            How to Unlock Live Results:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">1.</span>
              <span>Connect the wallet you registered with.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">2.</span>
              <span>Cast your first ballot - any elective position.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">3.</span>
              <span>Results unlock automatically, on this visit or any future one.</span>
            </li>
          </ul>
        </div>

        {!isConnected && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-5">
            <InfoIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              No wallet is connected right now. Connect the wallet you voted with -
              the unlock is checked on-chain, so any past ballot counts.
            </p>
          </div>
        )}

        {recheckDone && isConnected && !voterInfo?.hasVotedAny && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-5">
            <InfoIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              The connected wallet has no recorded ballot yet. If you voted with a
              different MetaMask account, switch to it and check again.
            </p>
          </div>
        )}

        <button
          onClick={onNavigateToVote}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <span>Go to Ballot (Cast Your Vote)</span>
          <ChevronRightIcon className="w-4 h-4 text-white" />
        </button>

        {isConnected && typeof onRecheckVoterStatus === "function" && (
          <button
            onClick={handleRecheck}
            disabled={isChecking}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 px-6 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm disabled:opacity-60"
          >
            <RefreshIcon className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Verifying your ballot on-chain..." : "I already voted - verify my ballot status"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsGate;
