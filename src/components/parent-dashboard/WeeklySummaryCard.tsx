type WeeklySummaryCardProps = {
  studentName: string;
  weekNumber: number;
  lessonsCompleted: number;
  minutesSpent: number;
  streakDays: number;
  highlights: string[];
  concerns: string[];
  consistencyMessage: string;
};

export function WeeklySummaryCard({
  studentName,
  weekNumber,
  lessonsCompleted,
  minutesSpent,
  streakDays,
  highlights,
  concerns,
  consistencyMessage,
}: WeeklySummaryCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">This Week at a Glance</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Week {weekNumber}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A parent-friendly snapshot of {studentName}&apos;s recent learning activity.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Lessons" value={lessonsCompleted} tone="cyan" />
          <Stat label="Minutes" value={minutesSpent} tone="emerald" />
          <Stat label="Streak" value={`${streakDays}d`} tone="amber" />
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Consistency Message</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{consistencyMessage}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SummaryList title="Highlights" items={highlights} emptyText="Highlights will appear after more activity." />
        <SummaryList title="Support Notes" items={concerns} emptyText="No major concerns logged this week." />
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "cyan" | "emerald" | "amber" }) {
  const classes = {
    cyan: "bg-cyan-50 text-cyan-900",
    emerald: "bg-emerald-50 text-emerald-900",
    amber: "bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-lg px-3 py-3 ${classes[tone]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold">{label}</p>
    </div>
  );
}

function SummaryList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.length > 0 ? items.map((item) => <li key={item}>{item}</li>) : <li className="text-slate-400">{emptyText}</li>}
      </ul>
    </div>
  );
}

