type AIInsightsCardProps = {
  recommendations: string[];
  weeklySummary: string;
};

export function AIInsightsCard({ recommendations, weeklySummary }: AIInsightsCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">AI Parent Insights</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Support for the Week Ahead</h2>
      </div>

      <div className="mt-5 rounded-lg bg-violet-50 p-4">
        <h3 className="text-sm font-semibold text-violet-950">Weekly Summary</h3>
        <p className="mt-2 text-sm leading-6 text-violet-900">{weeklySummary}</p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Recommendations</h3>
        <ul className="mt-3 space-y-3 text-sm text-slate-600">
          {recommendations.length > 0 ? (
            recommendations.map((item) => (
              <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {item}
              </li>
            ))
          ) : (
            <li className="rounded-lg bg-slate-50 p-3 text-slate-500">
              Keep encouraging short, consistent learning sessions and ask what your learner built today.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
