"use client";

import { createCourse, deleteCourse } from "@/lib/curriculum/manageCurriculum";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type CurriculumCourse = {
  id: string;
  course_key: string;
  title: string;
  description: string | null;
  category: string;
  duration_weeks: number | null;
  is_published: boolean;
  order_index: number;
};

type CourseListProps = {
  courses: CurriculumCourse[];
  selectedCourseId: string | null;
};

export function CourseList({ courses, selectedCourseId }: CourseListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Courses</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Course categories</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Courses contain modules. 12-Week Tech-Foundations Accelerator is the first course.
        </p>
      </div>

      <form action={createCourse} className="mt-5 grid gap-3">
        <input name="course_key" required placeholder="course-key" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="title" required placeholder="Course title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <textarea name="description" placeholder="Description" className="min-h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="category" placeholder="programming" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="duration_weeks" type="number" placeholder="Weeks" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="order_index" type="number" placeholder="Order" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input name="is_published" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          Publish course to students
        </label>
        <button type="submit" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Course</button>
      </form>

      <div className="mt-6 space-y-3">
        {courses.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No courses yet.</p>}
        {courses.map((course) => (
          <div key={course.id} className={`rounded-lg border p-3 ${course.id === selectedCourseId ? "border-cyan-300 bg-cyan-50" : "border-slate-200"}`}>
            <button type="button" onClick={() => router.push(`/admin/curriculum?courseId=${course.id}`)} className="block w-full text-left">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{course.order_index}. {course.title}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${course.is_published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                  {course.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{course.description ?? "No description"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{course.category} · {course.duration_weeks ?? "Flexible"} weeks</p>
            </button>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => router.push(`/admin/curriculum?courseId=${course.id}`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">View Modules</button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await deleteCourse(course.id);
                  router.refresh();
                })}
                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                Delete Course
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
