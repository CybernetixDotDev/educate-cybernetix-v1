type EngagementTrendsProps = {
  engagement: {
    totalMinutes: number;
    averageStreak: number;
    dailyMinutes: Array<{ label: string; minutes: number }>;
    weeklyActivity: Array<{ label: string; daysActive: number; minutes: number }>;
  };
};

function Bar({ value, max }: { value: number; max: number }) {
  const height = max > 0 ? Math.max(8, Math.round((value / max) * 120)) : 8;
  return <div className="w-full rounded-t-md bg-cyan-500" style={{ height }} />;
}

export function EngagementTrends({ engagement }: EngagementTrendsProps) {
  const maxDaily = Math.max(1, ...engagement.dailyMinutes.map((item) => item.minutes));
  const maxWeekly = Math.max(1, ...engagement.weeklyActivity.map((item) => item.daysActive));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Engagement</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Learning Minutes and Active Days</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <div>
            <p className="text-2xl font-bold text-slate-950">{engagement.totalMinutes.toLocaleString()}</p>
            <p className="text-xs text-slate-500">total minutes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-950">{engagement.averageStreak}</p>
            <p className="text-xs text-slate-500">avg streak</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex h-36 items-end gap-2 border-b border-slate-200">
          {engagement.dailyMinutes.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <Bar value={item.minutes} max={maxDaily} />
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[11px] text-slate-500 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
          {engagement.dailyMinutes.map((item) => <span key={item.label}>{item.label}</span>)}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {engagement.weeklyActivity.map((week) => {
          const width = Math.max(6, Math.round((week.daysActive / maxWeekly) * 100));
          return (
            <div key={week.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{week.label}</span>
                <span className="text-slate-500">{week.daysActive} active days · {week.minutes} min</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-950" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
