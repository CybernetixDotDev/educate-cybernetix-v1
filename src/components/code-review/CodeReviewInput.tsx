"use client";

type CodeReviewInputProps = {
  code: string;
  moduleId: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onModuleIdChange: (value: string) => void;
  onReview: () => Promise<void>;
};

export function CodeReviewInput({
  code,
  moduleId,
  loading,
  onCodeChange,
  onModuleIdChange,
  onReview,
}: CodeReviewInputProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Code Review</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Improve code before shipping</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Paste a component, hook, route, or function. The review checks clarity, performance, security, and accessibility.
          </p>
        </div>
        <input
          value={moduleId}
          onChange={(event) => onModuleIdChange(event.target.value)}
          placeholder="module_id optional"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-slate-700">Student code</span>
        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          rows={20}
          spellCheck={false}
          placeholder="Paste your code here..."
          className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-cyan-50 outline-none focus:border-cyan-400"
        />
      </label>

      <button
        type="button"
        onClick={() => void onReview()}
        disabled={loading || !code.trim()}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Reviewing..." : "Review Code"}
      </button>
    </section>
  );
}
