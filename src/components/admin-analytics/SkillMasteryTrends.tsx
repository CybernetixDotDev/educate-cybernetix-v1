type SkillMasteryTrendsProps = {
  data: {
    snapshotsCount: number;
    skills: Array<{ key: string; label: string; value: number; trend: number }>;
  };
};

export function SkillMasteryTrends({ data }: SkillMasteryTrendsProps) {
  const average = data.skills.length === 0
    ? 0
    : Math.round(data.skills.reduce((sum, skill) => sum + skill.value, 0) / data.skills.length);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Skill Mastery</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Platform Skill Trends</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950">{average}%</p>
          <p className="text-xs text-slate-500">average mastery</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.skills.map((skill) => {
          const width = Math.max(4, Math.min(100, skill.value));
          return (
            <div key={skill.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{skill.label}</span>
                <span className="text-slate-500">
                  {skill.value}% {skill.trend !== 0 ? `(${skill.trend > 0 ? "+" : ""}${skill.trend})` : ""}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 rounded-md bg-violet-50 p-3 text-sm text-violet-900">
        Based on {data.snapshotsCount.toLocaleString()} skill snapshots, with quiz-score fallback when mastery snapshots are not available.
      </p>
    </section>
  );
}
