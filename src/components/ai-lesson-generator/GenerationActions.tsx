"use client";

type GenerationActionsProps = {
  hasLesson: boolean;
  loading: boolean;
  onGenerate: () => void;
  onRegenerateContent: () => void;
  onRegenerateQuiz: () => void;
  onRegenerateMetadata: () => void;
  onSave: () => void;
};

export function GenerationActions({
  hasLesson,
  loading,
  onGenerate,
  onRegenerateContent,
  onRegenerateQuiz,
  onRegenerateMetadata,
  onSave,
}: GenerationActionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          Generate Lesson
        </button>
        <button
          type="button"
          onClick={onRegenerateContent}
          disabled={loading || !hasLesson}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Regenerate Content
        </button>
        <button
          type="button"
          onClick={onRegenerateQuiz}
          disabled={loading || !hasLesson}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Regenerate Quiz
        </button>
        <button
          type="button"
          onClick={onRegenerateMetadata}
          disabled={loading || !hasLesson}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Regenerate Metadata
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !hasLesson}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          Save Lesson
        </button>
      </div>
    </section>
  );
}
