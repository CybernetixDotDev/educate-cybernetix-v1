"use client";

import { CoOpLessonExperience } from "@/components/learning/CoOpLessonExperience";
import { MentorInlinePanel } from "@/components/learning/MentorInlinePanel";
import { ZyloLessonCompanion } from "@/components/learning/ZyloLessonCompanion";
import { useStudent } from "@/hooks/useStudent";
import { getCanonicalLessonId, getLesson, getLessonNavigation, type Lesson } from "@/lib/lessons/getLesson";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LessonTaskPage() {
  const params = useParams<{ moduleId: string; lessonId: string; taskId: string }>();
  const router = useRouter();
  const moduleId = params.moduleId;
  const lessonId = params.lessonId;
  const taskId = params.taskId;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const activeLessonId = lesson?.lessonId ?? lessonId;
  const navigation = useMemo(() => getLessonNavigation(moduleId, activeLessonId), [activeLessonId, moduleId]);
  const nextHref = navigation.next ? `/learn/${navigation.next.moduleId}/${navigation.next.lessonId}` : null;

  useEffect(() => {
    let active = true;
    const canonicalLessonId = getCanonicalLessonId(moduleId, lessonId);

    if (canonicalLessonId !== lessonId) {
      router.replace(`/learn/${moduleId}/${canonicalLessonId}/task/${taskId}`);
    }

    void getLesson(moduleId, canonicalLessonId)
      .then((loadedLesson) => {
        if (!active) return;

        const taskExists = loadedLesson.tasks.some((task) => task.task_id === taskId);
        if (!taskExists && loadedLesson.tasks[0]) {
          router.replace(`/learn/${loadedLesson.moduleId}/${loadedLesson.lessonId}/task/${loadedLesson.tasks[0].task_id}`);
          return;
        }

        setLesson(loadedLesson);
        setLessonError(null);
      })
      .catch((error) => {
        if (active) setLessonError(error instanceof Error ? error.message : "Unable to load task");
      });

    return () => {
      active = false;
    };
  }, [lessonId, moduleId, router, taskId]);

  if (lessonError) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Task unavailable</h1>
          <p className="mt-2 text-slate-600">{lessonError}</p>
        </section>
      </main>
    );
  }

  if (!lesson || studentLoading) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-24 animate-pulse rounded-3xl bg-white shadow-sm" />
          <div className="h-[34rem] animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <ZyloLessonCompanion
        pose="pointing"
        label="Zylo mission"
        message="Focus on one task. Submit your proof when you’re ready."
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/learn/${lesson.moduleId}/${lesson.lessonId}`} className="text-sm font-bold text-teal-700 hover:text-teal-900">
            Back to lesson
          </Link>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            Guided build task
          </div>
        </div>

        {studentError && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {studentError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <CoOpLessonExperience
            key={taskId}
            lesson={lesson}
            nextHref={nextHref}
            nextLabel={navigation.next?.label ?? null}
            initialTaskId={taskId}
            taskPageBaseHref={`/learn/${lesson.moduleId}/${lesson.lessonId}/task`}
          />
          <MentorInlinePanel studentId={student?.id ?? null} moduleId={moduleId} lessonId={activeLessonId} />
        </div>
      </div>
    </main>
  );
}
