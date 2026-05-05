"use client";

import { createLesson, deleteLesson } from "@/lib/curriculum/manageCurriculum";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type CurriculumLesson = {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  current_version_id: string | null;
  quizzes?: Array<{ id: string; current_version_id: string | null }>;
};

type LessonListProps = {
  moduleId: string | null;
  lessons: CurriculumLesson[];
  selectedLessonId: string | null;
};

export function LessonList({ moduleId, lessons, selectedLessonId }: LessonListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Lessons</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Lesson list</h2>
      </div>

      <form action={createLesson} className="mt-5 grid gap-3">
        <input type="hidden" name="module_id" value={moduleId ?? ""} />
        <input name="title" required disabled={!moduleId} placeholder="Lesson title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
        <input name="order_index" type="number" disabled={!moduleId} placeholder="Order" className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
        <button type="submit" disabled={!moduleId} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Create Lesson</button>
      </form>

      <div className="mt-6 space-y-3">
        {lessons.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Select a module or create lessons.</p>}
        {lessons.map((lesson) => (
          <div key={lesson.id} className={`rounded-lg border p-3 ${lesson.id === selectedLessonId ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}>
            <button type="button" onClick={() => router.push(`/admin/curriculum?moduleId=${lesson.module_id}&lessonId=${lesson.id}`)} className="block w-full text-left">
              <p className="font-semibold text-slate-950">{lesson.order_index}. {lesson.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                Lesson version: {lesson.current_version_id ? "published" : "draft"} · Quiz: {lesson.quizzes?.[0]?.current_version_id ? "published" : "not published"}
              </p>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => router.push(`/admin/curriculum?moduleId=${lesson.module_id}&lessonId=${lesson.id}`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Edit Lesson</button>
              <button type="button" onClick={() => router.push(`/admin/curriculum?moduleId=${lesson.module_id}&lessonId=${lesson.id}#versions`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">View Versions</button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await deleteLesson(lesson.id);
                  router.refresh();
                })}
                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                Delete Lesson
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

