import type { DashboardSessionLog, DashboardStreak } from "@/app/dashboard/page";

export function EngagementSummary({ sessionLogs, streaks }: { sessionLogs: DashboardSessionLog[]; streaks: DashboardStreak[] }) {
  const minutes = Math.round(sessionLogs.reduce((sum, log) => sum + Number(log.duration_seconds ?? 0), 0) / 60);
  const daysActive = new Set(sessionLogs.map((log) => new Date(log.session_started_at).toISOString().slice(0, 10))).size;
  const streak = streaks[0]?.current_count ?? 0;
  const message =
    streak >= 7
      ? "Strong consistency. Keep sessions short and frequent."
      : daysActive >= 3
        ? "Good rhythm this week. One more focused session will help."
        : "Start with one 20-minute session today to build momentum.";

  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Progress Energy</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Learning rhythm</h2>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-black text-amber-700">{streak}</p>
          <p className="mt-1 text-xs font-semibold text-amber-800">day streak</p>
        </div>
        <div className="rounded-2xl bg-teal-50 p-3 text-center">
          <p className="text-2xl font-black text-teal-700">{minutes}</p>
          <p className="mt-1 text-xs font-semibold text-teal-800">minutes</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-black text-emerald-700">{daysActive}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-800">days active</p>
        </div>
      </div>
      <p className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}
