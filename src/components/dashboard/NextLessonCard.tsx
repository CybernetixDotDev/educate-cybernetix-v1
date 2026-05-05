import type { DashboardLessonProgress } from "@/app/dashboard/page";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

const MODULES = [
  ["week1-internet-html-css", "Week 1", "Internet, HTML, and CSS"],
  ["week2-tailwind-uiux", "Week 2", "Tailwind and UI/UX"],
  ["week3-git-github-terminal", "Week 3", "Git, GitHub, and Terminal"],
  ["week4-javascript-fundamentals", "Week 4", "JavaScript Fundamentals"],
  ["week5-nextjs-fundamentals", "Week 5", "Next.js Fundamentals"],
  ["week6-apis-datafetching", "Week 6", "APIs and Data Fetching"],
  ["week7-supabase-database-auth", "Week 7", "Supabase Database and Auth"],
  ["week8-threejs-fundamentals", "Week 8", "Three.js Fundamentals"],
  ["week9-project-planning", "Week 9", "Project Planning"],
  ["week10-build-phase-1", "Week 10", "Build Phase 1"],
  ["week11-build-phase-2", "Week 11", "Build Phase 2"],
  ["week12-deploy-present", "Week 12", "Deploy and Present"],
] as const;

const LESSONS = [
  ["intro", "Concepts"],
  ["practice", "Guided Practice"],
  ["checkpoint", "Checkpoint"],
] as const;

function findNextLesson(progress: DashboardLessonProgress[]) {
  const completed = new Set(
    progress
      .filter((item) => item.status === "completed" || item.progress_percent >= 100)
      .map((item) => `${item.module_key}/${item.lesson_key}`),
  );
  const inProgress = progress.find((item) => item.status !== "completed" && item.progress_percent < 100);

  if (inProgress) {
    const moduleInfo = MODULES.find(([id]) => id === inProgress.module_key);
    return {
      moduleId: inProgress.module_key,
      moduleLabel: moduleInfo?.[1] ?? "Current module",
      moduleTitle: moduleInfo?.[2] ?? inProgress.module_key,
      lessonId: inProgress.lesson_key,
      lessonTitle: inProgress.lesson_title ?? inProgress.lesson_key,
      progress: inProgress.progress_percent,
    };
  }

  for (const [moduleId, moduleLabel, moduleTitle] of MODULES) {
    for (const [lessonId, lessonTitle] of LESSONS) {
      if (!completed.has(`${moduleId}/${lessonId}`)) {
        return { moduleId, moduleLabel, moduleTitle, lessonId, lessonTitle, progress: 0 };
      }
    }
  }

  return {
    moduleId: "week12-deploy-present",
    moduleLabel: "Week 12",
    moduleTitle: "Deploy and Present",
    lessonId: "checkpoint",
    lessonTitle: "Final checkpoint",
    progress: 100,
  };
}

export function NextLessonCard({ lessonProgress }: { lessonProgress: DashboardLessonProgress[] }) {
  const nextLesson = findNextLesson(lessonProgress);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Next Lesson</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{nextLesson.lessonTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {nextLesson.moduleLabel}: {nextLesson.moduleTitle}
          </p>
        </div>
        <Link
          href={`/learn/${nextLesson.moduleId}/${nextLesson.lessonId}`}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Continue Learning
        </Link>
      </div>
      <div className="mt-6">
        <ProgressBar value={nextLesson.progress} label="Lesson progress" tone="cyan" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {LESSONS.map(([lessonId, title]) => {
          const row = lessonProgress.find((item) => item.module_key === nextLesson.moduleId && item.lesson_key === lessonId);
          const done = row?.status === "completed" || Number(row?.progress_percent ?? 0) >= 100;
          return (
            <div key={lessonId} className={`rounded-lg border p-3 text-sm ${done ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span className="font-semibold">{title}</span>
              <span className="mt-1 block text-xs">{done ? "Complete" : "Ready"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
