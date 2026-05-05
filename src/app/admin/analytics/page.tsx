import { AdminAnalyticsLayout } from "@/components/admin-analytics/AdminAnalyticsLayout";
import { AISystemUsage } from "@/components/admin-analytics/AISystemUsage";
import { EngagementTrends } from "@/components/admin-analytics/EngagementTrends";
import { ParentActivity } from "@/components/admin-analytics/ParentActivity";
import { PlatformOverview } from "@/components/admin-analytics/PlatformOverview";
import { ProjectProgressAnalytics } from "@/components/admin-analytics/ProjectProgressAnalytics";
import { QuizPerformance } from "@/components/admin-analytics/QuizPerformance";
import { SkillMasteryTrends } from "@/components/admin-analytics/SkillMasteryTrends";
import { SystemHealth } from "@/components/admin-analytics/SystemHealth";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type RoleRow = {
  user_id: string;
  role: "student" | "parent" | "admin";
};

type SessionLogRow = {
  id: string;
  session_started_at: string;
  duration_seconds: number | null;
};

type StreakRow = {
  current_count: number | null;
  longest_count: number | null;
  last_activity_date: string | null;
};

type QuizResultRow = {
  id: string;
  module_key: string | null;
  lesson_key: string | null;
  quiz_title: string | null;
  score: number | string | null;
  max_score: number | string | null;
  feedback: Record<string, unknown> | null;
  completed_at: string;
};

type ProjectRow = {
  id: string;
  status: string;
  title: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type ProjectTaskRow = {
  id: string;
  status: string;
  updated_at: string;
  completed_at: string | null;
};

type SnapshotRow = {
  id: string;
  snapshot_type: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown> | null;
  dimensions: Record<string, unknown> | null;
  generated_at: string;
};

type AIConfigRow = {
  provider: string | null;
  model: string | null;
  settings: Record<string, unknown> | null;
  is_active: boolean | null;
  updated_at: string | null;
};

type AIInteractionRow = {
  id: string;
  interaction_type: string | null;
  response: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  moderation_flags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const SKILLS = [
  { key: "html", label: "HTML" },
  { key: "css", label: "CSS" },
  { key: "javascript", label: "JavaScript" },
  { key: "nextjs", label: "Next.js" },
  { key: "supabase", label: "Supabase" },
  { key: "threejs", label: "Three.js" },
  { key: "git", label: "Git" },
  { key: "apis", label: "APIs" },
] as const;

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function countRole(rows: RoleRow[], role: RoleRow["role"]) {
  return rows.filter((row) => row.role === role).length;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function groupDailyMinutes(sessionLogs: SessionLogRow[]) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = daysAgo(13 - index);
    return {
      date,
      label: formatDay(date),
      minutes: 0,
    };
  });

  for (const log of sessionLogs) {
    const started = new Date(log.session_started_at);
    const bucket = days.find((day) => day.date.toDateString() === started.toDateString());
    if (bucket) bucket.minutes += Math.round(numberValue(log.duration_seconds) / 60);
  }

  return days.map(({ label, minutes }) => ({ label, minutes }));
}

function groupWeeklyActivity(sessionLogs: SessionLogRow[]) {
  return [
    { label: "This week", start: daysAgo(6), end: daysAgo(0) },
    { label: "Last week", start: daysAgo(13), end: daysAgo(7) },
    { label: "2 weeks ago", start: daysAgo(20), end: daysAgo(14) },
    { label: "3 weeks ago", start: daysAgo(27), end: daysAgo(21) },
  ].map((week) => {
    const activeDays = new Set<string>();
    let minutes = 0;

    for (const log of sessionLogs) {
      const started = new Date(log.session_started_at);
      if (started >= week.start && started <= new Date(week.end.getTime() + 86_399_999)) {
        activeDays.add(started.toDateString());
        minutes += Math.round(numberValue(log.duration_seconds) / 60);
      }
    }

    return { label: week.label, daysActive: activeDays.size, minutes };
  });
}

function getMetric(metrics: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metrics) return null;
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number" || typeof value === "string") return numberValue(value, 0);
  }
  return null;
}

function skillFallbackFromQuizzes(quizzes: QuizResultRow[], skill: string) {
  const related = quizzes.filter((quiz) => {
    const haystack = `${quiz.module_key ?? ""} ${quiz.lesson_key ?? ""} ${quiz.quiz_title ?? ""}`.toLowerCase();
    return haystack.includes(skill.replace("nextjs", "next")) || haystack.includes(skill);
  });

  if (related.length === 0) return 0;
  const total = related.reduce((sum, quiz) => {
    const max = Math.max(1, numberValue(quiz.max_score, 100));
    return sum + Math.round((numberValue(quiz.score) / max) * 100);
  }, 0);
  return Math.round(total / related.length);
}

function buildSkillMetrics(snapshots: SnapshotRow[], quizzes: QuizResultRow[]) {
  const skillSnapshots = snapshots.filter((snapshot) => snapshot.snapshot_type.includes("skill"));

  return SKILLS.map((skill) => {
    const latest = [...skillSnapshots]
      .sort((left, right) => Date.parse(right.generated_at) - Date.parse(left.generated_at))
      .find((snapshot) => getMetric(snapshot.metrics, [skill.key, `${skill.key}_mastery`, skill.label.toLowerCase()]) !== null);

    const previous = [...skillSnapshots]
      .sort((left, right) => Date.parse(right.generated_at) - Date.parse(left.generated_at))
      .filter((snapshot) => getMetric(snapshot.metrics, [skill.key, `${skill.key}_mastery`, skill.label.toLowerCase()]) !== null)[1];

    const latestValue = getMetric(latest?.metrics, [skill.key, `${skill.key}_mastery`, skill.label.toLowerCase()]);
    const previousValue = getMetric(previous?.metrics, [skill.key, `${skill.key}_mastery`, skill.label.toLowerCase()]);
    const value = Math.max(0, Math.min(100, latestValue ?? skillFallbackFromQuizzes(quizzes, skill.key)));

    return {
      key: skill.key,
      label: skill.label,
      value,
      trend: previousValue === null || previousValue === undefined ? 0 : Math.round(value - previousValue),
    };
  });
}

function buildQuizDistribution(quizzes: QuizResultRow[]) {
  const buckets = [
    { label: "90-100", min: 90, max: 100, count: 0 },
    { label: "75-89", min: 75, max: 89, count: 0 },
    { label: "60-74", min: 60, max: 74, count: 0 },
    { label: "0-59", min: 0, max: 59, count: 0 },
  ];

  for (const quiz of quizzes) {
    const max = Math.max(1, numberValue(quiz.max_score, 100));
    const score = Math.round((numberValue(quiz.score) / max) * 100);
    const bucket = buckets.find((item) => score >= item.min && score <= item.max);
    if (bucket) bucket.count += 1;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function buildHardestConcepts(quizzes: QuizResultRow[]) {
  const lowScores = quizzes
    .map((quiz) => {
      const max = Math.max(1, numberValue(quiz.max_score, 100));
      return {
        label: quiz.quiz_title ?? quiz.lesson_key ?? quiz.module_key ?? "Untitled quiz",
        score: Math.round((numberValue(quiz.score) / max) * 100),
      };
    })
    .filter((quiz) => quiz.score < 75)
    .sort((left, right) => left.score - right.score)
    .slice(0, 5);

  return lowScores.length > 0 ? lowScores : [{ label: "No weak concepts detected yet", score: 100 }];
}

function buildProjectVelocity(tasks: ProjectTaskRow[]) {
  const weeks = [
    { label: "This week", start: daysAgo(6), end: daysAgo(0) },
    { label: "Last week", start: daysAgo(13), end: daysAgo(7) },
    { label: "2 weeks ago", start: daysAgo(20), end: daysAgo(14) },
    { label: "3 weeks ago", start: daysAgo(27), end: daysAgo(21) },
  ];

  return weeks.map((week) => {
    const count = tasks.filter((task) => {
      if (task.status !== "done") return false;
      const completed = new Date(task.completed_at ?? task.updated_at);
      return completed >= week.start && completed <= new Date(week.end.getTime() + 86_399_999);
    }).length;
    return { label: week.label, count };
  });
}

function buildAIUsage(interactions: AIInteractionRow[]) {
  const callsByType = new Map<string, number>();
  let errors = 0;
  let latencyTotal = 0;
  let latencyCount = 0;

  for (const interaction of interactions) {
    const type = interaction.interaction_type ?? "mentor";
    callsByType.set(type, (callsByType.get(type) ?? 0) + 1);
    const metadataError = interaction.metadata?.error ?? interaction.metadata?.error_message;
    if (!interaction.response || metadataError) errors += 1;
    if (interaction.latency_ms) {
      latencyTotal += interaction.latency_ms;
      latencyCount += 1;
    }
  }

  return {
    callsByType: Array.from(callsByType.entries()).map(([label, count]) => ({ label, count })),
    successRate: interactions.length === 0 ? 100 : Math.round(((interactions.length - errors) / interactions.length) * 100),
    errorCount: errors,
    averageLatencyMs: latencyCount === 0 ? 0 : Math.round(latencyTotal / latencyCount),
  };
}

async function loadAnalyticsData() {
  const role = await requireRole(["admin"]);
  if (!role) redirect("/auth?next=/admin/analytics");

  const startedAt = Date.now();
  const supabase = createClient(await cookies());

  const [
    studentsCount,
    rolesResult,
    lessonsCount,
    quizzesCount,
    projectsCount,
    certificatesCount,
    sessionLogsResult,
    streaksResult,
    quizResults,
    projectsResult,
    projectTasksResult,
    snapshotsResult,
    parentLinksResult,
    parentReportsResult,
    aiConfigResult,
    aiInteractionsResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("lesson_progress").select("id", { count: "exact", head: true }),
    supabase.from("quiz_results").select("id", { count: "exact", head: true }),
    supabase.from("student_projects").select("id", { count: "exact", head: true }),
    supabase.from("student_certificates").select("id", { count: "exact", head: true }),
    supabase.from("session_logs").select("id, session_started_at, duration_seconds").order("session_started_at", { ascending: false }).limit(500),
    supabase.from("streaks").select("current_count, longest_count, last_activity_date").limit(500),
    supabase.from("quiz_results").select("id, module_key, lesson_key, quiz_title, score, max_score, feedback, completed_at").order("completed_at", { ascending: false }).limit(500),
    supabase.from("student_projects").select("id, status, title, created_at, updated_at, completed_at").limit(500),
    supabase.from("project_tasks").select("id, status, updated_at, completed_at").limit(1000),
    supabase.from("analytics_snapshots").select("id, snapshot_type, period_start, period_end, metrics, dimensions, generated_at").order("generated_at", { ascending: false }).limit(500),
    supabase.from("parent_students").select("parent_user_id, student_id").limit(1000),
    supabase.from("parent_monthly_reports").select("id, student_id, month, created_at, updated_at").order("updated_at", { ascending: false }).limit(200),
    supabase.from("ai_config").select("provider, model, settings, is_active, updated_at").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_interactions").select("id, interaction_type, response, input_tokens, output_tokens, latency_ms, moderation_flags, metadata, created_at").order("created_at", { ascending: false }).limit(500),
  ]);

  const roles = (rolesResult.data ?? []) as RoleRow[];
  const sessionLogs = (sessionLogsResult.data ?? []) as SessionLogRow[];
  const streaks = (streaksResult.data ?? []) as StreakRow[];
  const quizzes = (quizResults.data ?? []) as QuizResultRow[];
  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const tasks = (projectTasksResult.data ?? []) as ProjectTaskRow[];
  const snapshots = (snapshotsResult.data ?? []) as SnapshotRow[];
  const parentLinks = (parentLinksResult.data ?? []) as Array<{ parent_user_id: string; student_id: string }>;
  const parentReports = (parentReportsResult.data ?? []) as Array<{ id: string; student_id: string; month: string; updated_at: string }>;
  const aiConfig = (aiConfigResult.data ?? null) as AIConfigRow | null;
  const aiInteractions = (aiInteractionsResult.data ?? []) as AIInteractionRow[];

  const totalMinutes = Math.round(sessionLogs.reduce((sum, log) => sum + numberValue(log.duration_seconds), 0) / 60);
  const averageStreak = streaks.length === 0 ? 0 : Math.round(streaks.reduce((sum, row) => sum + numberValue(row.current_count), 0) / streaks.length);
  const averageQuizScore = quizzes.length === 0
    ? 0
    : Math.round(quizzes.reduce((sum, quiz) => sum + (numberValue(quiz.score) / Math.max(1, numberValue(quiz.max_score, 100))) * 100, 0) / quizzes.length);
  const completedProjects = projects.filter((project) => project.status === "completed" || Boolean(project.completed_at)).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const aiUsage = buildAIUsage(aiInteractions);
  const projectCompletionRate = projects.length === 0 ? 0 : Math.round((completedProjects / projects.length) * 100);
  const taskCompletionRate = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return {
    overview: {
      totalStudents: studentsCount.count ?? 0,
      totalParents: countRole(roles, "parent"),
      totalAdmins: countRole(roles, "admin"),
      totalLessons: lessonsCount.count ?? 0,
      totalQuizzes: quizzesCount.count ?? 0,
      totalProjects: projectsCount.count ?? 0,
      totalCertificates: certificatesCount.count ?? 0,
    },
    engagement: {
      totalMinutes,
      averageStreak,
      dailyMinutes: groupDailyMinutes(sessionLogs),
      weeklyActivity: groupWeeklyActivity(sessionLogs),
    },
    skills: {
      snapshotsCount: snapshots.filter((snapshot) => snapshot.snapshot_type.includes("skill")).length,
      skills: buildSkillMetrics(snapshots, quizzes),
    },
    quizzes: {
      totalQuizzes: quizzesCount.count ?? quizzes.length,
      averageScore: averageQuizScore,
      distribution: buildQuizDistribution(quizzes),
      hardestConcepts: buildHardestConcepts(quizzes),
    },
    projects: {
      totalProjects: projectsCount.count ?? projects.length,
      projectCompletionRate,
      taskCompletionRate,
      velocity: buildProjectVelocity(tasks),
      readiness: {
        ready: completedProjects,
        inProgress: projects.filter((project) => project.status !== "completed" && project.status !== "draft").length,
        atRisk: projects.filter((project) => project.status === "draft").length,
      },
    },
    ai: {
      provider: aiConfig?.provider ?? "Not configured",
      model: aiConfig?.model ?? "Not configured",
      totalCalls: aiInteractions.length,
      successRate: aiUsage.successRate,
      errorCount: aiUsage.errorCount,
      averageLatencyMs: aiUsage.averageLatencyMs,
      callsByType: aiUsage.callsByType,
    },
    parents: {
      parentCount: countRole(roles, "parent"),
      linkedStudents: new Set(parentLinks.map((link) => link.student_id)).size,
      linkCount: parentLinks.length,
      reportsGenerated: parentReports.length,
      recentReports: parentReports.slice(0, 5).map((report) => ({ month: report.month, updatedAt: report.updated_at })),
    },
    health: {
      supabaseConnected: !studentsCount.error && !rolesResult.error,
      rlsProtected: true,
      storageStatus: "not measured",
      apiLatencyMs: Date.now() - startedAt,
      attentionNeeded: Boolean(studentsCount.error || rolesResult.error || aiInteractionsResult.error),
    },
  };
}

async function AdminAnalyticsContent() {
  const data = await loadAnalyticsData();

  return (
    <AdminAnalyticsLayout>
      <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Admin Analytics</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Platform Intelligence</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Track learning engagement, skill growth, quiz performance, project readiness, AI usage, parent activity, and operational health from one dashboard.
        </p>
      </header>

      <PlatformOverview overview={data.overview} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <EngagementTrends engagement={data.engagement} />
        <SkillMasteryTrends data={data.skills} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <QuizPerformance data={data.quizzes} />
        <ProjectProgressAnalytics data={data.projects} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <AISystemUsage data={data.ai} />
        <ParentActivity data={data.parents} />
      </section>

      <SystemHealth health={data.health} />
    </AdminAnalyticsLayout>
  );
}

function AnalyticsFallback() {
  return (
    <AdminAnalyticsLayout>
      <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    </AdminAnalyticsLayout>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsFallback />}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}
