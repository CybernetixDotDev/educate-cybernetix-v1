type SystemHealthProps = {
  health: {
    supabaseConnected: boolean;
    rlsProtected: boolean;
    storageStatus: string;
    apiLatencyMs: number;
    attentionNeeded: boolean;
  };
};

export function SystemHealth({ health }: SystemHealthProps) {
  const items = [
    {
      label: "Supabase connection",
      value: health.supabaseConnected ? "Connected" : "Check connection",
      healthy: health.supabaseConnected,
    },
    {
      label: "RLS policy posture",
      value: health.rlsProtected ? "Protected" : "Review policies",
      healthy: health.rlsProtected,
    },
    {
      label: "Storage usage",
      value: health.storageStatus,
      healthy: health.storageStatus !== "attention needed",
    },
    {
      label: "Server query latency",
      value: `${health.apiLatencyMs}ms`,
      healthy: health.apiLatencyMs < 1500,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">System Health</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Operational Indicators</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${health.attentionNeeded ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {health.attentionNeeded ? "Attention Needed" : "System Healthy"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 p-4">
            <div className={`h-2 w-2 rounded-full ${item.healthy ? "bg-emerald-500" : "bg-amber-500"}`} />
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
