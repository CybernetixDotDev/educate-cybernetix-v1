"use client";

import type { GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";

type SkillProgressionChartProps = {
  skillProgression: GrowthTimelineJSON["skill_progression"] | null;
  onChange?: (skillProgression: GrowthTimelineJSON["skill_progression"]) => void;
  editable?: boolean;
};

const SKILLS = ["html", "css", "javascript", "nextjs", "supabase", "threejs", "git", "apis"] as const;

export function SkillProgressionChart({ skillProgression, onChange, editable = false }: SkillProgressionChartProps) {
  if (!skillProgression) return null;

  function update(skill: keyof GrowthTimelineJSON["skill_progression"], value: string) {
    if (!skillProgression) return;
    onChange?.({
      html: skillProgression.html,
      css: skillProgression.css,
      javascript: skillProgression.javascript,
      nextjs: skillProgression.nextjs,
      supabase: skillProgression.supabase,
      threejs: skillProgression.threejs,
      git: skillProgression.git,
      apis: skillProgression.apis,
      [skill]: value.split(",").map((item) => Number(item.trim()) || 0).slice(0, 12),
    });
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Skill Progression</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {SKILLS.map((skill) => {
          const values = skillProgression[skill];
          const latest = values.at(-1) ?? 0;
          return (
            <div key={skill} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase text-slate-800">{skill}</p>
                <p className="text-sm font-black text-slate-950">{latest}%</p>
              </div>
              <div className="mt-3 flex h-24 items-end gap-1">
                {values.map((value, index) => (
                  <div key={`${skill}-${index}`} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-violet-500" style={{ height: `${Math.max(4, value)}%` }} />
                ))}
              </div>
              {editable && (
                <input value={values.join(", ")} onChange={(event) => update(skill, event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
