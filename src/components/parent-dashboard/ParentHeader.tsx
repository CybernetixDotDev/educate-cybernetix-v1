type ParentHeaderProps = {
  studentName: string;
  currentWeek: number;
  lessonsCompleted: number;
  weeklyMinutes: number;
  streakDays: number;
  summary: string;
};

export function ParentHeader({
  studentName,
  currentWeek,
  lessonsCompleted,
  weeklyMinutes,
  streakDays,
  summary,
}: ParentHeaderProps) {
  return (
    <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-sm">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Parent Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{studentName}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
          <Metric label="Week" value={String(currentWeek)} />
          <Metric label="Lessons" value={String(lessonsCompleted)} />
          <Metric label="Minutes" value={String(weeklyMinutes)} />
          <Metric label="Streak" value={`${streakDays}d`} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
