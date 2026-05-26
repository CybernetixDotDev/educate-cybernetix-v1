import { EngagementSummary } from "@/components/dashboard/EngagementSummary";
import { NextLessonCard } from "@/components/dashboard/NextLessonCard";
import { ProjectSnapshot } from "@/components/dashboard/ProjectSnapshot";
import { QuickToolsGrid } from "@/components/dashboard/QuickToolsGrid";
import { RecommendedActions } from "@/components/dashboard/RecommendedActions";
import { StudentTopNav } from "@/components/layout/StudentTopNav";
import { dashboardPathForRole, getCurrentUserRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export type DashboardStudent = {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  grade_level: string | null;
  learning_goals: string[];
  project_preference?: string | null;
  onboarding_complete?: boolean | null;
};

export type DashboardLessonProgress = {
  id: string;
  module_key: string;
  lesson_key: string;
  lesson_title: string | null;
  status: string;
  progress_percent: number;
  time_spent_seconds: number;
  completed_at: string | null;
  updated_at: string;
};

export type DashboardQuizResult = {
  id: string;
  module_key: string | null;
  lesson_key: string | null;
  quiz_title: string | null;
  score: number;
  passed: boolean;
  completed_at: string;
};

export type DashboardSessionLog = {
  id: string;
  duration_seconds: number;
  session_started_at: string;
  session_ended_at: string | null;
};

export type DashboardStreak = {
  id: string;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
};

export type DashboardProjectTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  completed_at: string | null;
  updated_at: string;
};

export type DashboardProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  project_tasks?: DashboardProjectTask[];
};

export type DashboardMentorInteraction = {
  id: string;
  interaction_type: string;
  response: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DashboardData = {
  student: DashboardStudent;
  lessonProgress: DashboardLessonProgress[];
  quizResults: DashboardQuizResult[];
  sessionLogs: DashboardSessionLog[];
  streaks: DashboardStreak[];
  project: DashboardProject | null;
  mentorInteractions: DashboardMentorInteraction[];
};

async function loadDashboardData(): Promise<DashboardData> {
  const role = await getCurrentUserRole();

  if (!role) {
    redirect("/auth?next=/dashboard");
  }

  if (role !== "student") {
    redirect(dashboardPathForRole(role));
  }

  const supabase = createClient(await cookies());
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    redirect("/auth?next=/dashboard");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, display_name, email, avatar_url, grade_level, learning_goals, project_preference, onboarding_complete")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!student) {
    redirect("/onboarding");
  }

  if (!student.onboarding_complete) {
    redirect("/onboarding");
  }

  const [
    lessonProgressResult,
    quizResultsResult,
    sessionLogsResult,
    streaksResult,
    projectResult,
    mentorResult,
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("id, module_key, lesson_key, lesson_title, status, progress_percent, time_spent_seconds, completed_at, updated_at")
      .eq("student_id", student.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("quiz_results")
      .select("id, module_key, lesson_key, quiz_title, score, passed, completed_at")
      .eq("student_id", student.id)
      .order("completed_at", { ascending: false })
      .limit(25),
    supabase
      .from("session_logs")
      .select("id, duration_seconds, session_started_at, session_ended_at")
      .eq("student_id", student.id)
      .order("session_started_at", { ascending: false })
      .limit(30),
    supabase
      .from("streaks")
      .select("id, current_count, longest_count, last_activity_date")
      .eq("student_id", student.id)
      .limit(5),
    supabase
      .from("student_projects")
      .select("id, title, description, status, updated_at, project_tasks(id, title, description, status, position, completed_at, updated_at)")
      .eq("student_id", student.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_interactions")
      .select("id, interaction_type, response, metadata, created_at")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const project = projectResult.data as DashboardProject | null;
  const sortedTasks = [...(project?.project_tasks ?? [])].sort((left, right) => left.position - right.position);

  return {
    student: student as DashboardStudent,
    lessonProgress: (lessonProgressResult.data ?? []) as DashboardLessonProgress[],
    quizResults: (quizResultsResult.data ?? []) as DashboardQuizResult[],
    sessionLogs: (sessionLogsResult.data ?? []) as DashboardSessionLog[],
    streaks: (streaksResult.data ?? []) as DashboardStreak[],
    project: project ? { ...project, project_tasks: sortedTasks } : null,
    mentorInteractions: mentorResult.error ? [] : ((mentorResult.data ?? []) as DashboardMentorInteraction[]),
  };
}

function DashboardFallback() {
  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-52 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="h-72 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-72 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    </main>
  );
}

async function DashboardCommandCenter() {
  const data = await loadDashboardData();
  const minutes = Math.round(data.sessionLogs.reduce((sum, log) => sum + Number(log.duration_seconds ?? 0), 0) / 60);
  const streak = data.streaks[0]?.current_count ?? 0;

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-950 lg:flex">
      <StudentTopNav studentName={data.student.display_name} avatarUrl={data.student.avatar_url} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="overflow-hidden rounded-3xl border border-teal-100 bg-white text-slate-950 shadow-sm">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_18rem] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                {data.student.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.student.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-300/60" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-black text-teal-800">
                    {data.student.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">You are becoming a creator</p>
                  <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Today&apos;s work, {data.student.display_name}</h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    Follow one simple path: learn the concept, build the mission, and ask Zylo when you need help.
                  </p>
                  <div className="mt-5 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900">
                    You are here: Home &rarr; Next step: Continue course
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-teal-50 p-4">
                  <p className="text-sm font-semibold text-teal-800">Streak</p>
                  <p className="mt-1 text-3xl font-black text-teal-950">{streak}d</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">XP minutes</p>
                  <p className="mt-1 text-3xl font-black text-amber-950">{minutes}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-2">
            <NextLessonCard lessonProgress={data.lessonProgress} />
            <ProjectSnapshot project={data.project} />
          </section>

          <QuickToolsGrid />

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <EngagementSummary sessionLogs={data.sessionLogs} streaks={data.streaks} />
            <RecommendedActions
              lessonProgress={data.lessonProgress}
              quizResults={data.quizResults}
              project={data.project}
              mentorInteractions={data.mentorInteractions}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardCommandCenter />
    </Suspense>
  );
}
