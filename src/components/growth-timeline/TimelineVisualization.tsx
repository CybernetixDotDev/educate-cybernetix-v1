"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type TimelineVisualizationProps = { timeline: GrowthTimelineJSON | null };

export function TimelineVisualization({ timeline }: TimelineVisualizationProps) {
  if (!timeline) {
    return (
      <section className="rounded-2xl border border-dashed border-cyan-300 bg-white/90 p-8 text-center text-sm text-slate-500 shadow-sm">
        Growth timeline will appear here.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Growth Timeline</p>
      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-[56rem] gap-3">
          {Array.from({ length: 12 }, (_, index) => {
            const week = index + 1;
            const milestones = timeline.milestones.filter((item) => item.week === week);
            const moments = timeline.growth_moments.filter((item) => item.week === week);
            const project = timeline.project_evolution.find((item) => item.week === week);
            return (
              <div key={week} className="min-h-56 w-44 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-black text-white">
                  {week}
                </div>
                <div className="mt-3 space-y-2">
                  {milestones.slice(0, 2).map((item) => (
                    <div key={`${item.title}-${item.date}`} className="rounded-xl bg-white p-2 text-xs font-semibold text-slate-700">
                      {item.title}
                    </div>
                  ))}
                  {project && (
                    <div className="rounded-xl bg-cyan-50 p-2 text-xs text-cyan-900">
                      {project.completed_tasks}/{project.total_tasks} tasks
                    </div>
                  )}
                  {moments.slice(0, 1).map((item) => (
                    <div key={item.moment} className="rounded-xl bg-violet-50 p-2 text-xs text-violet-900">
                      {item.moment}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
