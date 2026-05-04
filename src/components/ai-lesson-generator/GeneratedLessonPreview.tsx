"use client";

import type { GeneratedLesson } from "@/lib/ai/generateLesson";

type GeneratedLessonPreviewProps = {
  lesson: GeneratedLesson | null;
  onChange: (lesson: GeneratedLesson) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function renderMarkdown(body: string) {
  return body.split(/\n{2,}/).filter(Boolean).map((block, index) => {
    if (block.startsWith("## ")) {
      return <h2 key={index} className="text-2xl font-bold text-slate-950">{block.slice(3)}</h2>;
    }
    if (block.startsWith("### ")) {
      return <h3 key={index} className="text-xl font-semibold text-slate-950">{block.slice(4)}</h3>;
    }
    if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
      return (
        <ul key={index} className="list-disc space-y-1 pl-5 text-slate-600">
          {block.split("\n").map((line) => <li key={line}>{line.replace(/^- /, "")}</li>)}
        </ul>
      );
    }
    return <p key={index} className="whitespace-pre-wrap leading-7 text-slate-600">{block}</p>;
  });
}

export function GeneratedLessonPreview({ lesson, onChange }: GeneratedLessonPreviewProps) {
  if (!lesson) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Generated lesson preview will appear here.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Editable Generated Lesson</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-800">Title</span>
            <input
              value={lesson.title}
              onChange={(event) => onChange({ ...lesson, title: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-800">Body markdown</span>
            <textarea
              value={lesson.body}
              onChange={(event) => onChange({ ...lesson, body: event.target.value })}
              rows={14}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6"
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">lesson_id</span>
            <input
              value={lesson.metadata.lesson_id}
              onChange={(event) =>
                onChange({ ...lesson, metadata: { ...lesson.metadata, lesson_id: event.target.value } })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-800">skill_tags</span>
            <input
              value={lesson.metadata.skill_tags.join(", ")}
              onChange={(event) =>
                onChange({ ...lesson, metadata: { ...lesson.metadata, skill_tags: csv(event.target.value) } })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">{lesson.metadata.module_id}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{lesson.title}</h1>
        <div className="mt-6 space-y-5">{renderMarkdown(lesson.body)}</div>
      </article>

      {lesson.codeExamples.length > 0 && (
        <section className="space-y-3">
          {lesson.codeExamples.map((example, index) => (
            <div key={`${example.language}-${index}`} className="overflow-hidden rounded-lg bg-slate-950">
              <div className="border-b border-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
                {example.language}
              </div>
              <pre className="overflow-x-auto p-4 text-sm text-cyan-100"><code>{example.code}</code></pre>
            </div>
          ))}
        </section>
      )}

      {lesson.images.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {lesson.images.map((image) => (
            <div key={image} className="rounded-lg border border-slate-200 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="aspect-video w-full rounded object-cover" />
            </div>
          ))}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Quiz Preview</h2>
        <div className="mt-4 space-y-3">
          {lesson.quiz.questions.map((question, index) => (
            <div key={`${question.question}-${index}`} className="rounded-lg bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{index + 1}. {question.question}</p>
              <p className="mt-1 text-sm text-slate-500">{question.type} - {question.difficulty}</p>
              {question.options.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {question.options.map((option) => <li key={option}>{option}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Metadata Preview</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-cyan-100">
          {JSON.stringify(lesson.metadata, null, 2)}
        </pre>
      </section>
    </section>
  );
}
