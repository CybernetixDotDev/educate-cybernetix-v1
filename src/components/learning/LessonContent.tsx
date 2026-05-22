import type { Lesson } from "@/lib/lessons/getLesson";

type LessonContentProps = {
  lesson: Lesson;
};

const SECTION_TONES: Record<NonNullable<Lesson["body"][number]["tone"]>, string> = {
  default: "border-slate-200 bg-white",
  goal: "border-teal-200 bg-teal-50",
  example: "border-indigo-200 bg-indigo-50",
  task: "border-emerald-200 bg-emerald-50",
  checkpoint: "border-amber-200 bg-amber-50",
  mistake: "border-rose-200 bg-rose-50",
  mentor: "border-sky-200 bg-sky-50",
  recap: "border-slate-300 bg-slate-100",
  diagram: "border-slate-300 bg-slate-50",
};

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function LessonContent({ lesson }: LessonContentProps) {
  const sections = lesson.body.filter((section) => section?.body?.trim());

  return (
    <article className="space-y-8">
      <header className="rounded-3xl border border-teal-100 bg-white p-7 shadow-sm sm:p-9">
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{lesson.summary}</p>
        <div className="mt-6 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900">
          You are here: Lesson &rarr; Next step: Watch, learn, build
        </div>
      </header>

      {lesson.videos.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Lesson videos</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Watch the idea, then build</h2>
          <div className="mt-4 space-y-4">
            {lesson.videos.map((video, index) => {
              const embedUrl = youtubeEmbedUrl(video.url);
              return (
                <article key={`${video.url}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : video.url.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                    <video
                      src={video.url}
                      poster={video.thumbnail_url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-slate-950"
                    />
                  ) : (
                    <div className="p-4">
                      <a href={video.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal-700 hover:text-teal-900">
                        Open video
                      </a>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-950">{video.title}</h3>
                    {video.transcript && !video.transcript.startsWith("http") && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{video.transcript}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {sections.length > 0 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Lesson</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Learn the idea first</h2>
          </div>
          {sections.map((section, index) => (
            <section key={`${section.heading}-${index}`} className={`rounded-3xl border p-6 shadow-sm ${SECTION_TONES[section.tone ?? "default"]}`}>
              <h2 className="text-2xl font-black text-slate-950">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
      )}

      {lesson.codeExamples.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Example</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Try this pattern</h2>
          <div className="mt-4 space-y-4">
            {lesson.codeExamples.map((example, index) => (
              <div key={`${example.title}-${index}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
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
            <figure key={`${image.src}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} className="aspect-video w-full rounded-2xl object-cover" />
              {image.caption && <figcaption className="mt-2 text-sm text-slate-500">{image.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}
    </article>
  );
}
