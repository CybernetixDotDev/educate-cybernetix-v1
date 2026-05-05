"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { DebugAnalysis, ErrorCategory } from "./analyzeError";
import type { DebugFix } from "./generateFix";

export type DebugSessionJSON = {
  student_id: string;
  project_id: string | null;
  code: string;
  error_message: string;
  analysis: {
    root_cause: string;
    likely_file: string | null;
    likely_line: number | null;
    error_category: ErrorCategory;
  };
  fix: DebugFix;
  patch_diff: string;
  created_at: string;
};

export type SaveDebugSessionResult = {
  ok: boolean;
  error: string | null;
};

function validate(session: DebugSessionJSON) {
  const errors: string[] = [];
  if (!session.student_id) errors.push("student_id is required");
  if (!session.code.trim()) errors.push("code is required");
  if (!session.error_message.trim()) errors.push("error_message is required");
  if (!session.analysis.root_cause.trim()) errors.push("analysis.root_cause is required");
  if (!session.fix.corrected_code.trim()) errors.push("fix.corrected_code is required");
  return errors;
}

export async function saveDebugSession(session: DebugSessionJSON): Promise<SaveDebugSessionResult> {
  const errors = validate(session);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("debug_sessions").insert({
    student_id: session.student_id,
    project_id: session.project_id,
    code: session.code,
    error_message: session.error_message,
    analysis: session.analysis,
    fix: session.fix,
    patch_diff: session.patch_diff,
    created_at: session.created_at,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/debugger");
  return { ok: true, error: null };
}

export async function buildDebugSession(
  input: {
    student_id: string;
    project_id?: string | null;
    code: string;
    error_message: string;
  },
  analysis: DebugAnalysis,
  fix: DebugFix,
  patchDiff: string,
): Promise<DebugSessionJSON> {
  return {
    student_id: input.student_id,
    project_id: input.project_id ?? null,
    code: input.code,
    error_message: input.error_message,
    analysis: {
      root_cause: analysis.root_cause,
      likely_file: analysis.likely_file,
      likely_line: analysis.likely_line,
      error_category: analysis.error_category,
    },
    fix,
    patch_diff: patchDiff,
    created_at: new Date().toISOString(),
  };
}
