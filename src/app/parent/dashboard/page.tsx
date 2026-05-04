import { AIInsightsCard } from "@/components/parent-dashboard/AIInsightsCard";
import { EngagementChart, type DailyEngagement, type WeeklyEngagement } from "@/components/parent-dashboard/EngagementChart";
import { ParentHeader } from "@/components/parent-dashboard/ParentHeader";
import { ProjectProgressCard, type ProjectMilestone } from "@/components/parent-dashboard/ProjectProgressCard";
import { SkillMasteryChart, type SkillMastery } from "@/components/parent-dashboard/SkillMasteryChart";
import { WeeklySummaryCard } from "@/components/parent-dashboard/WeeklySummaryCard";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type Student = {
  id: string;
  user_id: string | null;
  display_name: string;
  parent_email: string | null;
};

type WeeklySummary = {
  week_start_date: string;
  week_end_date: string;
  lessons_completed: number;
  quizzes_completed: number;
  average_quiz_score: number | null;
  time_spent_seconds: number;
  achievements_awarded: string[];
  highlights: string[];
  concerns: string[];
  summary: Record<string, unknown>;
};

type AnalyticsSnapshot = {
  snapshot_type: string;
  metrics: Record<string, unknown>;
  dimensions: Record<string, unknown>;
  period_start: string;
  period_end: string;
};

type SessionLog = {
  session_started_at: string;
  session_ended_at: string | null;
  duration_seconds: number;
};

type QuizResult = {
  module_key: string | null;
  lesson_key: string | null;
  score: number;
  passed: boolean;
  created_at: string;
};

type ProjectTask = {
  id: string;
  title: string;
  status: string;
  completed_at: string | null;
  updated_at: string;
};

type StudentProject = {
  id: string;
  title: string;
  status: string;
  repository_url: string | null;
  demo_url: string | null;
  project_data: Record<string, unknown>;
  updated_at: string;
  project_tasks?: ProjectTask[];
};

const SKILLS = [
  { key: "html", label: "HTML", modules: ["week1"] },
  { key: "css", label: "CSS", modules: ["week1", "week2"] },
  { key: "javascript", label: "JavaScript", modules: ["week4"] },
  { key: "nextjs", label: "Next.js", modules: ["week5"] },
  { key: "apis", label: "APIs", modules: ["week6"] },
  { key: "supabase", label: "Supabase", modules: ["week7"] },
  { key: "threejs", label: "Three.js", modules: ["week8"] },
  { key: "project_management", label: "Project Management", modules: ["week9", "week10", "week11", "week12"] },
];

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getWeekNumber(date: string | null | undefined) {
  if (!date) {
    return 1;
  }

  const start = new Date(new Date(date).getFullYear(), 0, 1);
  const current = new Date(date);
  const days = Math.floor((current.getTime() - start.getTime()) / 86_400_000);

  return Math.max(1, Math.ceil((days + start.getDay() + 1) / 7));
}

function getLast14Days(): DailyEngagement[] {
  const today = new Date();

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));

    return {
      date: date.toISOString().slice(0, 10),
      minutes: 0,
    };
  });
}

function buildDailyMinutes(sessionLogs: SessionLog[]) {
  const days = getLast14Days();
  const byDate = new Map(days.map((day) => [day.date, day.minutes]));

  for (const session of sessionLogs) {
    const date = new Date(session.session_started_at).toISOString().slice(0, 10);
    const minutes = Math.round((session.duration_seconds ?? 0) / 60);

    if (byDate.has(date)) {
      byDate.set(date, (byDate.get(date) ?? 0) + minutes);
    }
  }

  return days.map((day) => ({
    ...day,
    minutes: byDate.get(day.date) ?? 0,
  }));
}

function buildWeeklyActivity(sessionLogs: SessionLog[]): WeeklyEngagement[] {
  const weeks = [
    { label: "3w ago", startOffset: 27, endOffset: 21 },
    { label: "2w ago", startOffset: 20, endOffset: 14 },
    { label: "Last wk", startOffset: 13, endOffset: 7 },
    { label: "This wk", startOffset: 6, endOffset: 0 },
  ];
  const today = new Date();

  return weeks.map((week) => {
    const start = new Date(today);
    start.setDate(today.getDate() - week.startOffset);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setDate(today.getDate() - week.endOffset);
    end.setHours(23, 59, 59, 999);

    const minutes = sessionLogs.reduce((sum, session) => {
      const time = new Date(session.session_started_at).getTime();

      if (time >= start.getTime() && time <= end.getTime()) {
        return sum + Math.round((session.duration_seconds ?? 0) / 60);
      }

      return sum;
    }, 0);

    return {
      label: week.label,
      minutes,
    };
  });
}

function getCurrentWeekMinutes(sessionLogs: SessionLog[]) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return sessionLogs.reduce((sum, session) => {
    const time = new Date(session.session_started_at).getTime();
    return time >= start.getTime() ? sum + Math.round((session.duration_seconds ?? 0) / 60) : sum;
  }, 0);
}

function getStreakDays(sessionLogs: SessionLog[]) {
  const activeDates = new Set(
    sessionLogs.map((session) => new Date(session.session_started_at).toISOString().slice(0, 10)),
  );
  const cursor = new Date();
  let streak = 0;

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

function buildSkillMastery(quizResults: QuizResult[]): SkillMastery[] {
  return SKILLS.map((skill) => {
    const matching = quizResults.filter((quiz) => {
      const moduleKey = quiz.module_key ?? quiz.lesson_key ?? "";
      return skill.modules.some((module) => moduleKey.startsWith(module));
    });
    const value =
      matching.length > 0
        ? Math.round(matching.reduce((sum, quiz) => sum + Number(quiz.score ?? 0), 0) / matching.length)
        : 0;

    return {
      key: skill.key,
      label: skill.label,
      value,
    };
  });
}

function getStrengths(skills: SkillMastery[]) {
  return skills
    .filter((skill) => skill.value >= 80)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((skill) => `${skill.label} (${skill.value}%)`);
}

function getAreasToImprove(skills: SkillMastery[]) {
  return skills
    .filter((skill) => skill.value > 0 && skill.value < 75)
    .sort((left, right) => left.value - right.value)
    .slice(0, 3)
    .map((skill) => `${skill.label} (${skill.value}%)`);
}

function getProjectProgress(project: StudentProject | null) {
  const tasks = project?.project_tasks ?? [];
  const completed = tasks.filter((task) => task.status === "completed").length;

  return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
}

function getMilestones(project: StudentProject | null): ProjectMilestone[] {
  return (project?.project_tasks ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    completedAt: task.completed_at,
  }));
}

function getProjectUpdates(project: StudentProject | null) {
  const completed = (project?.project_tasks ?? [])
    .filter((task) => task.status === "completed")
    .slice(0, 3)
    .map((task) => `${task.title} completed`);

  if (completed.length > 0) {
    return completed;
  }

  return project ? [`${project.title} is in ${project.status.replaceAll("_", " ")} status`] : [];
}

async function ParentDashboardContent() {
  const role = await requireRole(["parent", "admin"]);

  if (!role) {
    redirect("/auth?next=/parent/dashboard");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Parent dashboard unavailable</h1>
          <p className="mt-2 text-slate-600">Sign in with the parent account connected to your learner.</p>
        </section>
      </main>
    );
  }

  const { data: linkedStudent } = await supabase
    .from("parent_students")
    .select("students(*)")
    .eq("parent_user_id", user.id)
    .limit(1)
    .maybeSingle();
  const relationStudent = linkedStudent?.students;
  const student = (Array.isArray(relationStudent) ? relationStudent[0] : relationStudent) as Student | null;

  if (!student) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">No learner linked yet</h1>
          <p className="mt-2 text-slate-600">
            Link this parent account to a student in the parent_students table to unlock progress reporting.
          </p>
        </section>
      </main>
    );
  }

  const [
    weeklySummaryResult,
    analyticsResult,
    projectResult,
    sessionLogsResult,
    quizResultsResult,
  ] = await Promise.all([
    supabase
      .from("parent_weekly_summaries")
      .select("*")
      .eq("student_id", student.id)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("analytics_snapshots")
      .select("*")
      .eq("student_id", student.id)
      .order("generated_at", { ascending: false })
      .limit(10),
    supabase
      .from("student_projects")
      .select("*, project_tasks(*)")
      .eq("student_id", student.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("session_logs")
      .select("*")
      .eq("student_id", student.id)
      .order("session_started_at", { ascending: false })
      .limit(100),
    supabase
      .from("quiz_results")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const summary = weeklySummaryResult.data as WeeklySummary | null;
  const analytics = (analyticsResult.data ?? []) as AnalyticsSnapshot[];
  const project = projectResult.data as StudentProject | null;
  const sessionLogs = (sessionLogsResult.data ?? []) as SessionLog[];
  const quizResults = (quizResultsResult.data ?? []) as QuizResult[];
  const dailyMinutes = buildDailyMinutes(sessionLogs);
  const weeklyActivity = buildWeeklyActivity(sessionLogs);
  const currentWeekMinutes = getCurrentWeekMinutes(sessionLogs);
  const streakDays = getStreakDays(sessionLogs);
  const skills = buildSkillMastery(quizResults);
  const strengths = getStrengths(skills);
  const areasToImprove = getAreasToImprove(skills);
  const weekNumber = getWeekNumber(summary?.week_start_date ?? sessionLogs[0]?.session_started_at);
  const lessonsCompleted = summary?.lessons_completed ?? 0;
  const projectProgress = getProjectProgress(project);
  const projectUpdates = getProjectUpdates(project);
  const summaryJson = summary?.summary ?? {};
  const skillsImproved = toStringArray(summaryJson.skills_improved).concat(summary?.achievements_awarded ?? []);
  const challenges = summary?.concerns ?? toStringArray(summaryJson.challenges);
  const recommendations = toStringArray(summaryJson.recommendations);
  const weeklySummaryText = toStringValue(
    summaryJson.ai_weekly_summary,
    summary
      ? "Your learner is building momentum. Encourage them to explain one thing they learned and one thing they want to try next."
      : "Weekly AI summaries will appear after enough activity has been recorded.",
  );
  const aiCommentary = toStringValue(
    summaryJson.ai_commentary,
    "A steady routine matters more than long sessions. Short, focused check-ins can help your learner stay confident.",
  );
  const engagementInsights = toStringValue(
    analytics.find((item) => item.snapshot_type === "engagement")?.metrics.insight,
    currentWeekMinutes > 0
      ? "This week has active learning time. A good next step is asking your learner to show the most recent thing they built."
      : "No minutes are logged for this week yet. A short 15-minute session is a useful way to restart momentum.",
  );
  const parentSummary = toStringValue(
    summaryJson.parent_summary,
    `${student.display_name} has completed ${lessonsCompleted} lessons and spent ${currentWeekMinutes} minutes learning this week.`,
  );
  const lastCommitTime =
    typeof project?.project_data.last_commit_at === "string" ? project.project_data.last_commit_at : project?.updated_at ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ParentHeader
          studentName={student.display_name}
          currentWeek={weekNumber}
          lessonsCompleted={lessonsCompleted}
          weeklyMinutes={currentWeekMinutes}
          streakDays={streakDays}
          summary={parentSummary}
        />

        <WeeklySummaryCard
          weekNumber={weekNumber}
          lessonsCompleted={lessonsCompleted}
          minutesSpent={Math.round((summary?.time_spent_seconds ?? currentWeekMinutes * 60) / 60)}
          skillsImproved={skillsImproved}
          projectUpdates={projectUpdates}
          challenges={challenges}
          aiCommentary={aiCommentary}
        />

        <EngagementChart
          dailyMinutes={dailyMinutes}
          weeklyActivity={weeklyActivity}
          streakDays={streakDays}
          insights={engagementInsights}
        />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SkillMasteryChart skills={skills} strengths={strengths} areasToImprove={areasToImprove} />
          <AIInsightsCard recommendations={recommendations} weeklySummary={weeklySummaryText} />
        </section>

        <ProjectProgressCard
          title={project?.title ?? "No active project yet"}
          progress={projectProgress}
          milestones={getMilestones(project)}
          lastCommitTime={lastCommitTime}
          projectUrl={project?.demo_url ?? project?.repository_url ?? null}
        />
      </div>
    </main>
  );
}

function ParentDashboardFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-72 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

export default function ParentDashboardPage() {
  return (
    <Suspense fallback={<ParentDashboardFallback />}>
      <ParentDashboardContent />
    </Suspense>
  );
}
