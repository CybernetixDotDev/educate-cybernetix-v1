import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type Snapshot = {
  id: string;
  snapshot_type: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown>;
  dimensions: Record<string, unknown>;
  generated_at: string;
  students?: { display_name: string } | null;
};

function getTypeCount(snapshots: Snapshot[], type: string) {
  return snapshots.filter((snapshot) => snapshot.snapshot_type === type).length;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(5, Math.round((value / max) * 100)) : 5;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("analytics_snapshots")
    .select("*, students(display_name)")
    .order("generated_at", { ascending: false })
    .limit(200);
  const snapshots = (data ?? []) as Snapshot[];
  const chartData = [
    { label: "Engagement", value: getTypeCount(snapshots, "engagement") },
    { label: "Skill mastery", value: getTypeCount(snapshots, "skill_mastery") },
    { label: "Module completion", value: getTypeCount(snapshots, "module_completion") },
    { label: "Project progress", value: getTypeCount(snapshots, "project_progress") },
  ];
  const max = Math.max(1, ...chartData.map((item) => item.value));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Analytics</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Analytics Snapshots</h1>
        </header>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          {chartData.map((item) => <Bar key={item.label} label={item.label} value={item.value} max={max} />)}
        </section>

        <Table columns={["Type", "Student", "Period", "Metrics", "Generated"]} empty={snapshots.length === 0}>
          {snapshots.map((snapshot) => (
            <tr key={snapshot.id} className="align-top">
              <td className="px-4 py-3 font-semibold">{snapshot.snapshot_type}</td>
              <td className="px-4 py-3">{snapshot.students?.display_name ?? "Global"}</td>
              <td className="px-4 py-3">{new Date(snapshot.period_start).toLocaleDateString()} - {new Date(snapshot.period_end).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer font-semibold text-cyan-700">View JSON</summary>
                  <pre className="mt-3 max-w-xl overflow-x-auto rounded bg-slate-950 p-3 text-xs text-cyan-100">
                    {JSON.stringify({ metrics: snapshot.metrics, dimensions: snapshot.dimensions }, null, 2)}
                  </pre>
                </details>
              </td>
              <td className="px-4 py-3">{new Date(snapshot.generated_at).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </div>
    </main>
  );
}
