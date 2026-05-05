"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type ParentReportInput = {
  student_id: string;
  month: string;
};

export type ParentReportJSON = {
  student_id: string;
  month: string;
  engagement_summary: {
    minutes: number;
    days_active: number;
    streak: number;
    consistency_notes: string;
  };
  attendance: {
    sessions_attended: number;
    sessions_missed: number;
    notes: string;
  };
  skill_growth: {
    html: number;
    css: number;
    javascript: number;
    nextjs: number;
    supabase: number;
    threejs: number;
    git: number;
    apis: number;
    growth_notes: string;
  };
  quiz_performance: {
    average_score: number;
    strengths: string[];
    weaknesses: string[];
  };
  project_progress: {
    title: string;
    completed_tasks: number;
    total_tasks: number;
    notes: string;
  };
  mentor_interactions: {
    messages_sent: number;
    topics_discussed: string[];
    engagement_notes: string;
  };
  recommendations: string[];
  next_steps: string[];
};

export type ParentReportResult = {
  ok: boolean;
  report: ParentReportJSON | null;
  error: string | null;
};

type ParentReportSection = "full" | "engagement" | "skills" | "recommendations";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function score(value: unknown) {
  return Math.min(100, number(value));
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));
  return { start, end };
}

function normalizeReport(value: unknown, input: ParentReportInput): ParentReportJSON {
  const record = isRecord(value) ? value : {};
  const engagement = isRecord(record.engagement_summary) ? record.engagement_summary : {};
  const attendance = isRecord(record.attendance) ? record.attendance : {};
  const skill = isRecord(record.skill_growth) ? record.skill_growth : {};
  const quiz = isRecord(record.quiz_performance) ? record.quiz_performance : {};
  const project = isRecord(record.project_progress) ? record.project_progress : {};
  const mentor = isRecord(record.mentor_interactions) ? record.mentor_interactions : {};

  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    month: typeof record.month === "string" ? record.month : input.month,
    engagement_summary: {
      minutes: number(engagement.minutes),
      days_active: number(engagement.days_active),
      streak: number(engagement.streak),
      consistency_notes: typeof engagement.consistency_notes === "string" ? engagement.consistency_notes : "",
    },
    attendance: {
      sessions_attended: number(attendance.sessions_attended),
      sessions_missed: number(attendance.sessions_missed),
      notes: typeof attendance.notes === "string" ? attendance.notes : "",
    },
    skill_growth: {
      html: score(skill.html),
      css: score(skill.css),
      javascript: score(skill.javascript),
      nextjs: score(skill.nextjs),
      supabase: score(skill.supabase),
      threejs: score(skill.threejs),
      git: score(skill.git),
      apis: score(skill.apis),
      growth_notes: typeof skill.growth_notes === "string" ? skill.growth_notes : "",
    },
    quiz_performance: {
      average_score: score(quiz.average_score),
      strengths: strings(quiz.strengths),
      weaknesses: strings(quiz.weaknesses),
    },
    project_progress: {
      title: typeof project.title === "string" ? project.title : "No active project",
      completed_tasks: number(project.completed_tasks),
      total_tasks: number(project.total_tasks),
      notes: typeof project.notes === "string" ? project.notes : "",
    },
    mentor_interactions: {
      messages_sent: number(mentor.messages_sent),
      topics_discussed: strings(mentor.topics_discussed),
      engagement_notes: typeof mentor.engagement_notes === "string" ? mentor.engagement_notes : "",
    },
    recommendations: strings(record.recommendations),
    next_steps: strings(record.next_steps),
  };
}

async function fetchReportContext(input: ParentReportInput) {
  const supabase = createClient(await cookies());
  const { start, end } = monthRange(input.month);
  const [
    aiConfig,
    moduleContext,
    student,
    lessonProgress,
    quizResults,
    sessionLogs,
    streaks,
    projects,
    analytics,
    mentorInteractions,
  ] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").order("module_key").limit(12),
    supabase.from("students").select("*").eq("id", input.student_id).maybeSingle(),
    supabase.from("lesson_progress").select("*").eq("student_id", input.student_id).gte("updated_at", start.toISOString()).lte("updated_at", end.toISOString()),
    supabase.from("quiz_results").select("*").eq("student_id", input.student_id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
    supabase.from("session_logs").select("*").eq("student_id", input.student_id).gte("session_started_at", start.toISOString()).lte("session_started_at", end.toISOString()),
    supabase.from("streaks").select("*").eq("student_id", input.student_id),
    supabase.from("student_projects").select("*, project_tasks(*)").eq("student_id", input.student_id).order("updated_at", { ascending: false }).limit(3),
    supabase.from("analytics_snapshots").select("*").eq("student_id", input.student_id).gte("period_start", start.toISOString()).lte("period_end", end.toISOString()).limit(20),
    supabase.from("ai_interactions").select("*").eq("student_id", input.student_id).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()).limit(100),
  ]);

  return {
    aiConfig: (aiConfig.data ?? {}) as Record<string, unknown>,
    moduleContext: (moduleContext.data ?? []) as unknown[],
    data: {
      month: input.month,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      student: student.data,
      lesson_progress: lessonProgress.data ?? [],
      quiz_results: quizResults.data ?? [],
      session_logs: sessionLogs.data ?? [],
      streaks: streaks.data ?? [],
      student_projects: projects.data ?? [],
      analytics_snapshots: analytics.data ?? [],
      mentor_interactions: mentorInteractions.data ?? [],
    },
  };
}

function buildPrompt(input: ParentReportInput, context: Awaited<ReturnType<typeof fetchReportContext>>, section: ParentReportSection) {
  const outputFormat = {
    student_id: "string",
    month: "YYYY-MM",
    engagement_summary: { minutes: 0, days_active: 0, streak: 0, consistency_notes: "string" },
    attendance: { sessions_attended: 0, sessions_missed: 0, notes: "string" },
    skill_growth: { html: 0, css: 0, javascript: 0, nextjs: 0, supabase: 0, threejs: 0, git: 0, apis: 0, growth_notes: "string" },
    quiz_performance: { average_score: 0, strengths: ["string"], weaknesses: ["string"] },
    project_progress: { title: "string", completed_tasks: 0, total_tasks: 0, notes: "string" },
    mentor_interactions: { messages_sent: 0, topics_discussed: ["string"], engagement_notes: "string" },
    recommendations: ["string"],
    next_steps: ["string"],
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "review",
    module_id: "parent-monthly-report",
    lesson_id: null,
    project_id: null,
    student_message: [
      `Generate ${section} monthly parent report JSON.`,
      `Month: ${input.month}`,
      "Parent-facing tone: clear, supportive, professional.",
      "Recommendations: actionable, specific.",
      "Next steps: encouraging, structured.",
      "Use module context packs for relevant curriculum context.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].join("\n"),
    code_snippet: JSON.stringify(context.data),
    ai_config: context.aiConfig,
    module_context: { modules: context.moduleContext },
    progress: {
      lesson_progress: context.data.lesson_progress,
      quiz_results: context.data.quiz_results,
      session_logs: context.data.session_logs,
      streaks: context.data.streaks,
      student_projects: context.data.student_projects,
    },
  });
}

async function callLlm(prompt: string, aiConfig: Record<string, unknown>) {
  const apiKey = process.env.AI_PROVIDER_API_KEY ?? process.env.OPENAI_API_KEY;
  const endpoint = process.env.AI_PROVIDER_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = typeof aiConfig.model === "string" ? aiConfig.model : "gpt-4.1-mini";

  if (!apiKey) throw new Error("AI provider API key is not configured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate monthly parent report JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty parent report");
  return JSON.parse(content) as unknown;
}

export async function generateParentReport(input: ParentReportInput): Promise<ParentReportResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!/^\d{4}-\d{2}$/.test(input.month)) throw new Error("month must use YYYY-MM format");

    const context = await fetchReportContext(input);
    const raw = await callLlm(buildPrompt(input, context, "full"), context.aiConfig);
    return { ok: true, report: normalizeReport(raw, input), error: null };
  } catch (error) {
    return { ok: false, report: null, error: error instanceof Error ? error.message : "Unable to generate parent report" };
  }
}

export async function generateParentReportSection(input: ParentReportInput, section: Exclude<ParentReportSection, "full">): Promise<ParentReportJSON> {
  const context = await fetchReportContext(input);
  const raw = await callLlm(buildPrompt(input, context, section), context.aiConfig);
  return normalizeReport(raw, input);
}
