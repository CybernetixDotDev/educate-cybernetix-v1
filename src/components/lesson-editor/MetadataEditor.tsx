"use client";

import type { LessonAuthoringSchema } from "@/lib/lessons/saveLesson";

type MetadataEditorProps = {
  lesson: LessonAuthoringSchema;
  onChange: (lesson: LessonAuthoringSchema) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function MetadataEditor({ lesson, onChange }: MetadataEditorProps) {
  function updateMetadata(patch: Partial<LessonAuthoringSchema["metadata"]>) {
    onChange({ ...lesson, metadata: { ...lesson.metadata, ...patch } });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="text-sm font-semibold text-slate-800">module_id</span>
        <input value={lesson.metadata.module_id} onChange={(event) => updateMetadata({ module_id: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">lesson_id</span>
        <input value={lesson.metadata.lesson_id} onChange={(event) => updateMetadata({ lesson_id: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">order_index</span>
        <input type="number" value={lesson.metadata.order_index} onChange={(event) => updateMetadata({ order_index: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">estimated_time</span>
        <input type="number" value={lesson.metadata.estimated_time} onChange={(event) => updateMetadata({ estimated_time: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">prerequisites</span>
        <input value={lesson.metadata.prerequisites.join(", ")} onChange={(event) => updateMetadata({ prerequisites: csv(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">next_lessons</span>
        <input value={lesson.metadata.next_lessons.join(", ")} onChange={(event) => updateMetadata({ next_lessons: csv(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
    </div>
  );
}
