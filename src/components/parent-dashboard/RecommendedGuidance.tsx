export function RecommendedGuidance({ studentName, guidance }: { studentName: string; guidance: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Recommended Guidance</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">How to support {studentName} this week</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {guidance.slice(0, 3).map((item, index) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">Step {index + 1}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

