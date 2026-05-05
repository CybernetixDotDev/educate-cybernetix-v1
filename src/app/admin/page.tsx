import { AdminDashboardLayout } from "@/components/admin-dashboard/AdminDashboardLayout";
import { AISystemStatus } from "@/components/admin-dashboard/AISystemStatus";
import { ParentOverview } from "@/components/admin-dashboard/ParentOverview";
import { PlatformOverviewCards } from "@/components/admin-dashboard/PlatformOverviewCards";
import { QuickActionsGrid } from "@/components/admin-dashboard/QuickActionsGrid";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import { RoleManagementSnapshot } from "@/components/admin-dashboard/RoleManagementSnapshot";
import { StudentOverview } from "@/components/admin-dashboard/StudentOverview";
import { SystemHealthIndicators } from "@/components/admin-dashboard/SystemHealthIndicators";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export type AdminOverview = {
  totalStudents: number;
  totalParents: number;
  totalAdmins: number;
  totalLessons: number;
  totalQuizzes: number;
  totalProjects: number;
  totalCertificates: number;
};

export type AdminStudentRow = {
  id: string;
  display_name: string;
  email: string | null;
  onboarding_complete: boolean | null;
  created_at: string;
};

export type AdminRoleRow = {
  user_id: string;
  role: "student" | "parent" | "admin";
  created_at: string;
};

export type AdminParentLink = {
  parent_user_id: string;
  student_id: string;
  students?: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null;
};

export type AdminAIConfig = {
  provider: string;
  model: string;
  is_active: boolean;
  updated_at: string;
};

export type AdminAIInteraction = {
  id: string;
  interaction_type: string;
  response: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminActivityItem = {
  id: string;
  label: string;
  detail: string;
  date: string;
  tone: "cyan" | "emerald" | "violet" | "amber" | "rose";
};

export type AdminDashboardData = {
  adminName: string;
  overview: AdminOverview;
  students: AdminStudentRow[];
  roles: AdminRoleRow[];
  parentLinks: AdminParentLink[];
  aiConfig: AdminAIConfig | null;
  aiInteractions: AdminAIInteraction[];
  activities: AdminActivityItem[];
  health: {
    supabaseConnected: boolean;
    rlsProtected: boolean;
    storageStatus: "healthy" | "unknown";
    apiLatencyMs: number;
  };
};

function adminNameFromUser(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "Admin";
}

function countRole(rows: AdminRoleRow[], role: AdminRoleRow["role"]) {
  return rows.filter((row) => row.role === role).length;
}

function rowCount(result: { count: number | null }) {
  return result.count ?? 0;
}

function activityDate(value: unknown) {
  return typeof value === "string" && value ? value : new Date().toISOString();
}

async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  const role = await requireRole(["admin"]);
  if (!role) redirect("/auth?next=/admin");

  const startedAt = Date.now();
  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) redirect("/auth?next=/admin");

  const [
    studentsCount,
    rolesResult,
    lessonsCount,
    quizzesCount,
    projectsCount,
    certificatesCount,
    studentsResult,
    parentLinksResult,
    aiConfigResult,
    aiInteractionsResult,
    lessonActivityResult,
    quizActivityResult,
    projectActivityResult,
    certificateActivityResult,
    reportActivityResult,
    growthActivityResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("user_id, role, created_at"),
    supabase.from("lesson_progress").select("id", { count: "exact", head: true }),
    supabase.from("quiz_results").select("id", { count: "exact", head: true }),
    supabase.from("student_projects").select("id", { count: "exact", head: true }),
    supabase.from("student_certificates").select("id", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("id, display_name, email, onboarding_complete, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("parent_students")
      .select("parent_user_id, student_id, students(display_name, email)")
      .limit(100),
    supabase
      .from("ai_config")
      .select("provider, model, is_active, updated_at")
      .eq("config_key", "global-ai-mentor")
      .maybeSingle(),
    supabase
      .from("ai_interactions")
      .select("id, interaction_type, response, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("lesson_progress")
      .select("id, lesson_title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("quiz_results")
      .select("id, quiz_title, score, completed_at")
      .order("completed_at", { ascending: false })
      .limit(8),
    supabase
      .from("project_tasks")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("student_certificates")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("parent_monthly_reports")
      .select("id, month, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("student_growth_timelines")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const roles = (rolesResult.data ?? []) as AdminRoleRow[];
  const activities: AdminActivityItem[] = [
    ...((lessonActivityResult.data ?? []) as Array<{ id: string; lesson_title: string | null; status: string; updated_at: string }>).map((item) => ({
      id: `lesson-${item.id}`,
      label: item.lesson_title ?? "Lesson progress updated",
      detail: item.status,
      date: activityDate(item.updated_at),
      tone: "cyan" as const,
    })),
    ...((quizActivityResult.data ?? []) as Array<{ id: string; quiz_title: string | null; score: number; completed_at: string }>).map((item) => ({
      id: `quiz-${item.id}`,
      label: item.quiz_title ?? "Quiz completed",
      detail: `${Math.round(Number(item.score ?? 0))}%`,
      date: activityDate(item.completed_at),
      tone: "amber" as const,
    })),
    ...((projectActivityResult.data ?? []) as Array<{ id: string; title: string; status: string; updated_at: string }>).map((item) => ({
      id: `task-${item.id}`,
      label: item.title,
      detail: `Project task ${item.status}`,
      date: activityDate(item.updated_at),
      tone: "emerald" as const,
    })),
    ...((certificateActivityResult.data ?? []) as Array<{ id: string; created_at: string }>).map((item) => ({
      id: `certificate-${item.id}`,
      label: "Certificate generated",
      detail: "student certificate",
      date: activityDate(item.created_at),
      tone: "violet" as const,
    })),
    ...((reportActivityResult.data ?? []) as Array<{ id: string; month: string; updated_at: string }>).map((item) => ({
      id: `report-${item.id}`,
      label: `Parent report ${item.month}`,
      detail: "monthly report",
      date: activityDate(item.updated_at),
      tone: "rose" as const,
    })),
    ...((growthActivityResult.data ?? []) as Array<{ id: string; updated_at: string }>).map((item) => ({
      id: `timeline-${item.id}`,
      label: "Growth timeline updated",
      detail: "growth timeline",
      date: activityDate(item.updated_at),
      tone: "violet" as const,
    })),
  ].sort((left, right) => Date.parse(right.date) - Date.parse(left.date)).slice(0, 12);

  return {
    adminName: adminNameFromUser(user),
    overview: {
      totalStudents: rowCount(studentsCount),
      totalParents: countRole(roles, "parent"),
      totalAdmins: countRole(roles, "admin"),
      totalLessons: rowCount(lessonsCount),
      totalQuizzes: rowCount(quizzesCount),
      totalProjects: rowCount(projectsCount),
      totalCertificates: rowCount(certificatesCount),
    },
    students: (studentsResult.data ?? []) as AdminStudentRow[],
    roles,
    parentLinks: (parentLinksResult.data ?? []) as AdminParentLink[],
    aiConfig: (aiConfigResult.data ?? null) as AdminAIConfig | null,
    aiInteractions: (aiInteractionsResult.data ?? []) as AdminAIInteraction[],
    activities,
    health: {
      supabaseConnected: !studentsCount.error && !rolesResult.error,
      rlsProtected: true,
      storageStatus: "unknown",
      apiLatencyMs: Date.now() - startedAt,
    },
  };
}

async function AdminHomeContent() {
  const data = await loadAdminDashboardData();

  return (
    <AdminDashboardLayout>
      <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Admin Control Center</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome, {data.adminName}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Manage curriculum, roles, families, AI systems, reporting, and platform activity from one operational view.
        </p>
      </header>

      <PlatformOverviewCards overview={data.overview} />
      <QuickActionsGrid />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <StudentOverview students={data.students} totalStudents={data.overview.totalStudents} />
        <ParentOverview parentCount={data.overview.totalParents} parentLinks={data.parentLinks} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <RoleManagementSnapshot roles={data.roles} />
        <AISystemStatus aiConfig={data.aiConfig} interactions={data.aiInteractions} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <RecentActivityFeed activities={data.activities} />
        <SystemHealthIndicators health={data.health} />
      </section>
    </AdminDashboardLayout>
  );
}

function Fallback() {
  return (
    <AdminDashboardLayout>
      <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    </AdminDashboardLayout>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminHomeContent />
    </Suspense>
  );
}
