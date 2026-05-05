import Link from "next/link";

const ACTIONS = [
  { href: "/admin/roles", label: "Manage Roles", description: "Assign student, parent, and admin access." },
  { href: "/admin/students", label: "Manage Students", description: "Review learner progress and profiles." },
  { href: "/admin/roles", label: "Manage Parents", description: "Review parent links and relationships." },
  { href: "/admin/lessons/new", label: "Create Lesson", description: "Author a lesson from scratch." },
  { href: "/admin/ai-quiz-generator", label: "Create Quiz", description: "Generate or refine quiz content." },
  { href: "/admin/weekly-summary", label: "Generate Weekly Summary", description: "Create AI weekly summaries." },
  { href: "/admin/parent-reports", label: "Generate Parent Report", description: "Create monthly parent reports." },
  { href: "/admin/certificates", label: "Generate Certificate", description: "Build completion certificates." },
  { href: "/admin/growth-timeline", label: "Generate Growth Timeline", description: "Create longitudinal learner timelines." },
  { href: "/admin/ai-config", label: "AI Config", description: "Tune the global mentor settings." },
  { href: "/admin/analytics", label: "Analytics Dashboard", description: "Inspect analytics snapshots." },
];

export function QuickActionsGrid() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Quick Actions</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Admin tools</h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <p className="text-sm font-black text-slate-950">{action.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

