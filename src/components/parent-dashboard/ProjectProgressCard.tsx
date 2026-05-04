import Link from "next/link";

export type ProjectMilestone = {
  id: string;
  title: string;
  status: string;
  completedAt: string | null;
};

type ProjectProgressCardProps = {
  title: string;
  progress: number;
  milestones: ProjectMilestone[];
  lastCommitTime: string | null;
  projectUrl: string | null;
};

export function ProjectProgressCard({
  title,
  progress,
  milestones,
  lastCommitTime,
  projectUrl,
}: ProjectProgressCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Project Progress</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Last commit: {lastCommitTime ? new Date(lastCommitTime).toLocaleString() : "Not connected yet"}
          </p>
        </div>
        <Link
          href={projectUrl ?? "/parent/dashboard"}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View Project
        </Link>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <span>MVP progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="mt-6 space-y-4">
        {milestones.length > 0 ? (
          milestones.map((milestone) => (
            <li key={milestone.id} className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 rounded-full ${
                  milestone.status === "completed" ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{milestone.title}</p>
                <p className="text-sm text-slate-500">
                  {milestone.status === "completed"
                    ? `Completed ${milestone.completedAt ? new Date(milestone.completedAt).toLocaleDateString() : ""}`
                    : "In progress"}
                </p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Project milestones will appear here.</li>
        )}
      </ol>
    </section>
  );
}
