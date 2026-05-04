import type { QuizAnswer, QuizQuestion as QuizQuestionType } from "@/hooks/useQuiz";

type QuizQuestionProps = {
  question: QuizQuestionType;
  answer: QuizAnswer | undefined;
  onAnswer: (answer: QuizAnswer) => void;
};

export function QuizQuestion({ question, answer, onAnswer }: QuizQuestionProps) {
  const isMultipleChoice = Array.isArray(question.options) && question.options.length > 0;
  const isTrueFalse =
    isMultipleChoice &&
    question.options?.length === 2 &&
    question.options.every((option) => option === "True" || option === "False");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">
        {isTrueFalse ? "True or False" : isMultipleChoice ? "Multiple Choice" : "Short Answer"}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">{question.prompt}</h1>

      {isMultipleChoice ? (
        <div className="mt-5 grid gap-3">
          {question.options?.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAnswer(option)}
              className={`rounded-lg border p-4 text-left text-sm font-medium transition ${
                answer === option
                  ? "border-cyan-500 bg-cyan-50 text-cyan-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onAnswer(event.target.value)}
          rows={5}
          className="mt-5 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          placeholder="Write your answer..."
        />
      )}
    </section>
  );
}
