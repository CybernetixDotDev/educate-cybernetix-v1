import type { LessonAuthoringSchema } from "@/lib/lessons/saveLesson";

type LessonPreviewProps = {
  lesson: LessonAuthoringSchema;
};

function renderMarkdown(text: string) {
  return text.split(/\n{2,}/).filter(Boolean).map((block, index) => {
    if (block.startsWith("### ")) {
      return <h3 key={index} className="text-xl font-semibold text-slate-950">{block.slice(4)}</h3>;
    }

    if (block.startsWith("## ")) {
      return <h2 key={index} className="text-2xl font-bold text-slate-950">{block.slice(3)}</h2>;
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

export function LessonPreview({ lesson }: LessonPreviewProps) {
  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">{lesson.metadata.module_id}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{lesson.title || "Untitled lesson"}</h1>
        {lesson.description && <p className="mt-3 text-slate-600">{lesson.description}</p>}
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">{renderMarkdown(lesson.body || "Lesson content preview will appear here.")}</div>
      </section>

      {lesson.codeExamples.map((example, index) => (
        <section key={`${example.language}-${index}`} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
          <div className="border-b border-white/10 px-4 py-2 text-sm font-semibold text-slate-300">{example.language}</div>
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-cyan-100"><code>{example.code}</code></pre>
        </section>
      ))}

      {lesson.images.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {lesson.images.map((image) => (
            <div key={image} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="aspect-video w-full rounded object-cover" />
            </div>
          ))}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Quiz Preview</h2>
        <div className="mt-4 space-y-3">
          {lesson.quiz.questions.length > 0 ? lesson.quiz.questions.map((question, index) => (
            <div key={`${question.question}-${index}`} className="rounded-lg bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{index + 1}. {question.question}</p>
              <p className="mt-1 text-sm text-slate-500">{question.type} - {question.difficulty}</p>
              {question.options.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {question.options.map((option) => <li key={option}>{option}</li>)}
                </ul>
              )}
            </div>
          )) : <p className="text-sm text-slate-500">No quiz questions yet.</p>}
        </div>
      </section>
    </article>
  );
}
