"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type GrowthTimelineInput = { student_id: string };

export type GrowthTimelineJSON = {
  student_id: string;
  milestones: Array<{ week: number; title: string; description: string; date: string }>;
  skill_progression: {
    html: number[];
    css: number[];
    javascript: number[];
    nextjs: number[];
    supabase: number[];
    threejs: number[];
    git: number[];
    apis: number[];
  };
  project_evolution: Array<{ week: number; summary: string; completed_tasks: number; total_tasks: number }>;
  achievements: Array<{ name: string; date: string }>;
  growth_moments: Array<{ week: number; moment: string; insight: string }>;
};

export type GrowthTimelineResult = { ok: boolean; timeline: GrowthTimelineJSON | null; error: string | null };
type TimelineSection = "full" | "milestones" | "skills" | "growth_moments";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function scoreArray(value: unknown) {
  const values = Array.isArray(value) ? value.map(number).map((item) => Math.min(100, item)).slice(0, 12) : [];
  return values.length > 0 ? values : Array.from({ length: 12 }, () => 0);
}

function milestone(value: unknown, index: number) {
  const record = isRecord(value) ? value : {};
  return {
    week: number(record.week) || index + 1,
    title: typeof record.title === "string" ? record.title : `Week ${index + 1} milestone`,
    description: typeof record.description === "string" ? record.description : "",
    date: typeof record.date === "string" ? record.date : new Date().toISOString().slice(0, 10),
  };
}

function projectEvolution(value: unknown, index: number) {
  const record = isRecord(value) ? value : {};
  return {
    week: number(record.week) || index + 1,
    summary: typeof record.summary === "string" ? record.summary : "",
    completed_tasks: number(record.completed_tasks),
    total_tasks: number(record.total_tasks),
  };
}

function achievement(value: unknown) {
  const record = isRecord(value) ? value : {};
  return {
    name: typeof record.name === "string" ? record.name : "Achievement",
    date: typeof record.date === "string" ? record.date : new Date().toISOString().slice(0, 10),
  };
}

function growthMoment(value: unknown, index: number) {
  const record = isRecord(value) ? value : {};
  return {
    week: number(record.week) || index + 1,
    moment: typeof record.moment === "string" ? record.moment : "A growth moment",
    insight: typeof record.insight === "string" ? record.insight : "",
  };
}

function normalizeTimeline(value: unknown, input: GrowthTimelineInput): GrowthTimelineJSON {
  const record = isRecord(value) ? value : {};
  const skills = isRecord(record.skill_progression) ? record.skill_progression : {};
  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    milestones: Array.isArray(record.milestones) ? record.milestones.map(milestone) : [],
    skill_progression: {
      html: scoreArray(skills.html),
      css: scoreArray(skills.css),
      javascript: scoreArray(skills.javascript),
      nextjs: scoreArray(skills.nextjs),
      supabase: scoreArray(skills.supabase),
      threejs: scoreArray(skills.threejs),
      git: scoreArray(skills.git),
      apis: scoreArray(skills.apis),
    },
    project_evolution: Array.isArray(record.project_evolution) ? record.project_evolution.map(projectEvolution) : [],
    achievements: Array.isArray(record.achievements) ? record.achievements.map(achievement) : [],
    growth_moments: Array.isArray(record.growth_moments) ? record.growth_moments.map(growthMoment) : [],
  };
}

async function fetchTimelineContext(input: GrowthTimelineInput) {
  const supabase = createClient(await cookies());
  const [aiConfig, student, lessons, quizzes, sessions, streaks, projects, achievements, analytics, mentor] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("students").select("*").eq("id", input.student_id).maybeSingle(),
    supabase.from("lesson_progress").select("*").eq("student_id", input.student_id).order("updated_at"),
    supabase.from("quiz_results").select("*").eq("student_id", input.student_id).order("created_at"),
    supabase.from("session_logs").select("*").eq("student_id", input.student_id).order("session_started_at"),
    supabase.from("streaks").select("*").eq("student_id", input.student_id),
    supabase.from("student_projects").select("*, project_tasks(*)").eq("student_id", input.student_id).order("updated_at"),
    supabase.from("student_achievements").select("*, achievements(*)").eq("student_id", input.student_id).order("awarded_at"),
    supabase.from("analytics_snapshots").select("*").eq("student_id", input.student_id).order("generated_at"),
    supabase.from("ai_interactions").select("*").eq("student_id", input.student_id).order("created_at").limit(200),
  ]);

  return {
    aiConfig: (aiConfig.data ?? {}) as Record<string, unknown>,
    data: {
      student: student.data,
      lesson_progress: lessons.data ?? [],
      quiz_results: quizzes.data ?? [],
      session_logs: sessions.data ?? [],
      streaks: streaks.data ?? [],
      student_projects: projects.data ?? [],
      achievements: achievements.data ?? [],
      analytics_snapshots: analytics.data ?? [],
      mentor_interactions: mentor.data ?? [],
    },
  };
}

function buildPrompt(input: GrowthTimelineInput, context: Awaited<ReturnType<typeof fetchTimelineContext>>, section: TimelineSection) {
  const outputFormat = {
    student_id: "string",
    milestones: [{ week: 1, title: "string", description: "string", date: "string" }],
    skill_progression: { html: [0], css: [0], javascript: [0], nextjs: [0], supabase: [0], threejs: [0], git: [0], apis: [0] },
    project_evolution: [{ week: 1, summary: "string", completed_tasks: 0, total_tasks: 0 }],
    achievements: [{ name: "string", date: "string" }],
    growth_moments: [{ week: 1, moment: "string", insight: "string" }],
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "review",
    module_id: "growth-timeline",
    lesson_id: null,
    project_id: null,
    student_message: [
      `Generate ${section} student growth timeline JSON across all 12 weeks.`,
      "Growth moments tone: emotionally intelligent, supportive.",
      "Milestones tone: clear, celebratory.",
      "Skill progression tone: structured, visual.",
      "Project evolution tone: practical, encouraging.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].join("\n"),
    code_snippet: JSON.stringify(context.data),
    ai_config: context.aiConfig,
    module_context: null,
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
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate student growth timeline JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty growth timeline");
  return JSON.parse(content) as unknown;
}

export async function generateGrowthTimeline(input: GrowthTimelineInput): Promise<GrowthTimelineResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    const context = await fetchTimelineContext(input);
    const raw = await callLlm(buildPrompt(input, context, "full"), context.aiConfig);
    return { ok: true, timeline: normalizeTimeline(raw, input), error: null };
  } catch (error) {
    return { ok: false, timeline: null, error: error instanceof Error ? error.message : "Unable to generate growth timeline" };
  }
}

export async function generateGrowthTimelineSection(input: GrowthTimelineInput, section: Exclude<TimelineSection, "full">): Promise<GrowthTimelineJSON> {
  const context = await fetchTimelineContext(input);
  const raw = await callLlm(buildPrompt(input, context, section), context.aiConfig);
  return normalizeTimeline(raw, input);
}
