import type { Lesson } from "@/lib/lessons/getLesson";
import Image from "next/image";

type LessonContentProps = {
  lesson: Lesson;
};

export function LessonContent({ lesson }: LessonContentProps) {
  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">{lesson.moduleId}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{lesson.summary}</p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          {lesson.body.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-slate-950">{section.heading}</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      {lesson.codeExamples.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Code Practice</h2>
          <div className="mt-4 space-y-4">
            {lesson.codeExamples.map((example) => (
              <div key={example.title} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <p className="text-sm font-semibold text-slate-100">{example.title}</p>
                  <span className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-slate-300">
                    {example.language}
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm leading-6 text-cyan-100">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {lesson.images.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {lesson.images.map((image) => (
            <figure key={image.src} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <Image
                src={image.src}
                alt={image.alt}
                width={960}
                height={540}
                className="aspect-video rounded-md object-cover"
              />
              {image.caption && <figcaption className="mt-2 text-sm text-slate-500">{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}
    </article>
  );
}
