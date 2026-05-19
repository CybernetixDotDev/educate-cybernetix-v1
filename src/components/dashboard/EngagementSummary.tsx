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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Engagement</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Learning rhythm</h2>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-2xl font-black text-amber-700">{streak}</p>
          <p className="mt-1 text-xs font-semibold text-amber-800">day streak</p>
        </div>
        <div className="rounded-lg bg-cyan-50 p-3 text-center">
          <p className="text-2xl font-black text-cyan-700">{minutes}</p>
          <p className="mt-1 text-xs font-semibold text-cyan-800">minutes</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-black text-emerald-700">{daysActive}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-800">days active</p>
        </div>
      </div>
      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}
