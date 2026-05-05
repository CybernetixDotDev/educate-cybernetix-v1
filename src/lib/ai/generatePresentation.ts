"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type PresentationInput = {
  student_id: string;
  project_id: string;
};

export type SlideOutlineItem = {
  title: string;
  bullets: string[];
  visual_suggestions: string[];
};

export type ScriptItem = {
  slide: number;
  speaker_notes: string;
};

export type DemoWalkthroughItem = {
  step: number;
  action: string;
  explanation: string;
};

export type PresentationPlan = {
  student_id: string;
  project_id: string;
  slide_outline: SlideOutlineItem[];
  script: ScriptItem[];
  demo_walkthrough: DemoWalkthroughItem[];
  storytelling: {
    hook: string;
    problem: string;
    solution: string;
    impact: string;
  };
  delivery_coaching: {
    confidence: string[];
    voice: string[];
    pacing: string[];
    body_language: string[];
    timing: string[];
  };
  qa_prep: {
    questions: string[];
    answers: string[];
    fallback_strategies: string[];
  };
};

export type PresentationResult = {
  ok: boolean;
  plan: PresentationPlan | null;
  error: string | null;
};

type PresentationSection = "full" | "outline" | "script" | "demo" | "qa";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function slide(value: unknown, index: number): SlideOutlineItem {
  const record = isRecord(value) ? value : {};

  return {
    title: typeof record.title === "string" && record.title.trim() ? record.title : `Slide ${index + 1}`,
    bullets: strings(record.bullets),
    visual_suggestions: strings(record.visual_suggestions),
  };
}

function script(value: unknown, index: number): ScriptItem {
  const record = isRecord(value) ? value : {};

  return {
    slide: Number.isFinite(Number(record.slide)) ? Number(record.slide) : index + 1,
    speaker_notes: typeof record.speaker_notes === "string" ? record.speaker_notes : "",
  };
}

function demoStep(value: unknown, index: number): DemoWalkthroughItem {
  const record = isRecord(value) ? value : {};

  return {
    step: Number.isFinite(Number(record.step)) ? Number(record.step) : index + 1,
    action: typeof record.action === "string" ? record.action : "Show the next feature.",
    explanation: typeof record.explanation === "string" ? record.explanation : "Explain why this part matters.",
  };
}

function normalizePlan(value: unknown, input: PresentationInput): PresentationPlan {
  const record = isRecord(value) ? value : {};
  const storytelling = isRecord(record.storytelling) ? record.storytelling : {};
  const delivery = isRecord(record.delivery_coaching) ? record.delivery_coaching : {};
  const qa = isRecord(record.qa_prep) ? record.qa_prep : {};

  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    project_id: typeof record.project_id === "string" ? record.project_id : input.project_id,
    slide_outline: Array.isArray(record.slide_outline) ? record.slide_outline.map(slide) : [],
    script: Array.isArray(record.script) ? record.script.map(script) : [],
    demo_walkthrough: Array.isArray(record.demo_walkthrough) ? record.demo_walkthrough.map(demoStep) : [],
    storytelling: {
      hook: typeof storytelling.hook === "string" ? storytelling.hook : "",
      problem: typeof storytelling.problem === "string" ? storytelling.problem : "",
      solution: typeof storytelling.solution === "string" ? storytelling.solution : "",
      impact: typeof storytelling.impact === "string" ? storytelling.impact : "",
    },
    delivery_coaching: {
      confidence: strings(delivery.confidence),
      voice: strings(delivery.voice),
      pacing: strings(delivery.pacing),
      body_language: strings(delivery.body_language),
      timing: strings(delivery.timing),
    },
    qa_prep: {
      questions: strings(qa.questions),
      answers: strings(qa.answers),
      fallback_strategies: strings(qa.fallback_strategies),
    },
  };
}

async function fetchPresentationContext(input: PresentationInput) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: project }, { data: analytics }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("student_projects").select("*, project_tasks(*)").eq("id", input.project_id).eq("student_id", input.student_id).maybeSingle(),
    supabase.from("analytics_snapshots").select("*").eq("student_id", input.student_id).order("generated_at", { ascending: false }).limit(10),
  ]);

  return {
    aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    project: (project ?? null) as Record<string, unknown> | null,
    analytics: analytics ?? [],
  };
}

function buildPrompt(input: PresentationInput, context: Awaited<ReturnType<typeof fetchPresentationContext>>, section: PresentationSection) {
  const outputFormat = {
    student_id: "string",
    project_id: "string",
    slide_outline: [{ title: "string", bullets: ["string"], visual_suggestions: ["string"] }],
    script: [{ slide: 1, speaker_notes: "string" }],
    demo_walkthrough: [{ step: 1, action: "string", explanation: "string" }],
    storytelling: { hook: "string", problem: "string", solution: "string", impact: "string" },
    delivery_coaching: {
      confidence: ["string"],
      voice: ["string"],
      pacing: ["string"],
      body_language: ["string"],
      timing: ["string"],
    },
    qa_prep: {
      questions: ["string"],
      answers: ["string"],
      fallback_strategies: ["string"],
    },
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "builder",
    module_id: "presentation-coach",
    lesson_id: null,
    project_id: input.project_id,
    student_message: [
      `Generate ${section} presentation coaching JSON for this student project.`,
      "Presentation tone: confident, clear, inspiring.",
      "Script tone: conversational, teen-friendly.",
      "Delivery tone: supportive, empowering.",
      "Use the project data, project tasks/progress, and analytics for strengths and mastery.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
      `Project data: ${JSON.stringify(context.project ?? {})}`,
      `Analytics: ${JSON.stringify(context.analytics)}`,
    ].join("\n\n"),
    code_snippet: null,
    ai_config: context.aiConfig,
    module_context: null,
    progress: {
      lesson_progress: [],
      quiz_results: [],
      session_logs: [],
      streaks: [],
      student_projects: context.project ? [context.project] : [],
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
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate project presentation coaching JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty presentation plan");
  return JSON.parse(content) as unknown;
}

export async function generatePresentation(input: PresentationInput): Promise<PresentationResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!input.project_id) throw new Error("project_id is required");

    const context = await fetchPresentationContext(input);
    const raw = await callLlm(buildPrompt(input, context, "full"), context.aiConfig);
    return { ok: true, plan: normalizePlan(raw, input), error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate presentation" };
  }
}

export async function generatePresentationSection(input: PresentationInput, section: Exclude<PresentationSection, "full">): Promise<PresentationPlan> {
  const context = await fetchPresentationContext(input);
  const raw = await callLlm(buildPrompt(input, context, section), context.aiConfig);
  return normalizePlan(raw, input);
}
