type QuizPerformanceProps = {
  data: {
    totalQuizzes: number;
    averageScore: number;
    distribution: Array<{ label: string; count: number }>;
    hardestConcepts: Array<{ label: string; score: number }>;
  };
};

export function QuizPerformance({ data }: QuizPerformanceProps) {
  const max = Math.max(1, ...data.distribution.map((bucket) => bucket.count));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Quiz Analytics</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Performance Summary</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950">{data.averageScore}%</p>
          <p className="text-xs text-slate-500">{data.totalQuizzes.toLocaleString()} attempts</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {data.distribution.map((bucket) => {
          const height = Math.max(8, Math.round((bucket.count / max) * 96));
          return (
            <div key={bucket.label} className="rounded-lg bg-slate-50 p-3 text-center">
              <div className="flex h-28 items-end justify-center">
                <div className="w-10 rounded-t-md bg-amber-500" style={{ height }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">{bucket.label}%</p>
              <p className="text-xs text-slate-500">{bucket.count} attempts</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Hardest Concepts</h3>
        <div className="mt-3 space-y-2">
          {data.hardestConcepts.map((concept) => (
            <div key={`${concept.label}-${concept.score}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-700">{concept.label}</span>
              <span className="text-slate-500">{concept.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
