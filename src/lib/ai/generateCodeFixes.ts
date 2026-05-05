"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { CodeReview, CodeReviewInput } from "./reviewCode";

export type CodeReviewFix = {
  corrected_code: string;
  explanation: string;
  steps: string[];
};

export type GenerateCodeFixesResult = {
  ok: boolean;
  fix: CodeReviewFix | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeFix(value: unknown, code: string): CodeReviewFix {
  const record = isRecord(value) ? value : {};

  return {
    corrected_code: typeof record.corrected_code === "string" ? record.corrected_code : code,
    explanation: typeof record.explanation === "string" ? record.explanation : "Improve the code using the review notes.",
    steps: strings(record.steps).length > 0
      ? strings(record.steps)
      : ["Review the comments.", "Apply the smallest safe changes.", "Run the app again.", "Check behavior in the browser."],
  };
}

async function fetchFixContext(input: CodeReviewInput) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    input.module_id
      ? supabase.from("ai_module_context").select("*").eq("module_key", input.module_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    moduleContext: (moduleContext ?? null) as Record<string, unknown> | null,
  };
}

function buildPrompt(input: CodeReviewInput, review: CodeReview | null, context: Awaited<ReturnType<typeof fetchFixContext>>) {
  const outputFormat = {
    corrected_code: "string",
    explanation: "string",
    steps: ["string"],
  };

  return compileMentorPrompt({
    student_id: input.student_id,
    mode: "builder",
    module_id: input.module_id ?? "code-review",
    lesson_id: null,
    project_id: input.project_id ?? null,
    student_message: [
      "Generate improved code from this review.",
      "Keep fixes step-by-step, actionable, and beginner-friendly.",
      "Preserve the student's intent and avoid unnecessary rewrites.",
      `Known review: ${JSON.stringify(review ?? {})}`,
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].join("\n\n"),
    code_snippet: input.code,
    ai_config: context.aiConfig,
    module_context: context.moduleContext,
    progress: {
      lesson_progress: [],
      quiz_results: [],
      session_logs: [],
      streaks: [],
      student_projects: [],
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
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You improve beginner student code and return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned empty code fixes");
  return JSON.parse(content) as unknown;
}

export async function generateCodeFixes(input: CodeReviewInput, review: CodeReview | null): Promise<GenerateCodeFixesResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!input.code.trim()) throw new Error("code is required");

    const context = await fetchFixContext(input);
    const raw = await callLlm(buildPrompt(input, review, context), context.aiConfig);
    return { ok: true, fix: normalizeFix(raw, input.code), error: null };
  } catch (error) {
    return { ok: false, fix: null, error: error instanceof Error ? error.message : "Unable to generate code fixes" };
  }
}
