import type { DashboardProject } from "@/app/dashboard/page";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

export function ProjectSnapshot({ project }: { project: DashboardProject | null }) {
  const tasks = project?.project_tasks ?? [];
  const completed = tasks.filter((task) => task.status === "completed" || task.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Current Mission</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{project?.title ?? "Build your first real project"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {project?.description ?? "Your course work turns into a portfolio project. Ask Cyber Mentor to create the first build plan when you are ready."}
          </p>
        </div>
        <Link href="/mentor?intent=project" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
          Ask Cyber Mentor
        </Link>
      </div>
      <div className="mt-6">
        <ProgressBar value={progress} label={`${completed} of ${tasks.length} tasks complete`} tone="emerald" />
      </div>
      <div className="mt-5 space-y-2">
        {tasks.slice(0, 4).map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="font-semibold text-slate-800">{task.title}</span>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${task.status === "completed" || task.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
              {task.status}
            </span>
          </div>
        ))}
        {tasks.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No project tasks yet. Start with the next lesson, then ask Cyber Mentor to turn it into a project task.</p>}
      </div>
    </section>
  );
}
