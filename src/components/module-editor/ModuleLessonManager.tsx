"use client";

import type { ModuleLessonOption } from "@/lib/modules/loadModule";
import type { ModuleAuthoringSchema, ModuleLessonRef } from "@/lib/modules/saveModule";
import { useMemo, useState } from "react";

type ModuleLessonManagerProps = {
  module: ModuleAuthoringSchema;
  lessonOptions: ModuleLessonOption[];
  onChange: (module: ModuleAuthoringSchema) => void;
};

function normalizeOrder(lessons: ModuleLessonRef[]) {
  return lessons.map((lesson, index) => ({ ...lesson, order_index: index }));
}

export function ModuleLessonManager({ module, lessonOptions, onChange }: ModuleLessonManagerProps) {
  const [selectedLesson, setSelectedLesson] = useState("");
  const optionById = useMemo(
    () => new Map(lessonOptions.map((lesson) => [lesson.lesson_id, lesson])),
    [lessonOptions],
  );
  const assignedIds = new Set(module.lessons.map((lesson) => lesson.lesson_id));
  const availableLessons = lessonOptions.filter((lesson) => !assignedIds.has(lesson.lesson_id));
  const orderedLessons = [...module.lessons].sort((left, right) => left.order_index - right.order_index);

  function updateLessons(lessons: ModuleLessonRef[]) {
    onChange({ ...module, lessons: normalizeOrder(lessons) });
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...orderedLessons];
    const target = index + direction;

    if (target < 0 || target >= next.length) {
      return;
    }

    [next[index], next[target]] = [next[target], next[index]];
    updateLessons(next);
  }

  function addLesson() {
    if (!selectedLesson) {
      return;
    }

    updateLessons([...orderedLessons, { lesson_id: selectedLesson, order_index: orderedLessons.length }]);
    setSelectedLesson("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row">
        <select
          value={selectedLesson}
          onChange={(event) => setSelectedLesson(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select lesson to add</option>
          {availableLessons.map((lesson) => (
            <option key={lesson.lesson_id} value={lesson.lesson_id}>
              {lesson.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addLesson}
          disabled={!selectedLesson}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          Add Lesson
        </button>
      </div>

      <div className="space-y-3">
        {orderedLessons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No lessons assigned yet.
          </div>
        ) : (
          orderedLessons.map((lesson, index) => {
            const option = optionById.get(lesson.lesson_id);

            return (
              <div key={lesson.lesson_id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{option?.title ?? lesson.lesson_id}</p>
                  <p className="font-mono text-xs text-slate-500">{lesson.lesson_id}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => move(index, -1)} className="rounded border border-slate-300 px-3 py-1 text-sm">
                    Up
                  </button>
                  <button type="button" onClick={() => move(index, 1)} className="rounded border border-slate-300 px-3 py-1 text-sm">
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLessons(orderedLessons.filter((item) => item.lesson_id !== lesson.lesson_id))}
                    className="rounded border border-rose-200 px-3 py-1 text-sm font-semibold text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
