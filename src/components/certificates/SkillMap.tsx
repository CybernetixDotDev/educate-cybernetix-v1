"use client";

import type { CertificateJSON } from "@/lib/ai/generateCertificate";

type SkillMapProps = {
  skillMap: CertificateJSON["skill_map"] | null;
  onChange?: (skillMap: CertificateJSON["skill_map"]) => void;
  editable?: boolean;
};

const SKILLS = [
  ["html", "HTML"],
  ["css", "CSS"],
  ["javascript", "JavaScript"],
  ["nextjs", "Next.js"],
  ["supabase", "Supabase"],
  ["threejs", "Three.js"],
  ["git", "Git"],
  ["apis", "APIs"],
] as const;

export function SkillMap({ skillMap, onChange, editable = false }: SkillMapProps) {
  if (!skillMap) return null;

  function update(key: keyof CertificateJSON["skill_map"], value: number) {
    if (!skillMap) return;
    onChange?.({
      html: skillMap.html,
      css: skillMap.css,
      javascript: skillMap.javascript,
      nextjs: skillMap.nextjs,
      supabase: skillMap.supabase,
      threejs: skillMap.threejs,
      git: skillMap.git,
      apis: skillMap.apis,
      [key]: Math.min(100, Math.max(0, value)),
    });
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Skill Mastery Map</p>
      <div className="mt-5 space-y-4">
        {SKILLS.map(([key, label]) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-800">{label}</p>
              {editable ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={skillMap[key]}
                  onChange={(event) => update(key, Number(event.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-black"
                />
              ) : (
                <p className="text-sm font-black text-slate-950">{skillMap[key]}%</p>
              )}
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${skillMap[key]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
