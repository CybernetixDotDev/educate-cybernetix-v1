"use client";

import type { PresentationPlan } from "@/lib/ai/generatePresentation";

type DeliveryCoachPanelProps = {
  coaching: PresentationPlan["delivery_coaching"];
  onChange: (coaching: PresentationPlan["delivery_coaching"]) => void;
};

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function DeliveryCoachPanel({ coaching, onChange }: DeliveryCoachPanelProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Delivery Coach</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Confidence, pacing, and timing</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {(["confidence", "voice", "pacing", "body_language", "timing"] as const).map((key) => (
          <label key={key} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-black capitalize text-slate-700">{key.replace("_", " ")}</span>
            <textarea
              value={coaching[key].join("\n")}
              onChange={(event) => onChange({ ...coaching, [key]: lines(event.target.value) })}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
