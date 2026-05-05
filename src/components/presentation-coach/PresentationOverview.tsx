"use client";

import type { StudentProject } from "@/hooks/useProjectProgress";

type PresentationOverviewProps = {
  project: StudentProject | null;
  loading?: boolean;
};

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getMvp(project: StudentProject | null) {
  const data = project?.project_data ?? {};
  const value = data.mvp ?? data.mvp_summary ?? data.mvp_definition;
  return typeof value === "string" && value.trim() ? value : "A focused first version that proves the core idea works.";
}

function getFeatures(project: StudentProject | null) {
  const data = project?.project_data ?? {};
  return strings(data.key_features ?? data.features).slice(0, 6);
}

export function PresentationOverview({ project, loading = false }: PresentationOverviewProps) {
  const features = getFeatures(project);

  if (loading) return <section className="h-64 animate-pulse rounded-2xl bg-white/80" />;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Presentation Coach</p>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">{project?.title ?? "No active project selected"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {project?.description ?? "Start or select a project to generate a presentation outline, demo script, and Q&A prep."}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-sm text-cyan-200">Status</p>
          <p className="mt-1 text-2xl font-black capitalize">{project?.status?.replaceAll("_", " ") ?? "Not started"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
          <p className="text-sm font-black text-slate-900">MVP summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getMvp(project)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Tech stack</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(project?.technologies ?? []).map((tech) => (
              <span key={tech} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                {tech}
              </span>
            ))}
            {(project?.technologies ?? []).length === 0 && <p className="text-sm text-slate-500">Add technologies to the project profile.</p>}
          </div>
        </div>
      </div>

      {features.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-900">Key features</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {features.map((feature) => (
              <span key={feature} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
