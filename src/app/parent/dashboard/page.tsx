import { AiParentInsight } from "@/components/parent-dashboard/AiParentInsight";
import { EngagementAnalytics } from "@/components/parent-dashboard/EngagementAnalytics";
import { ParentDashboardLayout } from "@/components/parent-dashboard/ParentDashboardLayout";
import { ProjectProgressOverview } from "@/components/parent-dashboard/ProjectProgressOverview";
import { RecommendedGuidance } from "@/components/parent-dashboard/RecommendedGuidance";
import { SkillMasterySnapshot, type ParentSkillScore } from "@/components/parent-dashboard/SkillMasterySnapshot";
import { StudentSelector, type LinkedStudentOption } from "@/components/parent-dashboard/StudentSelector";
import { WeeklySummaryCard } from "@/components/parent-dashboard/WeeklySummaryCard";
import { dashboardPathForRole, getCurrentUserRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type ParentDashboardPageProps = {
  searchParams: Promise<{ studentId?: string }>;
};

type Student = {
  id: string;
  display_name: string;
  email: string | null;
  grade_level: string | null;
};

type WeeklySummary = {
  week_start_date: string;
  week_end_date: string;
  lessons_completed: number;
  quizzes_completed: number;
  average_quiz_score: number | null;
  time_spent_seconds: number;
  highlights: string[];
  concerns: string[];
  summary: Record<string, unknown>;
};

type SessionLog = {
  id: string;
  duration_seconds: number;
  session_started_at: string;
};

type Streak = {
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
};

type QuizResult = {
  id: string;
  module_key: string | null;
  lesson_key: string | null;
  score: number;
  passed: boolean;
  completed_at: string;
};

type ProjectTask = {
  id: string;
  title: string;
  status: string;
  completed_at: string | null;
  updated_at: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updated_at: string;
  project_tasks?: ProjectTask[];
};

type AnalyticsSnapshot = {
  snapshot_type: string;
  metrics: Record<string, unknown>;
  generated_at: string;
};

type ParentReport = {
  month: string;
  report_json: Record<string, unknown>;
  updated_at: string;
};

const SKILLS = [
  { key: "html", label: "HTML", modules: ["week1"] },
  { key: "css", label: "CSS", modules: ["week1", "week2"] },
  { key: "javascript", label: "JavaScript", modules: ["week4"] },
  { key: "nextjs", label: "Next.js", modules: ["week5"] },
  { key: "supabase", label: "Supabase", modules: ["week7"] },
  { key: "threejs", label: "Three.js", modules: ["week8"] },
  { key: "git", label: "Git", modules: ["week3"] },
  { key: "apis", label: "APIs", modules: ["week6"] },
] as const;

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function getParentName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "Parent";
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function weekNumberFromDate(date: string | undefined) {
  if (!date) return 1;
  const current = new Date(date);
  const firstDay = new Date(current.getFullYear(), 0, 1);
  const days = Math.floor((current.getTime() - firstDay.getTime()) / 86_400_000);
  return Math.max(1, Math.ceil((days + firstDay.getDay() + 1) / 7));
}

function weeklyMinutes(sessionLogs: SessionLog[]) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return sessionLogs.reduce((sum, log) => {
    const time = new Date(log.session_started_at).getTime();
    return time >= start.getTime() ? sum + Math.round(Number(log.duration_seconds ?? 0) / 60) : sum;
  }, 0);
}

function daysActive(sessionLogs: SessionLog[]) {
  return new Set(sessionLogs.map((log) => new Date(log.session_started_at).toISOString().slice(0, 10))).size;
}

function dailyMinutes(sessionLogs: SessionLog[]) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    return { date: date.toISOString().slice(0, 10), minutes: 0 };
  });
  const byDate = new Map(days.map((day) => [day.date, day.minutes]));

  for (const log of sessionLogs) {
    const key = new Date(log.session_started_at).toISOString().slice(0, 10);
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + Math.round(Number(log.duration_seconds ?? 0) / 60));
  }

  return days.map((day) => ({ ...day, minutes: byDate.get(day.date) ?? 0 }));
}

function weeklyBars(sessionLogs: SessionLog[]) {
  const today = new Date();
  const labels = ["3w ago", "2w ago", "Last wk", "This wk"];

  return labels.map((label, index) => {
    const end = new Date(today);
    end.setDate(today.getDate() - (3 - index) * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const minutes = sessionLogs.reduce((sum, log) => {
      const time = new Date(log.session_started_at).getTime();
      return time >= start.getTime() && time <= end.getTime()
        ? sum + Math.round(Number(log.duration_seconds ?? 0) / 60)
        : sum;
    }, 0);

    return { label, minutes };
  });
}

function skillMastery(quizResults: QuizResult[], analytics: AnalyticsSnapshot[]): ParentSkillScore[] {
  const latestSkillMetrics = analytics.find((item) => item.snapshot_type === "skill_mastery")?.metrics;

  return SKILLS.map((skill) => {
    const metricValue = numberValue(latestSkillMetrics?.[skill.key], NaN);
    if (Number.isFinite(metricValue)) return { key: skill.key, label: skill.label, value: Math.round(metricValue) };

    const matching = quizResults.filter((quiz) => {
      const moduleKey = quiz.module_key ?? quiz.lesson_key ?? "";
      return skill.modules.some((module) => moduleKey.startsWith(module));
    });

    const value =
      matching.length > 0
        ? Math.round(matching.reduce((sum, quiz) => sum + Number(quiz.score ?? 0), 0) / matching.length)
        : 0;

    return { key: skill.key, label: skill.label, value };
  });
}

function projectProgress(project: Project | null) {
  const tasks = project?.project_tasks ?? [];
  const completed = tasks.filter((task) => task.status === "completed" || task.status === "done").length;
  return {
    completed,
    total: tasks.length,
    percent: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

function buildInsights(report: ParentReport | null, summary: WeeklySummary | null, analytics: AnalyticsSnapshot[]) {
  const reportJson = report?.report_json ?? {};
  const summaryJson = summary?.summary ?? {};
  const analyticsInsight = analytics.find((item) => typeof item.metrics?.insight === "string")?.metrics.insight;

  return [
    ...stringArray(reportJson.recommendations).slice(0, 1),
    text(summaryJson.ai_commentary, ""),
    text(analyticsInsight, ""),
  ].filter(Boolean).slice(0, 2);
}

function buildGuidance({
  studentName,
  streak,
  project,
  projectOpenTasks,
  minutesThisWeek,
}: {
  studentName: string;
  streak: number;
  project: Project | null;
  projectOpenTasks: number;
  minutesThisWeek: number;
}) {
  return [
    project
      ? `Ask ${studentName} to explain the project idea and one feature they are most proud of.`
      : `Ask ${studentName} which project idea feels most exciting to build first.`,
    projectOpenTasks > 0
      ? `Encourage one short build session focused on finishing a single project task.`
      : "Celebrate the current project momentum and ask what they want to improve next.",
    streak > 0
      ? `Celebrate the ${streak}-day streak this week. Specific praise helps confidence stick.`
      : minutesThisWeek > 0
        ? "Praise the minutes already completed and help choose the next small session."
        : "Suggest a calm 10-minute learning session to restart momentum without pressure.",
  ];
}

async function ParentDashboardContent({ selectedStudentId }: { selectedStudentId?: string }) {
  const role = await getCurrentUserRole();

  if (!role) redirect("/auth?next=/parent/dashboard");
  if (role !== "parent") redirect(dashboardPathForRole(role));

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) redirect("/auth?next=/parent/dashboard");

  const { data: links } = await supabase
    .from("parent_students")
    .select("students(id, display_name, email, grade_level)")
    .eq("parent_user_id", user.id)
    .order("created_at", { ascending: true });

  const students = (links ?? [])
    .map((link) => {
      const nested = link.students;
      return (Array.isArray(nested) ? nested[0] : nested) as Student | null;
    })
    .filter((student): student is Student => Boolean(student));

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0] ?? null;

  if (!selectedStudent) {
    return (
      <ParentDashboardLayout>
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">No learner linked yet</h1>
          <p className="mt-2 text-slate-600">Ask an admin to link this parent account to a student profile.</p>
        </section>
      </ParentDashboardLayout>
    );
  }

  const [
    summaryResult,
    sessionsResult,
    streaksResult,
    quizzesResult,
    projectResult,
    analyticsResult,
    reportResult,
  ] = await Promise.all([
    supabase
      .from("parent_weekly_summaries")
      .select("week_start_date, week_end_date, lessons_completed, quizzes_completed, average_quiz_score, time_spent_seconds, highlights, concerns, summary")
      .eq("student_id", selectedStudent.id)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("session_logs")
      .select("id, duration_seconds, session_started_at")
      .eq("student_id", selectedStudent.id)
      .order("session_started_at", { ascending: false })
      .limit(120),
    supabase
      .from("streaks")
      .select("current_count, longest_count, last_activity_date")
      .eq("student_id", selectedStudent.id)
      .limit(5),
    supabase
      .from("quiz_results")
      .select("id, module_key, lesson_key, score, passed, completed_at")
      .eq("student_id", selectedStudent.id)
      .order("completed_at", { ascending: false })
      .limit(120),
    supabase
      .from("student_projects")
      .select("id, title, description, status, updated_at, project_tasks(id, title, status, completed_at, updated_at)")
      .eq("student_id", selectedStudent.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("analytics_snapshots")
      .select("snapshot_type, metrics, generated_at")
      .eq("student_id", selectedStudent.id)
      .order("generated_at", { ascending: false })
      .limit(20),
    supabase
      .from("parent_monthly_reports")
      .select("month, report_json, updated_at")
      .eq("student_id", selectedStudent.id)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const summary = summaryResult.data as WeeklySummary | null;
  const sessions = (sessionsResult.data ?? []) as SessionLog[];
  const streaks = (streaksResult.data ?? []) as Streak[];
  const quizzes = (quizzesResult.data ?? []) as QuizResult[];
  const project = projectResult.data as Project | null;
  const analytics = (analyticsResult.data ?? []) as AnalyticsSnapshot[];
  const report = reportResult.data as ParentReport | null;
  const minutesThisWeek = weeklyMinutes(sessions);
  const streak = streaks[0]?.current_count ?? 0;
  const projectStats = projectProgress(project);
  const skills = skillMastery(quizzes, analytics);
  const insights = buildInsights(report, summary, analytics);
  const guidance = buildGuidance({
    studentName: selectedStudent.display_name,
    streak,
    project,
    projectOpenTasks: projectStats.total - projectStats.completed,
    minutesThisWeek,
  });

  const monthlyReportMonth = report?.month ?? currentMonth();

  return (
    <ParentDashboardLayout>
      <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Parent Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome, {getParentName(user)}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              A clear weekly view of {selectedStudent.display_name}&apos;s learning rhythm, project momentum, and support needs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <StudentSelector
              students={students.map((student): LinkedStudentOption => ({
                id: student.id,
                display_name: student.display_name,
                email: student.email,
              }))}
              selectedStudentId={selectedStudent.id}
            />
            <Link
              href={`/parent/reports/${monthlyReportMonth}?studentId=${selectedStudent.id}`}
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Monthly Reports
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <WeeklySummaryCard
          studentName={selectedStudent.display_name}
          weekNumber={weekNumberFromDate(summary?.week_start_date)}
          lessonsCompleted={summary?.lessons_completed ?? 0}
          minutesSpent={Math.round((summary?.time_spent_seconds ?? minutesThisWeek * 60) / 60)}
          streakDays={streak}
          highlights={summary?.highlights ?? []}
          concerns={summary?.concerns ?? []}
          consistencyMessage={
            streak >= 5
              ? "A strong consistency pattern is forming. Keep encouraging steady, manageable sessions."
              : minutesThisWeek > 0
                ? "There is active learning this week. A short follow-up conversation can help lock it in."
                : "No sessions are logged yet this week. A gentle 10-minute reset is a good next step."
          }
        />
        <AiParentInsight studentName={selectedStudent.display_name} insights={insights} reportMonth={monthlyReportMonth} />
      </section>

      <EngagementAnalytics
        dailyMinutes={dailyMinutes(sessions)}
        weeklyActivity={weeklyBars(sessions)}
        minutes={minutesThisWeek}
        daysActive={daysActive(sessions)}
        streak={streak}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SkillMasterySnapshot skills={skills} analytics={analytics} />
        <ProjectProgressOverview project={project} stats={projectStats} />
      </section>

      <RecommendedGuidance studentName={selectedStudent.display_name} guidance={guidance} />
    </ParentDashboardLayout>
  );
}

function ParentDashboardFallback() {
  return (
    <ParentDashboardLayout>
      <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-72 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
    </ParentDashboardLayout>
  );
}

export default async function ParentDashboardPage({ searchParams }: ParentDashboardPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<ParentDashboardFallback />}>
      <ParentDashboardContent selectedStudentId={params.studentId} />
    </Suspense>
  );
}
