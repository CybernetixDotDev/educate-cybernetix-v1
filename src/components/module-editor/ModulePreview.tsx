import type { ModuleLessonOption } from "@/lib/modules/loadModule";
import type { ModuleAuthoringSchema } from "@/lib/modules/saveModule";

type ModulePreviewProps = {
  module: ModuleAuthoringSchema;
  lessonOptions: ModuleLessonOption[];
};

export function ModulePreview({ module, lessonOptions }: ModulePreviewProps) {
  const optionById = new Map(lessonOptions.map((lesson) => [lesson.lesson_id, lesson]));
  const lessons = [...module.lessons].sort((left, right) => left.order_index - right.order_index);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + (optionById.get(lesson.lesson_id)?.estimated_time ?? 20), 0);

  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Week {module.week_number}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{module.title || "Untitled module"}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{module.description || "Module description preview."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{lessons.length} lessons</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{totalMinutes} min</span>
          <span className={`rounded-full px-3 py-1 ${module.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {module.published ? "Published" : "Draft"}
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Prerequisites</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {module.prerequisites.length > 0 ? module.prerequisites.map((item) => <li key={item}>{item}</li>) : <li>No prerequisites</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Outcomes</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {module.outcomes.length > 0 ? module.outcomes.map((item) => <li key={item}>{item}</li>) : <li>No outcomes yet</li>}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Lesson Order</h2>
        <ol className="mt-4 space-y-3">
          {lessons.length > 0 ? lessons.map((lesson, index) => {
            const option = optionById.get(lesson.lesson_id);
            return (
              <li key={lesson.lesson_id} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                <span className="font-bold text-cyan-700">{index + 1}</span>
                <span>
                  <span className="block font-semibold text-slate-900">{option?.title ?? lesson.lesson_id}</span>
                  <span className="text-sm text-slate-500">{option?.estimated_time ?? 20} minutes</span>
                </span>
              </li>
            );
          }) : <li className="text-sm text-slate-500">No lessons assigned.</li>}
        </ol>
      </section>
    </article>
  );
}
