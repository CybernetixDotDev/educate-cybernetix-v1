"use client";

import type { CodeReview } from "@/lib/ai/reviewCode";
import type { CodeReviewFix } from "@/lib/ai/generateCodeFixes";

type CodeReviewOutputProps = {
  review: CodeReview | null;
  fix: CodeReviewFix | null;
  improvedCode: string;
  patchDiff: string;
  onImprovedCodeChange: (value: string) => void;
};

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-6 text-center">
      <p className="text-sm font-black text-cyan-900">Review output will appear here</p>
      <p className="mt-2 text-sm text-cyan-800">Run a review, generate fixes, then inspect the patch diff.</p>
    </div>
  );
}

function SuggestionList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function CodeReviewOutput({
  review,
  fix,
  improvedCode,
  patchDiff,
  onImprovedCodeChange,
}: CodeReviewOutputProps) {
  const hasOutput = Boolean(review || fix || patchDiff);

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">AI Review Output</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Comments, recommendations, and fixes</h2>
      </div>

      <div className="mt-5 space-y-5">
        {!hasOutput && <EmptyState />}

        {review && review.inline_comments.length > 0 && (
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-black text-slate-950">Inline comments</h3>
            <div className="mt-4 space-y-3">
              {review.inline_comments.map((comment, index) => (
                <div key={`${comment.line}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                      line {comment.line}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        comment.severity === "error"
                          ? "bg-rose-100 text-rose-700"
                          : comment.severity === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {comment.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          </article>
        )}

        {review && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SuggestionList title="Best practices" items={review.best_practices} />
            <SuggestionList title="Performance notes" items={review.performance} />
            <SuggestionList title="Clarity improvements" items={review.clarity} />
            <SuggestionList title="Security warnings" items={review.security} />
            <SuggestionList title="Accessibility warnings" items={review.accessibility} />
          </div>
        )}

        {fix && (
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-black text-slate-950">Improvement plan</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{fix.explanation}</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {fix.steps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          </article>
        )}

        {(fix || improvedCode) && (
          <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">Corrected code</h3>
              <span className="text-xs font-bold uppercase tracking-wide text-cyan-200">editable</span>
            </div>
            <textarea
              value={improvedCode}
              onChange={(event) => onImprovedCodeChange(event.target.value)}
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
