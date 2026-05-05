"use client";

import type { CertificateJSON } from "@/lib/ai/generateCertificate";

type AchievementBadgesProps = {
  badges: CertificateJSON["achievement_badges"];
  onChange?: (badges: CertificateJSON["achievement_badges"]) => void;
  editable?: boolean;
};

export function AchievementBadges({ badges, onChange, editable = false }: AchievementBadgesProps) {
  function update(index: number, patch: Partial<CertificateJSON["achievement_badges"][number]>) {
    onChange?.(badges.map((badge, badgeIndex) => (badgeIndex === index ? { ...badge, ...patch } : badge)));
  }

  function addBadge() {
    onChange?.([...badges, { name: "New Badge", description: "Describe this achievement." }]);
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Achievement Badges</p>
        {editable && <button type="button" onClick={addBadge} className="rounded-xl border border-cyan-200 px-3 py-2 text-xs font-black text-cyan-800">Add Badge</button>}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {badges.map((badge, index) => (
          <article key={`${badge.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-lg font-black text-white">
              {badge.name.slice(0, 1)}
            </div>
            {editable ? (
              <div className="mt-3 space-y-2">
                <input value={badge.name} onChange={(event) => update(index, { name: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-black" />
                <textarea value={badge.description} onChange={(event) => update(index, { description: event.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            ) : (
              <>
                <h3 className="mt-3 text-base font-black text-slate-950">{badge.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{badge.description}</p>
              </>
            )}
          </article>
        ))}
        {badges.length === 0 && <p className="text-sm text-slate-500">No badges yet.</p>}
      </div>
    </section>
  );
}
