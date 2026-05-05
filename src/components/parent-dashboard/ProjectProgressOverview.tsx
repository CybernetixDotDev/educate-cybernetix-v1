type ProjectTask = {
  id: string;
  title: string;
  status: string;
  completed_at: string | null;
  updated_at: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  project_tasks?: ProjectTask[];
};

type ProjectStats = {
  completed: number;
  total: number;
  percent: number;
};

export function ProjectProgressOverview({ project, stats }: { project: Project | null; stats: ProjectStats }) {
  const meaning =
    stats.total === 0
      ? "Your learner has not started a tracked task list yet. The next helpful step is choosing a small first feature."
      : stats.percent >= 75
        ? "The project is moving toward demo-ready. Ask what they want users to notice first."
        : stats.percent >= 35
          ? "The project has visible momentum. Help them focus on one task at a time."
          : "The project is still early. Encouragement and short planning conversations matter most.";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Project Progress Overview</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{project?.title ?? "No active project yet"}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{project?.description ?? "Project details will appear once a student project is created."}</p>
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          <span>{stats.completed} of {stats.total} tasks complete</span>
          <span>{stats.percent}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.percent}%` }} />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {(project?.project_tasks ?? []).slice(0, 4).map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="font-semibold text-slate-800">{task.title}</span>
            <span className="text-xs font-bold text-slate-500">{task.status}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-emerald-50 p-4">
        <h3 className="text-sm font-semibold text-emerald-950">What this means</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{meaning}</p>
      </div>
    </section>
  );
}

