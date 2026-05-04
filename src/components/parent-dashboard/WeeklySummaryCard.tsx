type WeeklySummaryCardProps = {
  weekNumber: number;
  lessonsCompleted: number;
  minutesSpent: number;
  skillsImproved: string[];
  projectUpdates: string[];
  challenges: string[];
  aiCommentary: string;
};

export function WeeklySummaryCard({
  weekNumber,
  lessonsCompleted,
  minutesSpent,
  skillsImproved,
  projectUpdates,
  challenges,
  aiCommentary,
}: WeeklySummaryCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Weekly Summary</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Week {weekNumber}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-cyan-50 px-4 py-3">
            <p className="text-2xl font-bold text-cyan-900">{lessonsCompleted}</p>
            <p className="text-xs font-medium text-cyan-700">Lessons</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3">
            <p className="text-2xl font-bold text-emerald-900">{minutesSpent}</p>
            <p className="text-xs font-medium text-emerald-700">Minutes</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SummaryList title="Skills Improved" items={skillsImproved} emptyText="No skill gains recorded yet." />
        <SummaryList title="Project Updates" items={projectUpdates} emptyText="Project updates will appear here." />
        <SummaryList title="Challenges" items={challenges} emptyText="No major challenges logged." />
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">AI Commentary</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{aiCommentary}</p>
      </div>
    </section>
  );
}

function SummaryList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
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
