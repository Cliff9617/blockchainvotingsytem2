import React from "react";
import { LockIcon, ShieldCheckIcon, ChevronRightIcon } from "./common/Icons";

/**
 * ResultsGate - Restricts premature tally view until a voter casts their ballot
 * Prevents voter bandwagon bias and protects democratic integrity.
 */
const ResultsGate = ({ onNavigateToVote }) => {
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
          In accordance with national electoral procedure, live vote tallies are sealed to voters until you have completed casting your ballots. This safeguards voter independence and prevents bandwagon influence.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            How to Unlock Live Results:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">1.</span>
              <span>Connect your voter wallet & authenticate.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">2.</span>
              <span>Cast and confirm your 6 elective ballots.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">3.</span>
              <span>Review your cryptographic receipt; live tally results will unlock automatically.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onNavigateToVote}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <span>Go to Ballot (Cast Your Vote)</span>
          <ChevronRightIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ResultsGate;
