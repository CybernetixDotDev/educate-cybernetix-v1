"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type MilestoneListProps = {
  milestones: GrowthTimelineJSON["milestones"];
  onChange?: (milestones: GrowthTimelineJSON["milestones"]) => void;
  editable?: boolean;
};

export function MilestoneList({ milestones, onChange, editable = false }: MilestoneListProps) {
  function update(index: number, patch: Partial<GrowthTimelineJSON["milestones"][number]>) {
    onChange?.(milestones.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Milestones</p>
      <div className="mt-5 space-y-3">
        {milestones.map((item, index) => (
          <article key={`${item.week}-${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {editable ? (
              <div className="grid gap-3 lg:grid-cols-[6rem_1fr_10rem]">
                <input type="number" value={item.week} onChange={(event) => update(index, { week: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black" />
                <input value={item.date} onChange={(event) => update(index, { date: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <textarea value={item.description} onChange={(event) => update(index, { description: event.target.value })} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-3" />
              </div>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Week {item.week} • {item.date}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
