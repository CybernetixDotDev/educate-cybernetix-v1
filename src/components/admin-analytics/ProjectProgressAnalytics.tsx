type ProjectProgressAnalyticsProps = {
  data: {
    totalProjects: number;
    projectCompletionRate: number;
    taskCompletionRate: number;
    velocity: Array<{ label: string; count: number }>;
    readiness: { ready: number; inProgress: number; atRisk: number };
  };
};

export function ProjectProgressAnalytics({ data }: ProjectProgressAnalyticsProps) {
  const maxVelocity = Math.max(1, ...data.velocity.map((item) => item.count));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Projects</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Progress and Readiness</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950">{data.totalProjects.toLocaleString()}</p>
          <p className="text-xs text-slate-500">student projects</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Metric label="Project completion" value={data.projectCompletionRate} />
        <Metric label="Task completion" value={data.taskCompletionRate} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Readiness label="Demo ready" value={data.readiness.ready} tone="bg-emerald-50 text-emerald-700" />
        <Readiness label="In progress" value={data.readiness.inProgress} tone="bg-blue-50 text-blue-700" />
        <Readiness label="Needs attention" value={data.readiness.atRisk} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Task Velocity</h3>
        {data.velocity.map((item) => {
          const width = Math.max(6, Math.round((item.count / maxVelocity) * 100));
          return (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500">{item.count} completed</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

function Readiness({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg p-4 ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
