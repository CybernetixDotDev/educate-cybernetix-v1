"use client";

import type { DebugAnalysis } from "@/lib/ai/analyzeError";
import type { DebugFix } from "@/lib/ai/generateFix";

type DebuggingOutputPanelProps = {
  analysis: DebugAnalysis | null;
  fix: DebugFix | null;
  patchDiff: string;
  correctedCode: string;
  onCorrectedCodeChange: (value: string) => void;
};

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-6 text-center">
      <p className="text-sm font-black text-cyan-900">Debugging output will appear here</p>
      <p className="mt-2 text-sm text-cyan-800">Start with Analyze Error, then generate a fix and patch diff.</p>
    </div>
  );
}

export function DebuggingOutputPanel({
  analysis,
  fix,
  patchDiff,
  correctedCode,
  onCorrectedCodeChange,
}: DebuggingOutputPanelProps) {
  const hasOutput = Boolean(analysis || fix || patchDiff);

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">AI Debugging Output</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Root cause, fix, and patch</h2>
      </div>

      <div className="mt-5 space-y-5">
        {!hasOutput && <EmptyState />}

        {analysis && (
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                {analysis.error_category}
              </span>
              {analysis.likely_file && (
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                  {analysis.likely_file}
                  {analysis.likely_line ? `:${analysis.likely_line}` : ""}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">Root cause</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.root_cause}</p>
            <h3 className="mt-4 text-lg font-black text-slate-950">Explanation</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.explanation}</p>
          </article>
        )}

        {fix && (
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-black text-slate-950">Fix suggestions</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{fix.explanation}</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {fix.steps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          </article>
        )}

        {(fix || correctedCode) && (
          <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">Corrected code</h3>
              <span className="text-xs font-bold uppercase tracking-wide text-cyan-200">editable</span>
            </div>
            <textarea
              value={correctedCode}
              onChange={(event) => onCorrectedCodeChange(event.target.value)}
              rows={16}
              spellCheck={false}
              className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-sm leading-6 text-cyan-50 outline-none focus:border-cyan-400"
            />
          </article>
        )}

        {patchDiff && (
          <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
            <h3 className="text-lg font-black text-white">Patch diff</h3>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-5 text-cyan-50">
              <code>{patchDiff}</code>
            </pre>
          </article>
        )}
      </div>
    </section>
  );
}
