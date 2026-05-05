import type { DashboardLessonProgress, DashboardMentorInteraction, DashboardProject, DashboardQuizResult } from "@/app/dashboard/page";

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  date: string;
  tone: "cyan" | "emerald" | "violet" | "amber";
};

const toneClasses: Record<ActivityItem["tone"], string> = {
  cyan: "bg-cyan-50 text-cyan-800",
  emerald: "bg-emerald-50 text-emerald-800",
  violet: "bg-violet-50 text-violet-800",
  amber: "bg-amber-50 text-amber-800",
};

export function RecentActivity({
  lessonProgress,
  quizResults,
  project,
  mentorInteractions,
}: {
  lessonProgress: DashboardLessonProgress[];
  quizResults: DashboardQuizResult[];
  project: DashboardProject | null;
  mentorInteractions: DashboardMentorInteraction[];
}) {
  const activities: ActivityItem[] = [
    ...lessonProgress.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      label: lesson.lesson_title ?? lesson.lesson_key,
      detail: lesson.status === "completed" ? "Lesson completed" : `${lesson.progress_percent}% lesson progress`,
      date: lesson.completed_at ?? lesson.updated_at,
      tone: "cyan" as const,
    })),
    ...quizResults.map((quiz) => ({
      id: `quiz-${quiz.id}`,
      label: quiz.quiz_title ?? "Quiz completed",
      detail: `${Math.round(Number(quiz.score ?? 0))}% score`,
      date: quiz.completed_at,
      tone: "amber" as const,
    })),
    ...(project?.project_tasks ?? []).filter((task) => task.completed_at).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      detail: "Project task completed",
      date: task.completed_at ?? task.updated_at,
      tone: "emerald" as const,
    })),
    ...mentorInteractions.map((interaction) => ({
      id: `mentor-${interaction.id}`,
      label: "Mentor session",
      detail: interaction.interaction_type,
      date: interaction.created_at,
      tone: "violet" as const,
    })),
  ].sort((left, right) => Date.parse(right.date) - Date.parse(left.date)).slice(0, 7);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Activity</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Latest progress</h2>
      <div className="mt-5 space-y-3">
        {activities.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Your activity feed will appear after your first lesson, quiz, or mentor chat.</p>}
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
            <span className={`mt-0.5 rounded-full px-2 py-1 text-xs font-black ${toneClasses[activity.tone]}`}>{activity.detail}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{activity.label}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(activity.date).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

