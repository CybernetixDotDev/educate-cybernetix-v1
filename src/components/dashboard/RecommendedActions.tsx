import type { DashboardLessonProgress, DashboardMentorInteraction, DashboardProject, DashboardQuizResult } from "@/app/dashboard/page";
import Link from "next/link";

function nextLessonHref(progress: DashboardLessonProgress[]) {
  const row = progress.find((item) => item.status !== "completed" && item.progress_percent < 100);
  return row ? `/learn/${row.module_key}/${row.lesson_key}` : "/learn";
}

export function RecommendedActions({
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
  const openTasks = (project?.project_tasks ?? []).filter((task) => task.status !== "completed" && task.status !== "done");
  const lastQuiz = quizResults[0];
  const hasMentor = mentorInteractions.length > 0;
  const actions = [
    {
      title: "Continue Lesson",
      body: "Keep your course progress moving with the next short lesson block.",
      href: nextLessonHref(lessonProgress),
    },
    openTasks.length > 0
      ? {
          title: "Complete 2 project tasks",
          body: `${openTasks.length} task${openTasks.length === 1 ? "" : "s"} still open on your current project.`,
          href: "/mentor?intent=project",
        }
      : {
          title: "Plan your project",
          body: "Ask Cyber Mentor to create a clear next build plan.",
          href: "/mentor?intent=project",
        },
    lastQuiz && Number(lastQuiz.score) < 80
      ? {
          title: "Review your last quiz",
          body: `Your last score was ${Math.round(Number(lastQuiz.score))}%. Ask for a quick explanation.`,
          href: "/mentor",
        }
      : {
          title: hasMentor ? "Ask one stuck question" : "Ask Cyber Mentor",
          body: "Bring one stuck point, design decision, or debugging issue.",
          href: "/mentor",
        },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Recommended Actions</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Do these next</h2>
      <div className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <Link key={action.title} href={action.href} className="block rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50">
            <p className="text-sm font-black text-slate-950">{index + 1}. {action.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{action.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
