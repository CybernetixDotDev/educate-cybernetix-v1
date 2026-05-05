import type { AdminDashboardData } from "@/app/admin/page";

export function SystemHealthIndicators({ health }: { health: AdminDashboardData["health"] }) {
  const healthy = health.supabaseConnected && health.rlsProtected && health.apiLatencyMs < 3000;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">System Health</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{healthy ? "System Healthy" : "Attention Needed"}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <HealthItem label="Supabase connection" value={health.supabaseConnected ? "Connected" : "Issue"} ok={health.supabaseConnected} />
        <HealthItem label="RLS policy check" value={health.rlsProtected ? "Enabled" : "Review"} ok={health.rlsProtected} />
        <HealthItem label="Storage usage" value={health.storageStatus === "healthy" ? "Healthy" : "Unknown"} ok={health.storageStatus === "healthy"} />
        <HealthItem label="API latency" value={`${health.apiLatencyMs}ms`} ok={health.apiLatencyMs < 3000} />
      </div>
      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        Storage usage is marked unknown until a storage metrics endpoint is added. Database health is based on live dashboard queries.
      </p>
    </section>
  );
}

function HealthItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className={`mt-2 text-sm font-black ${ok ? "text-emerald-700" : "text-amber-700"}`}>{value}</p>
    </div>
  );
}

