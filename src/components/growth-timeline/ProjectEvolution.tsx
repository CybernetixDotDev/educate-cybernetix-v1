"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type ProjectEvolutionProps = {
  projectEvolution: GrowthTimelineJSON["project_evolution"];
  onChange?: (projectEvolution: GrowthTimelineJSON["project_evolution"]) => void;
  editable?: boolean;
};

export function ProjectEvolution({ projectEvolution, onChange, editable = false }: ProjectEvolutionProps) {
  function update(index: number, patch: Partial<GrowthTimelineJSON["project_evolution"][number]>) {
    onChange?.(projectEvolution.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Project Evolution</p>
      <div className="mt-5 space-y-3">
        {projectEvolution.map((item, index) => (
          <article key={`${item.week}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {editable ? (
              <div className="grid gap-3 lg:grid-cols-[6rem_1fr_7rem_7rem]">
                <input type="number" value={item.week} onChange={(event) => update(index, { week: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={item.summary} onChange={(event) => update(index, { summary: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input type="number" value={item.completed_tasks} onChange={(event) => update(index, { completed_tasks: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input type="number" value={item.total_tasks} onChange={(event) => update(index, { total_tasks: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Week {item.week}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.summary}</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${item.total_tasks ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0}%` }} />
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
