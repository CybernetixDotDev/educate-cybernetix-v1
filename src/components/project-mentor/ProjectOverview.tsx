"use client";

import type { StudentProject, ProjectTask } from "@/hooks/useProjectProgress";

type ProjectOverviewProps = {
  project: StudentProject | null;
  tasks: ProjectTask[];
  loading?: boolean;
};

function isDone(status: string) {
  return status === "done" || status === "completed";
}

function getMvpDefinition(project: StudentProject | null) {
  const data = project?.project_data ?? {};
  const mvp = data.mvp ?? data.mvp_definition ?? data.mvpDefinition;
  return typeof mvp === "string" && mvp.trim() ? mvp : "Define the smallest useful version, then build that first.";
}

export function ProjectOverview({ project, tasks, loading = false }: ProjectOverviewProps) {
  const completedTasks = tasks.filter((task) => isDone(task.status)).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const updatedAt = project?.updated_at ? new Date(project.updated_at).toLocaleString() : "Not started yet";

  if (loading) {
    return <section className="h-64 animate-pulse rounded-2xl bg-white/80" />;
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Project Mentor</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{project?.title ?? "No active project yet"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {project?.description ?? "Start a project from your dashboard to unlock builder guidance, task planning, and code review support."}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-sm text-cyan-200">Progress</p>
          <p className="text-3xl font-black">{progress}%</p>
          <p className="text-xs text-slate-300">{completedTasks} of {tasks.length} tasks done</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">MVP definition</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getMvpDefinition(project)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Last updated</p>
          <p className="mt-2 text-sm text-slate-600">{updatedAt}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
