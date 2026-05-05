"use client";

type CodeReviewActionsProps = {
  loading: boolean;
  canRun: boolean;
  hasReview: boolean;
  hasFix: boolean;
  hasPatchDiff: boolean;
  onReview: () => Promise<void>;
  onGenerateFixes: () => Promise<void>;
  onShowPatchDiff: () => Promise<void>;
  onSendToMentor: () => Promise<void>;
};

export function CodeReviewActions({
  loading,
  canRun,
  hasReview,
  hasFix,
  hasPatchDiff,
  onReview,
  onGenerateFixes,
  onShowPatchDiff,
  onSendToMentor,
}: CodeReviewActionsProps) {
  const disabled = loading || !canRun;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Review Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" onClick={() => void onReview()} disabled={disabled} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Run Code Review
        </button>
        <button type="button" onClick={() => void onGenerateFixes()} disabled={disabled || !hasReview} className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Generate Fixes
        </button>
        <button type="button" onClick={() => void onShowPatchDiff()} disabled={disabled || !hasFix} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          {hasPatchDiff ? "Refresh Patch Diff" : "Show Patch Diff"}
        </button>
        <button type="button" onClick={() => void onSendToMentor()} disabled={disabled || !hasReview} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Send to Mentor Chat
        </button>
      </div>
    </section>
  );
}
