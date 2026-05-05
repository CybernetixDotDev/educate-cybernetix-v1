type DailyMinute = {
  date: string;
  minutes: number;
};

type WeeklyActivity = {
  label: string;
  minutes: number;
};

type EngagementAnalyticsProps = {
  dailyMinutes: DailyMinute[];
  weeklyActivity: WeeklyActivity[];
  minutes: number;
  daysActive: number;
  streak: number;
};

export function EngagementAnalytics({ dailyMinutes, weeklyActivity, minutes, daysActive, streak }: EngagementAnalyticsProps) {
  const maxDaily = Math.max(1, ...dailyMinutes.map((day) => day.minutes));
  const maxWeekly = Math.max(1, ...weeklyActivity.map((week) => week.minutes));
  const interpretation =
    daysActive >= 4
      ? "This is a healthy weekly rhythm. Keep encouraging short explanations of what was built or learned."
      : minutes > 0
        ? "There is activity this week. A small planned session can help turn it into a stronger routine."
        : "No learning minutes are logged yet this week. A low-pressure restart is the best support.";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Engagement Analytics</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Learning rhythm and consistency</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Minutes" value={minutes} />
          <MiniStat label="Days" value={daysActive} />
          <MiniStat label="Streak" value={`${streak}d`} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Daily minutes</h3>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {dailyMinutes.map((day) => (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-cyan-500 transition-[height]"
                  style={{ height: `${Math.max(6, (day.minutes / maxDaily) * 100)}%` }}
                  title={`${day.date}: ${day.minutes} minutes`}
                />
                <span className="text-[0.65rem] text-slate-500">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Weekly trend</h3>
          <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
            {weeklyActivity.map((week) => (
              <div key={week.label} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="font-medium text-slate-600">{week.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (week.minutes / maxWeekly) * 100)}%` }} />
                </div>
                <span className="text-right tabular-nums text-slate-500">{week.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-violet-50 p-4">
        <h3 className="text-sm font-semibold text-violet-950">Parent interpretation</h3>
        <p className="mt-2 text-sm leading-6 text-violet-900">{interpretation}</p>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

