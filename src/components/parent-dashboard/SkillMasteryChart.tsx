export type SkillMastery = {
  key: string;
  label: string;
  value: number;
};

type SkillMasteryChartProps = {
  skills: SkillMastery[];
  strengths: string[];
  areasToImprove: string[];
};

export function SkillMasteryChart({ skills, strengths, areasToImprove }: SkillMasteryChartProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Skill Mastery</h2>
        <p className="mt-1 text-sm text-slate-500">Quiz results and activity mapped to core platform skills.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {skills.map((skill, index) => (
          <div key={skill.key} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-medium">
              <span className="text-slate-800">{skill.label}</span>
              <span className="tabular-nums text-slate-500">{skill.value}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  index % 3 === 0 ? "bg-cyan-500" : index % 3 === 1 ? "bg-emerald-500" : "bg-violet-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SkillList title="Strengths" items={strengths} emptyText="Strengths will appear after more quiz data." />
        <SkillList
          title="Areas to Improve"
          items={areasToImprove}
          emptyText="No priority improvement areas yet."
        />
      </div>
    </section>
  );
}

function SkillList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.length > 0 ? (
          items.map((item) => <li key={item}>- {item}</li>)
        ) : (
          <li className="text-slate-400">{emptyText}</li>
        )}
      </ul>
    </div>
  );
}
