"use client";

import { LessonContent } from "@/components/learning/LessonContent";
import { MentorInlinePanel } from "@/components/learning/MentorInlinePanel";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useStudent } from "@/hooks/useStudent";
import { getLesson, getLessonNavigation, type Lesson } from "@/lib/lessons/getLesson";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LessonPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();
  const moduleId = params.moduleId;
  const lessonId = params.lessonId;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const {
    progress,
    loading: progressLoading,
    error: progressError,
    completeLesson,
    refresh,
  } = useLessonProgress({ studentId: student?.id ?? null, moduleId });
  const navigation = useMemo(() => getLessonNavigation(moduleId, lessonId), [lessonId, moduleId]);
  const currentProgress = progress.find((item) => item.module_key === moduleId && item.lesson_key === lessonId);
  const isComplete = currentProgress?.status === "completed" || (currentProgress?.progress_percent ?? 0) >= 100;

  useEffect(() => {
    let active = true;

    void getLesson(moduleId, lessonId)
      .then((loadedLesson) => {
        if (active) {
          setLesson(loadedLesson);
          setLessonError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setLessonError(error instanceof Error ? error.message : "Unable to load lesson");
        }
      });

    return () => {
      active = false;
    };
  }, [lessonId, moduleId]);

  async function handleMarkComplete() {
    if (!lesson || !student) {
      return;
    }

    setMarkingComplete(true);

    try {
      await completeLesson(lesson.lessonId, {
        module_id: lesson.moduleId,
        lesson_title: lesson.title,
        completed_steps: ["read_lesson", "reviewed_examples"],
        metadata: {
          source: "lesson_page",
          quiz_key: lesson.quiz.quiz_key,
        },
      });
      await refresh();
    } finally {
      setMarkingComplete(false);
    }
  }

  if (lessonError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Lesson unavailable</h1>
          <p className="mt-2 text-slate-600">{lessonError}</p>
        </section>
      </main>
    );
  }

  if (!lesson || studentLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            Back to dashboard
          </Link>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {progressLoading ? "Checking progress..." : isComplete ? "Completed" : "In progress"}
          </div>
        </div>

        {(studentError || progressError) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {studentError ?? progressError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <LessonContent lesson={lesson} />

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/learn/${moduleId}/${lessonId}/quiz`}
                  className="rounded-md bg-cyan-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  Start Quiz
                </Link>
                <button
                  type="button"
                  onClick={() => void handleMarkComplete()}
                  disabled={!student || markingComplete || isComplete}
                  className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isComplete ? "Marked Complete" : markingComplete ? "Saving..." : "Mark Complete"}
                </button>
                {navigation.next ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/learn/${navigation.next?.moduleId}/${navigation.next?.lessonId}`)}
                    className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {navigation.next.isNextModule ? "Proceed to Next Module" : "Next Lesson"}
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    className="rounded-md bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Finish Course
                  </Link>
                )}
              </div>
              {navigation.next && <p className="mt-3 text-sm text-slate-500">{navigation.next.label}</p>}
            </section>
          </div>

          <MentorInlinePanel studentId={student?.id ?? null} moduleId={moduleId} lessonId={lessonId} />
        </div>
      </div>
    </main>
  );
}
