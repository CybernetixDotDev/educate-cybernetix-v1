type AISystemUsageProps = {
  data: {
    provider: string;
    model: string;
    totalCalls: number;
    successRate: number;
    errorCount: number;
    averageLatencyMs: number;
    callsByType: Array<{ label: string; count: number }>;
  };
};

export function AISystemUsage({ data }: AISystemUsageProps) {
  const max = Math.max(1, ...data.callsByType.map((item) => item.count));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-600">AI System Usage</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Provider Health and Call Volume</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950">{data.totalCalls.toLocaleString()}</p>
          <p className="text-xs text-slate-500">recent calls</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Provider" value={data.provider} />
        <Stat label="Model" value={data.model} />
        <Stat label="Success rate" value={`${data.successRate}%`} />
        <Stat label="Avg latency" value={data.averageLatencyMs > 0 ? `${data.averageLatencyMs}ms` : "No data"} />
      </div>

      <div className="mt-6 space-y-3">
        {data.callsByType.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No AI interaction logs have been recorded yet.</p>
        ) : (
          data.callsByType.map((item) => {
            const width = Math.max(6, Math.round((item.count / max) * 100));
            return (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {data.errorCount > 0 && (
        <p className="mt-5 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {data.errorCount} recent AI calls need review. Check provider credentials, response parsing, or prompt output shape.
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
