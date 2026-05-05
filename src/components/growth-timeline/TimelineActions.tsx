"use client";

type TimelineActionsProps = {
  loading: boolean;
  hasTimeline: boolean;
  onGenerate?: () => Promise<void>;
  onRegenerateMilestones: () => Promise<void>;
  onRegenerateSkillProgression: () => Promise<void>;
  onRegenerateGrowthMoments: () => Promise<void>;
  onSave: () => Promise<void>;
};

export function TimelineActions({
  loading,
  hasTimeline,
  onGenerate,
  onRegenerateMilestones,
  onRegenerateSkillProgression,
  onRegenerateGrowthMoments,
  onSave,
}: TimelineActionsProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Timeline Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {onGenerate && (
          <button type="button" onClick={() => void onGenerate()} disabled={loading} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            Generate Timeline
          </button>
        )}
        <button type="button" onClick={() => void onRegenerateMilestones()} disabled={loading || !hasTimeline} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Milestones
        </button>
        <button type="button" onClick={() => void onRegenerateSkillProgression()} disabled={loading || !hasTimeline} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Skill Progression
        </button>
        <button type="button" onClick={() => void onRegenerateGrowthMoments()} disabled={loading || !hasTimeline} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Growth Moments
        </button>
        <button type="button" onClick={() => void onSave()} disabled={loading || !hasTimeline} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
          Save Timeline
        </button>
      </div>
    </section>
  );
}
