import type { AdminActivityItem } from "@/app/admin/page";

const toneClasses: Record<AdminActivityItem["tone"], string> = {
  cyan: "bg-cyan-50 text-cyan-800",
  emerald: "bg-emerald-50 text-emerald-800",
  violet: "bg-violet-50 text-violet-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
};

export function RecentActivityFeed({ activities }: { activities: AdminActivityItem[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Activity</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Platform feed</h2>
      <div className="mt-5 space-y-3">
        {activities.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No recent activity found.</p>}
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
            <span className={`rounded-full px-2 py-1 text-xs font-black ${toneClasses[activity.tone]}`}>{activity.detail}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{activity.label}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(activity.date).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

