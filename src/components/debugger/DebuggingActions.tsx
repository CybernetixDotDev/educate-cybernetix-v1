"use client";

type DebuggingActionsProps = {
  loading: boolean;
  hasAnalysis: boolean;
  hasFix: boolean;
  hasPatchDiff: boolean;
  canRun: boolean;
  onAnalyze: () => Promise<void>;
  onGenerateFix: () => Promise<void>;
  onExplainRootCause: () => Promise<void>;
  onShowPatchDiff: () => Promise<void>;
  onSendToMentor: () => Promise<void>;
};

export function DebuggingActions({
  loading,
  hasAnalysis,
  hasFix,
  hasPatchDiff,
  canRun,
  onAnalyze,
  onGenerateFix,
  onExplainRootCause,
  onShowPatchDiff,
  onSendToMentor,
}: DebuggingActionsProps) {
  const disabled = loading || !canRun;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Debugging Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" onClick={() => void onAnalyze()} disabled={disabled} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Analyze Error
        </button>
        <button type="button" onClick={() => void onGenerateFix()} disabled={disabled || !hasAnalysis} className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Generate Fix
        </button>
        <button type="button" onClick={() => void onExplainRootCause()} disabled={disabled} className="rounded-xl border border-violet-200 px-4 py-3 text-sm font-black text-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
          Explain Root Cause
        </button>
        <button type="button" onClick={() => void onShowPatchDiff()} disabled={disabled || !hasFix} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          {hasPatchDiff ? "Refresh Patch Diff" : "Show Patch Diff"}
        </button>
        <button type="button" onClick={() => void onSendToMentor()} disabled={disabled || !hasAnalysis} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Send to Mentor Chat
        </button>
      </div>
    </section>
  );
}
