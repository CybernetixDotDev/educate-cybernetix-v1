export type DailyEngagement = {
  date: string;
  minutes: number;
};

export type WeeklyEngagement = {
  label: string;
  minutes: number;
};

type EngagementChartProps = {
  dailyMinutes: DailyEngagement[];
  weeklyActivity: WeeklyEngagement[];
  streakDays: number;
  insights: string;
};

export function EngagementChart({
  dailyMinutes,
  weeklyActivity,
  streakDays,
  insights,
}: EngagementChartProps) {
  const maxDaily = Math.max(1, ...dailyMinutes.map((item) => item.minutes));
  const maxWeekly = Math.max(1, ...weeklyActivity.map((item) => item.minutes));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Engagement Analytics</h2>
          <p className="mt-1 text-sm text-slate-500">Learning time and activity patterns.</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-900">{streakDays}d</p>
          <p className="text-xs font-medium text-amber-700">Current streak</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Daily Minutes</h3>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {dailyMinutes.map((item) => (
              <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-cyan-500 transition-[height]"
                  style={{ height: `${Math.max(6, (item.minutes / maxDaily) * 100)}%` }}
                  title={`${item.date}: ${item.minutes} minutes`}
                />
                <span className="text-[0.65rem] text-slate-500">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Weekly Activity</h3>
          <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
            {weeklyActivity.map((item) => (
              <div key={item.label} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="font-medium text-slate-600">{item.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (item.minutes / maxWeekly) * 100)}%` }}
                  />
                </div>
                <span className="text-right tabular-nums text-slate-500">{item.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-indigo-50 p-4">
        <h3 className="text-sm font-semibold text-indigo-950">Engagement Insights</h3>
        <p className="mt-2 text-sm leading-6 text-indigo-900">{insights}</p>
      </div>
    </section>
  );
}
