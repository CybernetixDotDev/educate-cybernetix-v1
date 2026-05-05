"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type GrowthMomentsProps = {
  moments: GrowthTimelineJSON["growth_moments"];
  onChange?: (moments: GrowthTimelineJSON["growth_moments"]) => void;
  editable?: boolean;
};

export function GrowthMoments({ moments, onChange, editable = false }: GrowthMomentsProps) {
  function update(index: number, patch: Partial<GrowthTimelineJSON["growth_moments"][number]>) {
    onChange?.(moments.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Growth Moments</p>
      <div className="mt-5 space-y-3">
        {moments.map((item, index) => (
          <article key={`${item.week}-${item.moment}-${index}`} className="rounded-2xl border border-slate-200 bg-violet-50 p-4">
            {editable ? (
              <div className="grid gap-3">
                <input type="number" value={item.week} onChange={(event) => update(index, { week: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={item.moment} onChange={(event) => update(index, { moment: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black" />
                <textarea value={item.insight} onChange={(event) => update(index, { insight: event.target.value })} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-wide text-violet-700">Week {item.week}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{item.moment}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.insight}</p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
