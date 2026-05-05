"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type CertificateInput = {
  student_id: string;
  project_id: string;
};

export type CertificateJSON = {
  student_id: string;
  project_id: string;
  certificate_text: {
    title: string;
    subtitle: string;
    completion_date: string;
    mentor_signature: string;
  };
  skill_map: {
    html: number;
    css: number;
    javascript: number;
    nextjs: number;
    supabase: number;
    threejs: number;
    git: number;
    apis: number;
  };
  project_summary: {
    title: string;
    description: string;
    features: string[];
    tech_stack: string[];
    github_url: string;
    live_url: string;
  };
  achievement_badges: Array<{
    name: string;
    description: string;
  }>;
  mentor_comments: string;
};

export type CertificateResult = {
  ok: boolean;
  certificate: CertificateJSON | null;
  error: string | null;
};

type CertificateSection = "full" | "skill_map" | "mentor_comments";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function score(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
}

function badge(value: unknown) {
  const record = isRecord(value) ? value : {};
  return {
    name: typeof record.name === "string" ? record.name : "Achievement",
    description: typeof record.description === "string" ? record.description : "Completed an important learning milestone.",
  };
}

function normalizeCertificate(value: unknown, input: CertificateInput): CertificateJSON {
  const record = isRecord(value) ? value : {};
  const text = isRecord(record.certificate_text) ? record.certificate_text : {};
  const skill = isRecord(record.skill_map) ? record.skill_map : {};
  const project = isRecord(record.project_summary) ? record.project_summary : {};

  return {
    student_id: typeof record.student_id === "string" ? record.student_id : input.student_id,
    project_id: typeof record.project_id === "string" ? record.project_id : input.project_id,
    certificate_text: {
      title: typeof text.title === "string" ? text.title : "Certificate of Completion",
      subtitle: typeof text.subtitle === "string" ? text.subtitle : "Educate Cybernetix Web Development Program",
      completion_date: typeof text.completion_date === "string" ? text.completion_date : new Date().toISOString().slice(0, 10),
      mentor_signature: typeof text.mentor_signature === "string" ? text.mentor_signature : "Educate Cybernetix AI Mentor",
    },
    skill_map: {
      html: score(skill.html),
      css: score(skill.css),
      javascript: score(skill.javascript),
      nextjs: score(skill.nextjs),
      supabase: score(skill.supabase),
      threejs: score(skill.threejs),
      git: score(skill.git),
      apis: score(skill.apis),
    },
    project_summary: {
      title: typeof project.title === "string" ? project.title : "Final Project",
      description: typeof project.description === "string" ? project.description : "",
      features: strings(project.features),
      tech_stack: strings(project.tech_stack),
      github_url: typeof project.github_url === "string" ? project.github_url : "",
      live_url: typeof project.live_url === "string" ? project.live_url : "",
    },
    achievement_badges: Array.isArray(record.achievement_badges) ? record.achievement_badges.map(badge) : [],
    mentor_comments: typeof record.mentor_comments === "string" ? record.mentor_comments : "",
  };
}

async function fetchCertificateContext(input: CertificateInput) {
  const supabase = createClient(await cookies());
  const [
    aiConfig,
    student,
    project,
    quizResults,
    analytics,
    streaks,
    achievements,
    sessions,
  ] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("students").select("*").eq("id", input.student_id).maybeSingle(),
    supabase.from("student_projects").select("*, project_tasks(*)").eq("id", input.project_id).eq("student_id", input.student_id).maybeSingle(),
    supabase.from("quiz_results").select("*").eq("student_id", input.student_id).order("created_at", { ascending: false }).limit(100),
    supabase.from("analytics_snapshots").select("*").eq("student_id", input.student_id).order("generated_at", { ascending: false }).limit(20),
    supabase.from("streaks").select("*").eq("student_id", input.student_id),
    supabase.from("student_achievements").select("*, achievements(*)").eq("student_id", input.student_id),
    supabase.from("session_logs").select("*").eq("student_id", input.student_id).order("session_started_at", { ascending: false }).limit(100),
  ]);

  return {
    aiConfig: (aiConfig.data ?? {}) as Record<string, unknown>,
    data: {
      student: student.data,
      project: project.data,
      quiz_results: quizResults.data ?? [],
      analytics: analytics.data ?? [],
      streaks: streaks.data ?? [],
      achievements: achievements.data ?? [],
      session_logs: sessions.data ?? [],
    },
  };
}

function buildPrompt(input: CertificateInput, context: Awaited<ReturnType<typeof fetchCertificateContext>>, section: CertificateSection) {
  const outputFormat = {
    student_id: "string",
    project_id: "string",
    certificate_text: {
      title: "string",
      subtitle: "string",
      completion_date: "string",
      mentor_signature: "string",
    },
    skill_map: {
      html: 0,
      css: 0,
      javascript: 0,
      nextjs: 0,
      supabase: 0,
      threejs: 0,
      git: 0,
      apis: 0,
    },
    project_summary: {
      title: "string",
      description: "string",
      features: ["string"],
      tech_stack: ["string"],
      github_url: "string",
      live_url: "string",
    },
    achievement_badges: [{ name: "string", description: "string" }],
    mentor_comments: "string",
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "review",
    module_id: "certificate-generator",
    lesson_id: null,
    project_id: input.project_id,
    student_message: [
      `Generate ${section} certificate JSON for Educate Cybernetix.`,
      "Certificate tone: formal, celebratory.",
      "Mentor comments tone: warm, supportive, personal.",
      "Skill map tone: clear, structured, evidence-based.",
      "Use student profile, project data, quiz mastery, engagement data, streaks, and achievements.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
      `Context: ${JSON.stringify(context.data)}`,
    ].join("\n\n"),
    code_snippet: null,
    ai_config: context.aiConfig,
    module_context: null,
    progress: {
      lesson_progress: [],
      quiz_results: context.data.quiz_results,
      session_logs: context.data.session_logs,
      streaks: context.data.streaks,
      student_projects: context.data.project ? [context.data.project] : [],
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
        { role: "system", content: "You generate completion certificate JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty certificate");
  return JSON.parse(content) as unknown;
}

export async function generateCertificate(input: CertificateInput): Promise<CertificateResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!input.project_id) throw new Error("project_id is required");

    const context = await fetchCertificateContext(input);
    const raw = await callLlm(buildPrompt(input, context, "full"), context.aiConfig);
    return { ok: true, certificate: normalizeCertificate(raw, input), error: null };
  } catch (error) {
    return { ok: false, certificate: null, error: error instanceof Error ? error.message : "Unable to generate certificate" };
  }
}

export async function generateCertificateSection(input: CertificateInput, section: Exclude<CertificateSection, "full">): Promise<CertificateJSON> {
  const context = await fetchCertificateContext(input);
  const raw = await callLlm(buildPrompt(input, context, section), context.aiConfig);
  return normalizeCertificate(raw, input);
}
