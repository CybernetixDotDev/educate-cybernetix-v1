"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type CoachingInput = {
  student_id: string;
  week_number: number;
};

export type CoachingPlanJSON = {
  student_id: string;
  week_number: number;
  weekly_plan: string[];
  daily_micro_tasks: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
  };
  skill_improvement: {
    strengths: string[];
    weaknesses: string[];
    recommended_focus: string[];
  };
  motivation: {
    message: string;
    affirmations: string[];
  };
  growth_insights: {
    engagement: string;
    mastery: string;
    project_progress: string;
  };
};

export type CoachingResult = {
  ok: boolean;
  plan: CoachingPlanJSON | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function dayTasks(value: unknown) {
  const record = isRecord(value) ? value : {};
  return {
    monday: strings(record.monday),
    tuesday: strings(record.tuesday),
    wednesday: strings(record.wednesday),
    thursday: strings(record.thursday),
    friday: strings(record.friday),
  };
}

function normalizePlan(value: unknown, input: CoachingInput): CoachingPlanJSON {
  const record = isRecord(value) ? value : {};
  const skill = isRecord(record.skill_improvement) ? record.skill_improvement : {};
  const motivation = isRecord(record.motivation) ? record.motivation : {};
  const insights = isRecord(record.growth_insights) ? record.growth_insights : {};

  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    week_number: Number(record.week_number ?? input.week_number),
    weekly_plan: strings(record.weekly_plan),
    daily_micro_tasks: dayTasks(record.daily_micro_tasks),
    skill_improvement: {
      strengths: strings(skill.strengths),
      weaknesses: strings(skill.weaknesses),
      recommended_focus: strings(skill.recommended_focus),
    },
    motivation: {
      message:
        typeof motivation.message === "string"
          ? motivation.message
          : "You are building real skills one focused session at a time.",
      affirmations: strings(motivation.affirmations),
    },
    growth_insights: {
      engagement: typeof insights.engagement === "string" ? insights.engagement : "Engagement data is still building.",
      mastery: typeof insights.mastery === "string" ? insights.mastery : "Mastery trends will improve with more quiz attempts.",
      project_progress:
        typeof insights.project_progress === "string" ? insights.project_progress : "Project progress will appear as tasks are completed.",
    },
  };
}

async function fetchCoachingContext(input: CoachingInput) {
  const supabase = createClient(await cookies());
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
    supabase.from("lesson_progress").select("*").eq("student_id", input.student_id).order("updated_at", { ascending: false }).limit(50),
    supabase.from("quiz_results").select("*").eq("student_id", input.student_id).order("created_at", { ascending: false }).limit(50),
    supabase.from("session_logs").select("*").eq("student_id", input.student_id).order("session_started_at", { ascending: false }).limit(50),
    supabase.from("streaks").select("*").eq("student_id", input.student_id),
    supabase.from("student_projects").select("*, project_tasks(*)").eq("student_id", input.student_id).order("updated_at", { ascending: false }).limit(3),
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
    },
  };
}

function buildPrompt(input: CoachingInput, context: Awaited<ReturnType<typeof fetchCoachingContext>>, section: "full" | "skills" | "micro_tasks" | "motivation") {
  const outputFormat = {
    student_id: "string",
    week_number: 1,
    weekly_plan: ["string"],
    daily_micro_tasks: { monday: ["string"], tuesday: ["string"], wednesday: ["string"], thursday: ["string"], friday: ["string"] },
    skill_improvement: { strengths: ["string"], weaknesses: ["string"], recommended_focus: ["string"] },
    motivation: { message: "string", affirmations: ["string"] },
    growth_insights: { engagement: "string", mastery: "string", project_progress: "string" },
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "review",
    module_id: `week${input.week_number}`,
    lesson_id: null,
    project_id: null,
    student_message: [
      `Generate ${section} student coaching plan JSON.`,
      `Week number: ${input.week_number}`,
      "Coaching tone: supportive, structured, actionable.",
      "Motivation tone: empowering, teen-friendly, emotionally intelligent.",
      "Use student progress, quiz mastery, engagement, streak, and project data.",
      "Return valid JSON only.",
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
        { role: "system", content: "You generate student coaching plan JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty coaching plan");
  return JSON.parse(content) as unknown;
}

export async function generateCoachingPlan(input: CoachingInput): Promise<CoachingResult> {
  try {
    const context = await fetchCoachingContext(input);
    const raw = await callLlm(buildPrompt(input, context, "full"), context.aiConfig);
    return { ok: true, plan: normalizePlan(raw, input), error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate coaching plan" };
  }
}

export async function generateCoachingSection(input: CoachingInput, section: "skills" | "micro_tasks" | "motivation") {
  const context = await fetchCoachingContext(input);
  const raw = await callLlm(buildPrompt(input, context, section), context.aiConfig);
  return normalizePlan(raw, input);
}
