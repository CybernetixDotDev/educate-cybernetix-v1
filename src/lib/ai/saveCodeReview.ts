"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { CodeReview } from "./reviewCode";
import type { CodeReviewFix } from "./generateCodeFixes";

export type CodeReviewSessionJSON = {
  student_id: string;
  project_id: string | null;
  code: string;
  review: Omit<CodeReview, "corrected_code">;
  fix: CodeReviewFix;
  patch_diff: string;
  created_at: string;
};

export type SaveCodeReviewResult = {
  ok: boolean;
  error: string | null;
};

function validate(session: CodeReviewSessionJSON) {
  const errors: string[] = [];
  if (!session.student_id) errors.push("student_id is required");
  if (!session.code.trim()) errors.push("code is required");
  if (!session.fix.corrected_code.trim()) errors.push("fix.corrected_code is required");
  return errors;
}

export async function saveCodeReview(session: CodeReviewSessionJSON): Promise<SaveCodeReviewResult> {
  const errors = validate(session);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("code_review_sessions").insert({
    student_id: session.student_id,
    project_id: session.project_id,
    code: session.code,
    review: session.review,
    fix: session.fix,
    patch_diff: session.patch_diff,
    created_at: session.created_at,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/code-review");
  return { ok: true, error: null };
}

export async function buildCodeReviewSession(
  input: { student_id: string; project_id?: string | null; code: string },
  review: CodeReview,
  fix: CodeReviewFix,
  patchDiff: string,
): Promise<CodeReviewSessionJSON> {
  return {
    student_id: input.student_id,
    project_id: input.project_id ?? null,
    code: input.code,
    review: {
      inline_comments: review.inline_comments,
      best_practices: review.best_practices,
      performance: review.performance,
      clarity: review.clarity,
      security: review.security,
      accessibility: review.accessibility,
    },
    fix,
    patch_diff: patchDiff,
    created_at: new Date().toISOString(),
  };
}
