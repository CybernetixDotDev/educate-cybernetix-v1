"use client";

type PresentationActionsProps = {
  loading: boolean;
  disabled: boolean;
  hasPlan: boolean;
  onGenerate: () => Promise<void>;
  onRegenerateOutline: () => Promise<void>;
  onRegenerateScript: () => Promise<void>;
  onRegenerateDemo: () => Promise<void>;
  onRegenerateQA: () => Promise<void>;
  onSave: () => Promise<void>;
};

export function PresentationActions({
  loading,
  disabled,
  hasPlan,
  onGenerate,
  onRegenerateOutline,
  onRegenerateScript,
  onRegenerateDemo,
  onRegenerateQA,
  onSave,
}: PresentationActionsProps) {
  const blocked = loading || disabled;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Presentation Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" onClick={() => void onGenerate()} disabled={blocked} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Generating..." : "Generate Full Presentation"}
        </button>
        <button type="button" onClick={() => void onRegenerateOutline()} disabled={blocked} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          Regenerate Outline
        </button>
        <button type="button" onClick={() => void onRegenerateScript()} disabled={blocked} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          Regenerate Script
        </button>
        <button type="button" onClick={() => void onRegenerateDemo()} disabled={blocked} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          Regenerate Demo
        </button>
        <button type="button" onClick={() => void onRegenerateQA()} disabled={blocked} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          Regenerate Q&A
        </button>
        <button type="button" onClick={() => void onSave()} disabled={blocked || !hasPlan} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Save Presentation
        </button>
      </div>
    </section>
  );
}
