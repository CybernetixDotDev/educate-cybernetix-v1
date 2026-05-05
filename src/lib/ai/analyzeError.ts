"use server";

import { compilePrompt } from "@/lib/ai/compilePrompt";
import { getModel } from "@/lib/ai/getModel";
import { callJsonLLM } from "@/lib/ai/provider";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type ErrorCategory = "syntax" | "runtime" | "logic" | "api" | "auth" | "network";

export type DebuggerInput = {
  student_id: string;
  project_id?: string | null;
  module_id?: string | null;
  code: string;
  error_message: string;
};

export type DebugAnalysis = {
  root_cause: string;
  explanation: string;
  likely_file: string | null;
  likely_line: number | null;
  error_category: ErrorCategory;
};

export type AnalyzeErrorResult = {
  ok: boolean;
  analysis: DebugAnalysis | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCategory(value: unknown): ErrorCategory {
  if (value === "syntax" || value === "logic" || value === "api" || value === "auth" || value === "network") return value;
  return "runtime";
}

function normalizeAnalysis(value: unknown): DebugAnalysis {
  const record = isRecord(value) ? value : {};

  return {
    root_cause: typeof record.root_cause === "string" ? record.root_cause : "The exact root cause needs more context.",
    explanation: typeof record.explanation === "string" ? record.explanation : "Review the error message and isolate the failing line.",
    likely_file: typeof record.likely_file === "string" ? record.likely_file : null,
    likely_line: Number.isFinite(Number(record.likely_line)) ? Number(record.likely_line) : null,
    error_category: normalizeCategory(record.error_category),
  };
}

async function fetchDebugContext(input: DebuggerInput) {
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

function buildPrompt(input: DebuggerInput, context: Awaited<ReturnType<typeof fetchDebugContext>>) {
  const outputFormat = {
    root_cause: "string",
    explanation: "string",
    likely_file: "string | null",
    likely_line: "number | null",
    error_category: "syntax | runtime | logic | api | auth | network",
  };

  return compilePrompt({
    student_id: input.student_id,
    mode: "builder",
    module_id: input.module_id ?? "debugger",
    lesson_id: null,
    project_id: input.project_id ?? null,
    student_message: [
      "Analyze this student code error.",
      "Debugging tone: calm, clear, structured.",
      "Explanation tone: beginner-friendly.",
      "Identify the root cause, likely file, likely line, and category.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
      `Error message:\n${input.error_message}`,
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


export async function analyzeError(input: DebuggerInput): Promise<AnalyzeErrorResult> {
  try {
    if (!input.student_id) throw new Error("student_id is required");
    if (!input.code.trim()) throw new Error("code is required");
    if (!input.error_message.trim()) throw new Error("error_message is required");

    const context = await fetchDebugContext(input);
    const model = await getModel("json", context.aiConfig);
    const raw = await callJsonLLM(model, buildPrompt(input, context));
    return { ok: true, analysis: normalizeAnalysis(raw), error: null };
  } catch (error) {
    return { ok: false, analysis: null, error: error instanceof Error ? error.message : "Unable to analyze error" };
  }
}
