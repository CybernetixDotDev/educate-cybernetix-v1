"use client";

import type { PresentationPlan } from "@/lib/ai/generatePresentation";

type QAPrepPanelProps = {
  qa: PresentationPlan["qa_prep"];
  onChange: (qa: PresentationPlan["qa_prep"]) => void;
};

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function QAPrepPanel({ qa, onChange }: QAPrepPanelProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Q&A Prep</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Questions, answers, and recovery plans</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-black text-slate-700">Predicted questions</span>
          <textarea
            value={qa.questions.join("\n")}
            onChange={(event) => onChange({ ...qa, questions: lines(event.target.value) })}
            rows={8}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-black text-slate-700">Suggested answers</span>
          <textarea
            value={qa.answers.join("\n")}
            onChange={(event) => onChange({ ...qa, answers: lines(event.target.value) })}
            rows={8}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-black text-slate-700">If you get stuck</span>
          <textarea
            value={qa.fallback_strategies.join("\n")}
            onChange={(event) => onChange({ ...qa, fallback_strategies: lines(event.target.value) })}
            rows={8}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </section>
  );
}
