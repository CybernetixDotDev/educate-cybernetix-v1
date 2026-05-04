import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type Summary = {
  id: string;
  week_start_date: string;
  week_end_date: string;
  lessons_completed: number;
  quizzes_completed: number;
  average_quiz_score: number | null;
  time_spent_seconds: number;
  highlights: string[];
  concerns: string[];
  summary: Record<string, unknown>;
  students?: { display_name: string } | null;
};

async function regenerateSummary(formData: FormData) {
  "use server";

  const summaryId = String(formData.get("id") ?? "");
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/admin/summaries/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary_id: summaryId }),
  }).catch(() => null);
  revalidatePath("/admin/summaries");
}

export default async function AdminSummariesPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("parent_weekly_summaries")
    .select("*, students(display_name)")
    .order("week_start_date", { ascending: false })
    .limit(100);
  const summaries = (data ?? []) as Summary[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Weekly Summaries</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Parent Weekly Summaries</h1>
        </header>

        <Table columns={["Student", "Week", "Metrics", "Details", "Regenerate"]} empty={summaries.length === 0}>
          {summaries.map((summary) => (
            <tr key={summary.id} className="align-top">
              <td className="px-4 py-3 font-semibold">{summary.students?.display_name ?? "Student"}</td>
              <td className="px-4 py-3">{summary.week_start_date} to {summary.week_end_date}</td>
              <td className="px-4 py-3">
                {summary.lessons_completed} lessons, {summary.quizzes_completed} quizzes, {Math.round(summary.time_spent_seconds / 60)}m
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer font-semibold text-cyan-700">View summary</summary>
                  <pre className="mt-3 max-w-xl overflow-x-auto rounded bg-slate-950 p-3 text-xs text-cyan-100">
                    {JSON.stringify({ highlights: summary.highlights, concerns: summary.concerns, summary: summary.summary }, null, 2)}
                  </pre>
                </details>
              </td>
              <td className="px-4 py-3">
                <form action={regenerateSummary}>
                  <input type="hidden" name="id" value={summary.id} />
                  <button className="rounded bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Regenerate</button>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </main>
  );
}
