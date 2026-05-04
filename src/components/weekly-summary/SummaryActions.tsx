"use client";

type SummaryActionsProps = {
  hasSummary: boolean;
  loading: boolean;
  onGenerate: () => void;
  onRegenerateParent: () => void;
  onRegenerateStudent: () => void;
  onSave: () => void;
};

export function SummaryActions({
  hasSummary,
  loading,
  onGenerate,
  onRegenerateParent,
  onRegenerateStudent,
  onSave,
}: SummaryActionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={onGenerate} disabled={loading} className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          Generate Summary
        </button>
        <button type="button" onClick={onRegenerateParent} disabled={loading || !hasSummary} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400">
          Regenerate Parent Summary
        </button>
        <button type="button" onClick={onRegenerateStudent} disabled={loading || !hasSummary} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400">
          Regenerate Student Reflection
        </button>
        <button type="button" onClick={onSave} disabled={loading || !hasSummary} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          Save Summary
        </button>
      </div>
    </section>
  );
}
