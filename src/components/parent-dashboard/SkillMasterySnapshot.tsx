type AnalyticsSnapshot = {
  snapshot_type: string;
  metrics: Record<string, unknown>;
  generated_at: string;
};

export type ParentSkillScore = {
  key: string;
  label: string;
  value: number;
};

export function SkillMasterySnapshot({ skills, analytics }: { skills: ParentSkillScore[]; analytics: AnalyticsSnapshot[] }) {
  const growthNote =
    typeof analytics.find((item) => item.snapshot_type === "skill_mastery")?.metrics.growth_note === "string"
      ? (analytics.find((item) => item.snapshot_type === "skill_mastery")?.metrics.growth_note as string)
      : "Growth notes become more specific as quiz and project data accumulates.";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Skill Mastery Snapshot</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Core skills</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {skills.map((skill, index) => (
          <div key={skill.key} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span className="text-slate-800">{skill.label}</span>
              <span className="tabular-nums text-slate-500">{skill.value}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${index % 3 === 0 ? "bg-cyan-500" : index % 3 === 1 ? "bg-emerald-500" : "bg-violet-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-cyan-50 p-4">
        <h3 className="text-sm font-semibold text-cyan-950">Growth since last month</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">{growthNote}</p>
      </div>
    </section>
  );
}

