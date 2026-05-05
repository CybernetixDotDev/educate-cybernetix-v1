import Link from "next/link";

export function AiParentInsight({
  studentName,
  insights,
  reportMonth,
}: {
  studentName: string;
  insights: string[];
  reportMonth: string;
}) {
  const visibleInsights =
    insights.length > 0
      ? insights
      : [
          `${studentName}'s mentor insights will become more detailed as lessons, quizzes, and project sessions accumulate.`,
          "For now, ask what felt easiest this week and what felt confusing.",
        ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">AI Parent Insights</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Your Child&apos;s Mentor Noticed...</h2>
        </div>
        <Link href={`/parent/reports/${reportMonth}`} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
          View Report
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {visibleInsights.slice(0, 2).map((insight) => (
          <div key={insight} className="rounded-lg border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
}

