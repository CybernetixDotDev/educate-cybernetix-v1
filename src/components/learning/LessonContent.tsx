import type { Lesson } from "@/lib/lessons/getLesson";
import { MENTOR_IDENTITY } from "@/lib/mentor/identity";

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

function StepList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ol className="mt-4 space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 text-base leading-7 text-slate-600">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-black text-teal-800">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function TeachingSequence({ lesson }: LessonContentProps) {
  const sequence = lesson.teachingSequence;
  if (!sequence) return null;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Learn first</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">Build the idea in your head</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Before you start the guided tasks, Zylo breaks the idea down with examples, visuals, and a small practice flow.
        </p>
      </div>

      <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Start here</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{sequence.cinematic_hook.title}</h3>
        <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-600">{sequence.cinematic_hook.body}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Why</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{sequence.why_it_matters.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-600">{sequence.why_it_matters.body}</p>
          {sequence.why_it_matters.relatable_example && (
            <div className="mt-4 rounded-2xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">
              {sequence.why_it_matters.relatable_example}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">Mental model</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{sequence.mental_model.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-600">{sequence.mental_model.body}</p>
          {sequence.mental_model.metaphor && (
            <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-950">
              {sequence.mental_model.metaphor}
            </div>
          )}
        </article>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">I do</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{sequence.i_do.title}</h3>
          <StepList items={sequence.i_do.steps} />
          {sequence.i_do.example && <p className="mt-4 text-sm leading-6 text-slate-500">{sequence.i_do.example}</p>}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">We do</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{sequence.we_do.title}</h3>
          <StepList items={sequence.we_do.steps} />
          {sequence.we_do.guided_prompt && <p className="mt-4 text-sm leading-6 text-slate-500">{sequence.we_do.guided_prompt}</p>}
        </article>

        <article className="rounded-3xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">You do</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{sequence.you_do.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{sequence.you_do.instruction}</p>
          {sequence.you_do.expected_output && (
            <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-semibold leading-6 text-teal-950">
              Goal: {sequence.you_do.expected_output}
            </p>
          )}
        </article>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-rose-700">Watch out</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{sequence.common_mistake.title}</h3>
          <p className="mt-3 text-base leading-8 text-slate-700">{sequence.common_mistake.mistake}</p>
          <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-semibold leading-6 text-rose-950">
            Fix: {sequence.common_mistake.fix}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Recap</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{sequence.recap.title}</h3>
          <ul className="mt-4 space-y-2">
            {sequence.recap.bullets.map((bullet, index) => (
              <li key={`${bullet}-${index}`} className="text-base leading-7 text-slate-600">
                {bullet}
              </li>
            ))}
          </ul>
          {sequence.recap.next_step && <p className="mt-4 text-sm font-bold text-teal-800">{sequence.recap.next_step}</p>}
        </article>
      </div>
    </section>
  );
}

export function LessonContent({ lesson }: LessonContentProps) {
  const sections = lesson.body.filter((section) => section?.body?.trim());

  return (
    <article className="space-y-8">
      <header className="rounded-3xl border border-teal-100 bg-white p-7 shadow-sm sm:p-9">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
          <div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{lesson.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{lesson.summary}</p>
            <div className="mt-6 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900">
              You are here: Lesson &rarr; Next step: Watch, learn, build
            </div>
          </div>
          <div className="relative hidden min-h-44 md:block">
            <div className="absolute inset-x-5 bottom-3 h-8 rounded-full bg-cyan-300/20 blur-xl" />
            <div className="absolute right-0 top-0 rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-violet-50 to-cyan-50 p-3 shadow-lg shadow-cyan-900/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MENTOR_IDENTITY.poses.pointing} alt="Zylo pointing at the lesson title" className="h-36 w-36 object-contain" />
            </div>
            <div className="absolute right-28 top-5 rounded-2xl rounded-br-md bg-white px-3 py-2 text-xs font-black text-cyan-800 shadow-sm ring-1 ring-cyan-100">
              Start here!
            </div>
          </div>
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

      <TeachingSequence lesson={lesson} />

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
