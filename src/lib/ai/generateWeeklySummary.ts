"use server";

import { compilePrompt } from "@/lib/ai/compilePrompt";
import { getModel } from "@/lib/ai/getModel";
import { callJsonLLM } from "@/lib/ai/provider";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type WeeklySummaryInput = {
  student_id: string;
  week_number: number;
};

export type WeeklySummaryJSON = {
  student_id: string;
  week_number: number;
  parent_summary: string;
  student_reflection: string;
  skill_insights: {
    strengths: string[];
    weaknesses: string[];
  };
  engagement: {
    minutes: number;
    streak: number;
    days_active: number;
  };
  project_update: {
    title: string;
    completed_tasks: number;
    total_tasks: number;
    notes: string;
  };
};

export type WeeklySummaryResult = {
  ok: boolean;
  summary: WeeklySummaryJSON | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function weekDateRange(weekNumber: number) {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const start = new Date(yearStart);
  start.setUTCDate(yearStart.getUTCDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

function normalizeSummary(value: unknown, input: WeeklySummaryInput): WeeklySummaryJSON {
  const record = isRecord(value) ? value : {};
  const skillInsights = isRecord(record.skill_insights) ? record.skill_insights : {};
  const engagement = isRecord(record.engagement) ? record.engagement : {};
  const projectUpdate = isRecord(record.project_update) ? record.project_update : {};

  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    week_number: Number(record.week_number ?? input.week_number),
    parent_summary:
      typeof record.parent_summary === "string"
        ? record.parent_summary
        : "This learner made steady progress this week. Encourage one short practice session and ask what they built.",
    student_reflection:
      typeof record.student_reflection === "string"
        ? record.student_reflection
        : "You made progress this week. Choose one thing you understand better now and one thing to try next.",
    skill_insights: {
      strengths: strings(skillInsights.strengths),
      weaknesses: strings(skillInsights.weaknesses),
    },
    engagement: {
      minutes: Number(engagement.minutes ?? 0),
      streak: Number(engagement.streak ?? 0),
      days_active: Number(engagement.days_active ?? 0),
    },
    project_update: {
      title: typeof projectUpdate.title === "string" ? projectUpdate.title : "No active project",
      completed_tasks: Number(projectUpdate.completed_tasks ?? 0),
      total_tasks: Number(projectUpdate.total_tasks ?? 0),
      notes: typeof projectUpdate.notes === "string" ? projectUpdate.notes : "Project updates will appear as work is completed.",
    },
  };
}

async function fetchSummaryContext(input: WeeklySummaryInput) {
  const supabase = createClient(await cookies());
  const { start, end } = weekDateRange(input.week_number);
  const moduleKey = `week${input.week_number}`;
  const [
    aiConfig,
    moduleContext,
    student,
    lessonProgress,
    quizResults,
    sessionLogs,
    streaks,
    projects,
  ] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").ilike("module_key", `${moduleKey}%`).limit(1).maybeSingle(),
    supabase.from("students").select("*").eq("id", input.student_id).maybeSingle(),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("student_id", input.student_id)
      .gte("updated_at", start.toISOString())
      .lte("updated_at", end.toISOString()),
    supabase
      .from("quiz_results")
      .select("*")
      .eq("student_id", input.student_id)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("session_logs")
      .select("*")
      .eq("student_id", input.student_id)
      .gte("session_started_at", start.toISOString())
      .lte("session_started_at", end.toISOString()),
    supabase.from("streaks").select("*").eq("student_id", input.student_id),
    supabase
      .from("student_projects")
      .select("*, project_tasks(*)")
      .eq("student_id", input.student_id)
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  return {
    aiConfig: (aiConfig.data ?? {}) as Record<string, unknown>,
    moduleContext: (moduleContext.data ?? null) as Record<string, unknown> | null,
    data: {
      student: student.data,
      lesson_progress: lessonProgress.data ?? [],
      quiz_results: quizResults.data ?? [],
      session_logs: sessionLogs.data ?? [],
      streaks: streaks.data ?? [],
      student_projects: projects.data ?? [],
      week_start: start.toISOString(),
      week_end: end.toISOString(),
    },
  };
}

function buildPrompt(
  input: WeeklySummaryInput,
  context: Awaited<ReturnType<typeof fetchSummaryContext>>,
  section: "full" | "parent" | "student",
) {
  const outputFormat = {
    student_id: "string",
    week_number: 1,
    parent_summary: "string",
    student_reflection: "string",
    skill_insights: { strengths: ["string"], weaknesses: ["string"] },
    engagement: { minutes: 0, streak: 0, days_active: 0 },
    project_update: { title: "string", completed_tasks: 0, total_tasks: 0, notes: "string" },
  };

  return compilePrompt({
    student_id: input.student_id,
    mode: "review",
    module_id: `week${input.week_number}`,
    lesson_id: null,
    project_id: null,
    student_message: [
      `Generate ${section} weekly summary JSON for Educate Cybernetix.`,
      `Week number: ${input.week_number}`,
      "Parent summary tone: supportive, clear, actionable.",
      "Student reflection tone: empowering, growth-oriented, emotionally intelligent.",
      "Use progress, quiz mastery, engagement, and project data. Return valid JSON only.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].join("\n"),
    code_snippet: JSON.stringify(context.data),
    ai_config: context.aiConfig,
    module_context: context.moduleContext,
    progress: {
      lesson_progress: context.data.lesson_progress,
      quiz_results: context.data.quiz_results,
      session_logs: context.data.session_logs,
      streaks: context.data.streaks,
      student_projects: context.data.student_projects,
    },
  });
}


export async function generateWeeklySummary(input: WeeklySummaryInput): Promise<WeeklySummaryResult> {
  try {
    const context = await fetchSummaryContext(input);
    const model = await getModel("json", context.aiConfig);
    const raw = await callJsonLLM(model, buildPrompt(input, context, "full"));
    return { ok: true, summary: normalizeSummary(raw, input), error: null };
  } catch (error) {
    return { ok: false, summary: null, error: error instanceof Error ? error.message : "Unable to generate summary" };
  }
}

export async function generateWeeklySummarySection(input: WeeklySummaryInput, section: "parent" | "student") {
  const context = await fetchSummaryContext(input);
  const model = await getModel("json", context.aiConfig);
    const raw = await callJsonLLM(model, buildPrompt(input, context, section));
  return normalizeSummary(raw, input);
}
