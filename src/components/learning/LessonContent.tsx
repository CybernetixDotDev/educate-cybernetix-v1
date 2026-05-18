import type { Lesson } from "@/lib/lessons/getLesson";

type LessonContentProps = {
  lesson: Lesson;
};

const SECTION_TONES: Record<NonNullable<Lesson["body"][number]["tone"]>, string> = {
  default: "border-slate-200 bg-white",
  goal: "border-cyan-200 bg-cyan-50",
  example: "border-violet-200 bg-violet-50",
  task: "border-emerald-200 bg-emerald-50",
  checkpoint: "border-amber-200 bg-amber-50",
  mistake: "border-rose-200 bg-rose-50",
  mentor: "border-indigo-200 bg-indigo-50",
  recap: "border-slate-300 bg-slate-100",
  diagram: "border-slate-300 bg-slate-50",
};

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

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
          {lesson.body.map((section, index) => (
            <section key={`${section.heading}-${index}`} className={`rounded-lg border p-4 ${SECTION_TONES[section.tone ?? "default"]}`}>
              <h2 className="text-xl font-semibold text-slate-950">{section.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
      </div>

      {lesson.videos.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Lesson Video</h2>
          <div className="mt-4 space-y-4">
            {lesson.videos.map((video, index) => {
              const embedUrl = youtubeEmbedUrl(video.url);
              return (
                <article key={`${video.url}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="p-4">
                      <a href={video.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-cyan-700 hover:text-cyan-900">
                        Open video
                      </a>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-950">{video.title}</h3>
                    {video.transcript && <p className="mt-2 text-sm leading-6 text-slate-600">{video.transcript}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {lesson.codeExamples.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Code Practice</h2>
          <div className="mt-4 space-y-4">
            {lesson.codeExamples.map((example, index) => (
              <div key={`${example.title}-${index}`} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
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
          {lesson.images.map((image, index) => (
            <figure key={`${image.src}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} className="aspect-video w-full rounded-md object-cover" />
              {image.caption && <figcaption className="mt-2 text-sm text-slate-500">{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}
    </article>
  );
}
