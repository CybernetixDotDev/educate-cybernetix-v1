"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type AchievementBadgesProps = { achievements: GrowthTimelineJSON["achievements"] };

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Achievements</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {achievements.map((item, index) => (
          <article key={`${item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-base font-black text-white">
              {item.name.slice(0, 1)}
            </div>
            <h3 className="mt-3 text-base font-black text-slate-950">{item.name}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{item.date}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
