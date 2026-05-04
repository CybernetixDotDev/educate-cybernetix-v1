"use client";

type CoachingActionsProps = {
  hasPlan: boolean;
  loading: boolean;
  onGenerate: () => void;
  onRegenerateSkills: () => void;
  onRegenerateMicroTasks: () => void;
  onRegenerateMotivation: () => void;
  onSave: () => void;
};

export function CoachingActions({
  hasPlan,
  loading,
  onGenerate,
  onRegenerateSkills,
  onRegenerateMicroTasks,
  onRegenerateMotivation,
  onSave,
}: CoachingActionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button onClick={onGenerate} disabled={loading} className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          Generate Coaching Plan
        </button>
        <button onClick={onRegenerateSkills} disabled={loading || !hasPlan} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400">
          Regenerate Skills Plan
        </button>
        <button onClick={onRegenerateMicroTasks} disabled={loading || !hasPlan} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400">
          Regenerate Micro-Tasks
        </button>
        <button onClick={onRegenerateMotivation} disabled={loading || !hasPlan} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400">
          Regenerate Motivation
        </button>
        <button onClick={onSave} disabled={loading || !hasPlan} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          Save Coaching Plan
        </button>
      </div>
    </section>
  );
}
