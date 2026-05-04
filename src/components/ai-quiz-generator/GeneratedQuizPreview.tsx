"use client";

import type { GeneratedQuiz, GeneratedQuizQuestion } from "@/lib/ai/generateQuiz";

type GeneratedQuizPreviewProps = {
  quiz: GeneratedQuiz | null;
  onChange: (quiz: GeneratedQuiz) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function GeneratedQuizPreview({ quiz, onChange }: GeneratedQuizPreviewProps) {
  if (!quiz) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Generated quiz preview will appear here.
      </section>
    );
  }

  function updateQuestion(index: number, patch: Partial<GeneratedQuizQuestion>) {
    if (!quiz) {
      return;
    }

    onChange({
      ...quiz,
      questions: quiz.questions.map((question, itemIndex) =>
        itemIndex === index ? { ...question, ...patch } : question,
      ),
    });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <span className="font-semibold text-slate-800">Module:</span> {quiz.module_id}
          </div>
          <div>
            <span className="font-semibold text-slate-800">Lesson:</span> {quiz.lesson_id ?? "none"}
          </div>
          <div>
            <span className="font-semibold text-slate-800">Type:</span> {quiz.quiz_type}
          </div>
        </div>
      </div>

      {quiz.questions.map((question, index) => (
        <article key={`${question.question}-${index}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">Question {index + 1}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {question.type}
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-800">Question</span>
              <textarea
                value={question.question}
                onChange={(event) => updateQuestion(index, { question: event.target.value })}
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-slate-800">Type</span>
              <select
                value={question.type}
                onChange={(event) => {
                  const type = event.target.value as GeneratedQuizQuestion["type"];
                  updateQuestion(index, {
                    type,
                    options: type === "short" ? [] : type === "truefalse" ? ["True", "False"] : question.options,
                  });
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="mcq">Multiple choice</option>
                <option value="truefalse">True/false</option>
                <option value="short">Short answer</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-slate-800">Difficulty</span>
              <select
                value={question.difficulty}
                onChange={(event) => updateQuestion(index, { difficulty: event.target.value as GeneratedQuizQuestion["difficulty"] })}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-slate-800">Correct answer</span>
              <input
                value={question.correct_answer}
                onChange={(event) => updateQuestion(index, { correct_answer: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-slate-800">Skill tags</span>
              <input
                value={question.skill_tags.join(", ")}
                onChange={(event) => updateQuestion(index, { skill_tags: csv(event.target.value) })}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            {question.type !== "short" && (
              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-slate-800">Options</span>
                <textarea
                  value={question.options.join("\n")}
                  onChange={(event) => updateQuestion(index, { options: event.target.value.split("\n") })}
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
              </label>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
