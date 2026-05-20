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
      title: "Open today's lesson",
      body: "Start with the next lesson. Read it, try the task, then take the checkpoint.",
      href: nextLessonHref(lessonProgress),
    },
    openTasks.length > 0
      ? {
          title: "Finish one project task",
          body: `${openTasks.length} task${openTasks.length === 1 ? "" : "s"} still open on your current mission.`,
          href: "/mentor?intent=project",
        }
      : {
          title: "Create your build plan",
          body: "Ask Cyber Mentor to turn your course topic into a simple project task list.",
          href: "/mentor?intent=project",
        },
    lastQuiz && Number(lastQuiz.score) < 80
      ? {
          title: "Review the checkpoint",
          body: `Your last score was ${Math.round(Number(lastQuiz.score))}%. Ask Cyber Mentor to explain the missed ideas.`,
          href: "/mentor",
        }
      : {
          title: hasMentor ? "Ask one useful question" : "Meet Cyber Mentor",
          body: "Bring one stuck point from the lesson or project. Cyber Mentor will choose the right help mode.",
          href: "/mentor",
        },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Next Steps</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Do these in order</h2>
      <div className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <Link key={action.title} href={action.href} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-teal-50">
            <p className="text-sm font-black text-slate-950">{index + 1}. {action.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{action.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
