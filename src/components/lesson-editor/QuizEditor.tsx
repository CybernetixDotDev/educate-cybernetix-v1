"use client";

import type { LessonAuthoringQuestion, LessonAuthoringSchema } from "@/lib/lessons/saveLesson";

type QuizEditorProps = {
  lesson: LessonAuthoringSchema;
  onChange: (lesson: LessonAuthoringSchema) => void;
};

const EMPTY_QUESTION: LessonAuthoringQuestion = {
  type: "mcq",
  question: "",
  options: ["", "", "", ""],
  correct_answer: "",
  difficulty: "easy",
  skill_tags: [],
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function QuizEditor({ lesson, onChange }: QuizEditorProps) {
  const questions = lesson.quiz.questions;

  function updateQuestions(nextQuestions: LessonAuthoringQuestion[]) {
    onChange({ ...lesson, quiz: { questions: nextQuestions } });
  }

  function updateQuestion(index: number, patch: Partial<LessonAuthoringQuestion>) {
    updateQuestions(questions.map((question, itemIndex) => (itemIndex === index ? { ...question, ...patch } : question)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">Quiz Questions</h2>
        <button
          type="button"
          onClick={() => updateQuestions([...questions, { ...EMPTY_QUESTION }])}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
        >
          Add Question
        </button>
      </div>

      {questions.map((question, index) => (
        <section key={`${question.question}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Question {index + 1}</h3>
            <button
              type="button"
              onClick={() => updateQuestions(questions.filter((_, itemIndex) => itemIndex !== index))}
              className="text-sm font-semibold text-rose-600"
            >
              Remove
            </button>
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
                  const type = event.target.value as LessonAuthoringQuestion["type"];
                  updateQuestion(index, {
                    type,
                    options: type === "truefalse" ? ["True", "False"] : type === "short" ? [] : question.options,
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
                onChange={(event) => updateQuestion(index, { difficulty: event.target.value as LessonAuthoringQuestion["difficulty"] })}
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
        </section>
      ))}
    </div>
  );
}
