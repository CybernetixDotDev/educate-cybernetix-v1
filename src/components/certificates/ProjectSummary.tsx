"use client";

import type { CertificateJSON } from "@/lib/ai/generateCertificate";

type ProjectSummaryProps = {
  summary: CertificateJSON["project_summary"] | null;
  onChange?: (summary: CertificateJSON["project_summary"]) => void;
  editable?: boolean;
};

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function ProjectSummary({ summary, onChange, editable = false }: ProjectSummaryProps) {
  if (!summary) return null;

  function update(patch: Partial<CertificateJSON["project_summary"]>) {
    if (!summary) return;
    onChange?.({
      title: patch.title ?? summary.title,
      description: patch.description ?? summary.description,
      features: patch.features ?? summary.features,
      tech_stack: patch.tech_stack ?? summary.tech_stack,
      github_url: patch.github_url ?? summary.github_url,
      live_url: patch.live_url ?? summary.live_url,
    });
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Project Summary</p>
      {editable ? (
        <div className="mt-4 space-y-3">
          <input value={summary.title} onChange={(event) => update({ title: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-black" />
          <textarea value={summary.description} onChange={(event) => update({ description: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={summary.features.join("\n")} onChange={(event) => update({ features: lines(event.target.value) })} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={summary.tech_stack.join(", ")} onChange={(event) => update({ tech_stack: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={summary.github_url} onChange={(event) => update({ github_url: event.target.value })} placeholder="GitHub URL" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={summary.live_url} onChange={(event) => update({ live_url: event.target.value })} placeholder="Live demo URL" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      ) : (
        <div className="mt-4">
          <h2 className="text-2xl font-black text-slate-950">{summary.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{summary.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.tech_stack.map((tech) => (
              <span key={tech} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">{tech}</span>
            ))}
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {summary.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.github_url && <a href={summary.github_url} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">GitHub</a>}
            {summary.live_url && <a href={summary.live_url} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Live Demo</a>}
          </div>
        </div>
      )}
    </section>
  );
}
