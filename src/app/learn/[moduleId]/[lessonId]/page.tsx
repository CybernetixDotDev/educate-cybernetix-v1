"use client";

import { LessonContent } from "@/components/learning/LessonContent";
import { MentorInlinePanel } from "@/components/learning/MentorInlinePanel";
import { ZyloLessonCompanion } from "@/components/learning/ZyloLessonCompanion";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useStudent } from "@/hooks/useStudent";
import { getCanonicalLessonId, getLesson, getLessonNavigation, type Lesson } from "@/lib/lessons/getLesson";
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
  const activeLessonId = lesson?.lessonId ?? lessonId;
  const navigation = useMemo(() => getLessonNavigation(moduleId, activeLessonId), [activeLessonId, moduleId]);
  const currentProgress = progress.find((item) => item.module_key === moduleId && item.lesson_key === activeLessonId);
  const isComplete = currentProgress?.status === "completed" || (currentProgress?.progress_percent ?? 0) >= 100;

  useEffect(() => {
    let active = true;
    const canonicalLessonId = getCanonicalLessonId(moduleId, lessonId);

    if (canonicalLessonId !== lessonId) {
      router.replace(`/learn/${moduleId}/${canonicalLessonId}`);
    }

    void getLesson(moduleId, canonicalLessonId)
      .then((loadedLesson) => {
        if (active) {
          setLesson(loadedLesson);
          setLessonError(null);

          if (loadedLesson.lessonId !== canonicalLessonId) {
            router.replace(`/learn/${loadedLesson.moduleId}/${loadedLesson.lessonId}`);
          }
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
  }, [lessonId, moduleId, router]);

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
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Lesson unavailable</h1>
          <p className="mt-2 text-slate-600">{lessonError}</p>
        </section>
      </main>
    );
  }

  if (!lesson || studentLoading) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-8">
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
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <ZyloLessonCompanion
        pose={isComplete ? "celebrating" : "floating"}
        label={isComplete ? "Zylo cheers" : "Zylo is with you"}
        message={isComplete ? "You completed this lesson. That glow is real." : "I’ll float nearby while you learn, then we’ll build it together."}
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm font-bold text-teal-700 hover:text-teal-900">
            Back to home
          </Link>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            {progressLoading ? "Checking progress..." : isComplete ? "Completed" : "In progress"}
          </div>
        </div>

        {(studentError || progressError) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {studentError ?? progressError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <LessonContent lesson={lesson} />

            {lesson.tasks.length > 0 ? (
              <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Next step</p>
                <h2 className="mt-1 text-3xl font-black text-slate-950">Start the guided build task</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  This lesson has {lesson.tasks.length} focused task{lesson.tasks.length === 1 ? "" : "s"}. Each task opens on its own page so you can focus on one step at a time.
                </p>
                <Link
                  href={`/learn/${lesson.moduleId}/${lesson.lessonId}/task/${lesson.tasks[0].task_id}`}
                  className="mt-5 inline-flex rounded-full bg-teal-600 px-6 py-3 text-sm font-black text-white transition hover:bg-teal-700"
                >
                  Start Task 1
                </Link>
              </section>
            ) : (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Next step</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Ready to check your understanding?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Take the checkpoint when you feel ready. If anything feels fuzzy, ask Zylo first.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Link href={`/learn/${moduleId}/${activeLessonId}/quiz`} className="rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-teal-700">
                    Start Checkpoint
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleMarkComplete()}
                    disabled={!student || markingComplete || isComplete}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {isComplete ? "Marked Complete" : markingComplete ? "Saving..." : "Mark Complete"}
                  </button>
                  {navigation.next ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/learn/${navigation.next?.moduleId}/${navigation.next?.lessonId}`)}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      {navigation.next.isNextModule ? "Proceed to Next Module" : "Next Lesson"}
                    </button>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      Finish Course
                    </Link>
                  )}
                </div>
                {navigation.next && <p className="mt-3 text-sm text-slate-500">{navigation.next.label}</p>}
              </section>
            )}
          </div>

          <MentorInlinePanel studentId={student?.id ?? null} moduleId={moduleId} lessonId={activeLessonId} />
        </div>
      </div>
    </main>
  );
}
