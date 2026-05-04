"use client";

type QuizActionsProps = {
  hasQuiz: boolean;
  loading: boolean;
  selectedQuestion: number;
  onGenerate: () => void;
  onRegenerateQuestion: () => void;
  onSave: () => void;
  onSelectedQuestionChange: (index: number) => void;
  questionCount: number;
};

export function QuizActions({
  hasQuiz,
  loading,
  selectedQuestion,
  onGenerate,
  onRegenerateQuestion,
  onSave,
  onSelectedQuestionChange,
  questionCount,
}: QuizActionsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Actions</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr]">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          Generate Quiz
        </button>
        <select
          value={selectedQuestion}
          onChange={(event) => onSelectedQuestionChange(Number(event.target.value))}
          disabled={!hasQuiz || loading}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        >
          {Array.from({ length: Math.max(questionCount, 1) }, (_, index) => (
            <option key={index} value={index}>
              Question {index + 1}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRegenerateQuestion}
          disabled={loading || !hasQuiz}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
        >
          Regenerate Question
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !hasQuiz}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          Save Quiz
        </button>
      </div>
    </section>
  );
}
