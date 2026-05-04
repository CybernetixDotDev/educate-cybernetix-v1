"use client";

import { useLessonProgress, type LessonProgress } from "@/hooks/useLessonProgress";
import { useProjectProgress, type ProjectTask } from "@/hooks/useProjectProgress";
import { useStudent } from "@/hooks/useStudent";
import Link from "next/link";
import { useMemo } from "react";
import { MentorQuickPanel } from "./MentorQuickPanel";
import { ProgressBar } from "./ProgressBar";
import { SkillChart, type SkillKey, type SkillScore } from "./SkillChart";

const TOTAL_LESSONS = 12;

const SKILLS: Array<{ key: SkillKey; label: string; modules: string[] }> = [
  { key: "html", label: "HTML", modules: ["week1"] },
  { key: "css", label: "CSS", modules: ["week1", "week2"] },
  { key: "javascript", label: "JavaScript", modules: ["week4"] },
  { key: "nextjs", label: "Next.js", modules: ["week5"] },
  { key: "apis", label: "APIs", modules: ["week6"] },
  { key: "supabase", label: "Supabase", modules: ["week7"] },
  { key: "threejs", label: "Three.js", modules: ["week8"] },
  { key: "project_management", label: "Project Management", modules: ["week9", "week10", "week11", "week12"] },
];

function getWeekNumber(progress: LessonProgress[]) {
  const weeks = progress
    .map((item) => item.module_key.match(/week(\d+)/)?.[1])
    .filter((week): week is string => Boolean(week))
    .map(Number);

  if (weeks.length === 0) {
    return 1;
  }

  return Math.min(12, Math.max(...weeks));
}

function getCompletedLessons(progress: LessonProgress[]) {
  return progress.filter((item) => item.status === "completed" || item.progress_percent >= 100).length;
}

function getStreakDays(progress: LessonProgress[]) {
  const activeDates = new Set(
    progress
      .map((item) => item.completed_at ?? item.updated_at)
      .filter(Boolean)
      .map((date) => new Date(date).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();

  for (;;) {
    const key = cursor.toISOString().slice(0, 10);

    if (!activeDates.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getNextLesson(progress: LessonProgress[], currentWeek: number) {
  const nextIncomplete = progress.find((item) => item.status !== "completed" && item.progress_percent < 100);

  if (nextIncomplete) {
    return nextIncomplete.lesson_title ?? nextIncomplete.lesson_key;
  }

  return `Week ${Math.min(currentWeek + 1, TOTAL_LESSONS)} lesson`;
}

function getSkillScores(progress: LessonProgress[]): SkillScore[] {
  return SKILLS.map((skill) => {
    const matching = progress.filter((item) => skill.modules.some((module) => item.module_key.startsWith(module)));
    const value =
      matching.length > 0
        ? Math.round(matching.reduce((sum, item) => sum + item.progress_percent, 0) / matching.length)
        : 0;

    return {
      key: skill.key,
      label: skill.label,
      value,
    };
  });
}

type ProjectCardProps = {
  title: string;
  tasks: ProjectTask[];
  loading?: boolean;
  error?: string | null;
  onCompleteTask: (taskId: string) => Promise<ProjectTask | null>;
};

export function ProjectCard({ title, tasks, loading = false, error = null, onCompleteTask }: ProjectCardProps) {
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Capstone Project</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
        </div>
        <Link
          href="/projects"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue Project
        </Link>
      </div>

      <div className="mt-5">
        <ProgressBar value={progress} label="MVP progress" tone="emerald" />
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading project tasks...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && tasks.length === 0 && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
            Choose a project template to start building your capstone.
          </p>
        )}
        {tasks.map((task) => (
          <label
            key={task.id}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-300"
          >
            <input
              type="checkbox"
              checked={task.status === "completed"}
              onChange={() => {
                if (task.status !== "completed") {
                  void onCompleteTask(task.id);
                }
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">{task.title}</span>
              {task.description && <span className="mt-1 block text-sm text-slate-500">{task.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

export function DashboardContent() {
  const { student, loading: studentLoading, error: studentError, refresh: refreshStudent } = useStudent();
  const {
    progress,
    loading: progressLoading,
    error: progressError,
    refresh: refreshProgress,
  } = useLessonProgress({ studentId: student?.id ?? null });
  const {
    project,
    tasks,
    loading: projectLoading,
    error: projectError,
    completeTask,
    refresh: refreshProject,
  } = useProjectProgress({ studentId: student?.id ?? null });

  const currentWeek = useMemo(() => getWeekNumber(progress), [progress]);
  const completedLessons = useMemo(() => getCompletedLessons(progress), [progress]);
  const overallProgress = Math.round((completedLessons / TOTAL_LESSONS) * 100);
  const streakDays = useMemo(() => getStreakDays(progress), [progress]);
  const nextLesson = useMemo(() => getNextLesson(progress, currentWeek), [currentWeek, progress]);
  const skills = useMemo(() => getSkillScores(progress), [progress]);
  const activeModuleId = `week${currentWeek}`;

  if (studentLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (studentError || !student) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Dashboard unavailable</h1>
          <p className="mt-2 text-slate-600">{studentError ?? "Create or sign into a student profile to continue."}</p>
          <button
            type="button"
            onClick={() => void refreshStudent()}
            className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Student Dashboard</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Welcome back, {student.display_name}</h1>
              <p className="mt-3 max-w-2xl text-base text-slate-300">
                You are on Week {currentWeek}. Keep the next task small, ship one improvement, and ask the mentor
                when you get stuck.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-sm text-slate-300">Current week</p>
                <p className="mt-1 text-3xl font-bold">{currentWeek}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-sm text-slate-300">Streak</p>
                <p className="mt-1 text-3xl font-bold">{streakDays}d</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Overall Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {completedLessons} of {TOTAL_LESSONS} lessons completed
                </p>
              </div>
              <Link
                href="/learn"
                className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Next Lesson
              </Link>
            </div>
            <div className="mt-6">
              <ProgressBar value={overallProgress} label="Course completion" tone="cyan" />
            </div>
            <div className="mt-4 rounded-lg bg-cyan-50 p-4 text-sm text-cyan-900">
              Next up: <span className="font-semibold">{nextLesson}</span>
            </div>
            {progressError && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                <span>{progressError}</span>
                <button type="button" onClick={() => void refreshProgress()} className="font-semibold">
                  Retry
                </button>
              </div>
            )}
            {progressLoading && <p className="mt-4 text-sm text-slate-500">Refreshing progress...</p>}
          </div>

          <MentorQuickPanel studentId={student.id} moduleId={activeModuleId} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Skill Mastery</h2>
              <p className="mt-1 text-sm text-slate-500">Based on your completed lessons and current progress.</p>
            </div>
          </div>
          <div className="mt-5">
            <SkillChart skills={skills} />
          </div>
        </section>

        <ProjectCard
          title={project?.title ?? "No project selected yet"}
          tasks={tasks}
          loading={projectLoading}
          error={projectError}
          onCompleteTask={async (taskId) => {
            const result = await completeTask(taskId);
            await refreshProject();
            return result;
          }}
        />
      </div>
    </main>
  );
}
