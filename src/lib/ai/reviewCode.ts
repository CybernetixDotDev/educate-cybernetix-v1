"use server";

import { compilePrompt } from "@/lib/ai/compilePrompt";
import { getModel } from "@/lib/ai/getModel";
import { callJsonLLM } from "@/lib/ai/provider";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type CodeReviewSeverity = "info" | "warning" | "error";

export type CodeReviewInput = {
  student_id: string;
  project_id?: string | null;
  module_id?: string | null;
  code: string;
};

export type InlineComment = {
  line: number;
  comment: string;
  severity: CodeReviewSeverity;
};

export type CodeReview = {
  inline_comments: InlineComment[];
  best_practices: string[];
  performance: string[];
  clarity: string[];
  security: string[];
  accessibility: string[];
  corrected_code: string;
};

export type ReviewCodeResult = {
  ok: boolean;
  review: CodeReview | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function severity(value: unknown): CodeReviewSeverity {
  if (value === "warning" || value === "error") return value;
  return "info";
}

function normalizeInlineComment(value: unknown): InlineComment {
  const record = isRecord(value) ? value : {};

  return {
    line: Number.isFinite(Number(record.line)) ? Math.max(1, Number(record.line)) : 1,
    comment: typeof record.comment === "string" ? record.comment : "Review this line for clarity.",
    severity: severity(record.severity),
  };
}

function normalizeReview(value: unknown, code: string): CodeReview {
  const record = isRecord(value) ? value : {};

  return {
    inline_comments: Array.isArray(record.inline_comments)
      ? record.inline_comments.map((comment) => normalizeInlineComment(comment))
      : [],
    best_practices: strings(record.best_practices),
    performance: strings(record.performance),
    clarity: strings(record.clarity),
    security: strings(record.security),
    accessibility: strings(record.accessibility),
    corrected_code: typeof record.corrected_code === "string" ? record.corrected_code : code,
  };
}

async function fetchReviewContext(input: CodeReviewInput) {
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

function buildPrompt(input: CodeReviewInput, context: Awaited<ReturnType<typeof fetchReviewContext>>) {
  const outputFormat = {
    inline_comments: [{ line: 1, comment: "string", severity: "info | warning | error" }],
    best_practices: ["string"],
    performance: ["string"],
    clarity: ["string"],
    security: ["string"],
    accessibility: ["string"],
    corrected_code: "string",
  };

  return compilePrompt({
    student_id: input.student_id,
    mode: "builder",
    module_id: input.module_id ?? "code-review",
    lesson_id: null,
    project_id: input.project_id ?? null,
    student_message: [
      "Review this student code for quality, maintainability, performance, accessibility, and security.",
      "Code review tone: constructive, clear, professional.",
      "Explanations: beginner-friendly.",
      "Fixes: step-by-step, actionable.",
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


export async function reviewCode(input: CodeReviewInput): Promise<ReviewCodeResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!input.code.trim()) throw new Error("code is required");

    const context = await fetchReviewContext(input);
    const model = await getModel("json", context.aiConfig);
    const raw = await callJsonLLM(model, buildPrompt(input, context));
    return { ok: true, review: normalizeReview(raw, input.code), error: null };
  } catch (error) {
    return { ok: false, review: null, error: error instanceof Error ? error.message : "Unable to review code" };
  }
}
