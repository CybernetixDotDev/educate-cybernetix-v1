import { OverviewCard } from "@/components/admin/OverviewCard";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

const QUICK_LINKS = [
  { href: "/admin/modules", label: "Manage Modules" },
  { href: "/admin/projects", label: "Project Templates" },
  { href: "/admin/ai-config", label: "AI Mentor Config" },
  { href: "/admin/ai-context", label: "AI Context Packs" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/summaries", label: "Weekly Summaries" },
  { href: "/admin/analytics", label: "Analytics" },
];

async function AdminHomeContent() {
  const supabase = createClient(await cookies());
  const [students, modules, projects, achievements, lessons] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("ai_module_context").select("id", { count: "exact", head: true }),
    supabase.from("project_templates").select("id", { count: "exact", head: true }),
    supabase.from("achievements").select("id", { count: "exact", head: true }),
    supabase.from("lesson_progress").select("lesson_key", { count: "exact", head: true }),
  ]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Admin Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Platform Control Center</h1>
          <p className="mt-2 text-slate-600">Manage learning content, AI behavior, students, and reporting data.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <OverviewCard label="Total students" value={students.count ?? 0} />
          <OverviewCard label="Total modules" value={modules.count ?? 0} />
          <OverviewCard label="Total lessons" value={lessons.count ?? 0} helper="Tracked lesson records" />
          <OverviewCard label="Total projects" value={projects.count ?? 0} />
          <OverviewCard label="Achievements" value={achievements.count ?? 0} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Quick Links</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Fallback() {
  return <div className="p-8 text-sm text-slate-500">Loading admin dashboard...</div>;
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminHomeContent />
    </Suspense>
  );
}
