"use client";

type ReportActionsProps = {
  loading: boolean;
  hasReport: boolean;
  onGenerate: () => Promise<void>;
  onRegenerateEngagement: () => Promise<void>;
  onRegenerateSkills: () => Promise<void>;
  onRegenerateRecommendations: () => Promise<void>;
  onSave: () => Promise<void>;
};

export function ReportActions({
  loading,
  hasReport,
  onGenerate,
  onRegenerateEngagement,
  onRegenerateSkills,
  onRegenerateRecommendations,
  onSave,
}: ReportActionsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Report Actions</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void onGenerate()} disabled={loading} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
          {loading ? "Generating..." : "Generate Report"}
        </button>
        <button type="button" onClick={() => void onRegenerateEngagement()} disabled={loading || !hasReport} className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Engagement
        </button>
        <button type="button" onClick={() => void onRegenerateSkills()} disabled={loading || !hasReport} className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Skills
        </button>
        <button type="button" onClick={() => void onRegenerateRecommendations()} disabled={loading || !hasReport} className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-black text-cyan-800 disabled:opacity-50">
          Regenerate Recommendations
        </button>
        <button type="button" onClick={() => void onSave()} disabled={loading || !hasReport} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
          Save Report
        </button>
      </div>
    </section>
  );
}
