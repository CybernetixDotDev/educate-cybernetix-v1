"use client";

import type { DemoWalkthroughItem, PresentationPlan, ScriptItem } from "@/lib/ai/generatePresentation";

type ScriptPanelProps = {
  script: ScriptItem[];
  demo: DemoWalkthroughItem[];
  storytelling: PresentationPlan["storytelling"];
  onScriptChange: (script: ScriptItem[]) => void;
  onDemoChange: (demo: DemoWalkthroughItem[]) => void;
  onStorytellingChange: (storytelling: PresentationPlan["storytelling"]) => void;
};

export function ScriptPanel({
  script,
  demo,
  storytelling,
  onScriptChange,
  onDemoChange,
  onStorytellingChange,
}: ScriptPanelProps) {
  function updateScript(index: number, speaker_notes: string) {
    onScriptChange(script.map((item, itemIndex) => (itemIndex === index ? { ...item, speaker_notes } : item)));
  }

  function updateDemo(index: number, patch: Partial<DemoWalkthroughItem>) {
    onDemoChange(demo.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Script</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Speaker notes and demo flow</h2>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {(["hook", "problem", "solution", "impact"] as const).map((key) => (
          <label key={key} className="block">
            <span className="text-sm font-black capitalize text-slate-700">{key}</span>
            <textarea
              value={storytelling[key]}
              onChange={(event) => onStorytellingChange({ ...storytelling, [key]: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-black text-slate-950">Slide-by-slide script</h3>
        {script.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Generate a script to fill this section.</p>}
        {script.map((item, index) => (
          <label key={`${item.slide}-${index}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-sm font-black text-slate-700">Slide {item.slide}</span>
            <textarea
              value={item.speaker_notes}
              onChange={(event) => updateScript(index, event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-black text-slate-950">Demo walkthrough</h3>
        {demo.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Generate a demo walkthrough to fill this section.</p>}
        {demo.map((item, index) => (
          <article key={`${item.step}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-black text-slate-700">Step {item.step}</p>
            <input
              value={item.action}
              onChange={(event) => updateDemo(index, { action: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
            />
            <textarea
              value={item.explanation}
              onChange={(event) => updateDemo(index, { explanation: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
