"use client";

type CodeInputPanelProps = {
  code: string;
  errorMessage: string;
  moduleId: string;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onErrorMessageChange: (value: string) => void;
  onModuleIdChange: (value: string) => void;
  onAnalyze: () => Promise<void>;
};

export function CodeInputPanel({
  code,
  errorMessage,
  moduleId,
  loading,
  onCodeChange,
  onErrorMessageChange,
  onModuleIdChange,
  onAnalyze,
}: CodeInputPanelProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Code Input</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Debug a real error</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Paste the code and the exact error message. Include the file name in the error if you have it.
          </p>
        </div>
        <input
          value={moduleId}
          onChange={(event) => onModuleIdChange(event.target.value)}
          placeholder="module_id optional"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Code</span>
          <textarea
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Paste your component, route, hook, or function here..."
            className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-cyan-50 outline-none focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Error message</span>
          <textarea
            value={errorMessage}
            onChange={(event) => onErrorMessageChange(event.target.value)}
            rows={6}
            spellCheck={false}
            placeholder="Paste the terminal, browser, or Supabase error here..."
            className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-cyan-400"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void onAnalyze()}
        disabled={loading || !code.trim() || !errorMessage.trim()}
        className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </section>
  );
}
