"use server";

import { callJsonLLM } from "@/lib/ai/provider";
import { getModel } from "@/lib/ai/getModel";
import { requireRole } from "@/lib/auth/roles";
import { TASK_VERIFICATION_AGENT_SYSTEM } from "@/lib/lesson-studio/agentPrompts";
import type { LessonStudioActionResult, TaskVerificationInput, TaskVerificationResult } from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeVerification(value: unknown): TaskVerificationResult {
  const record = isRecord(value) ? value : {};
  const status = record.status === "pass" ? "pass" : "needs_revision";

  return {
    status,
    reason: stringValue(record.reason),
    feedback: stringValue(record.feedback),
    next_step: stringValue(record.next_step),
    hint: stringValue(record.hint),
  };
}

function hasEvidence(input: TaskVerificationInput) {
  const evidence = input.submission;
  return Boolean(
    evidence.screenshot_url?.trim() ||
      evidence.uploaded_file_url?.trim() ||
      evidence.link?.trim() ||
      evidence.text_explanation?.trim(),
  );
}

export async function verifyTaskSubmission(
  input: TaskVerificationInput,
): Promise<LessonStudioActionResult<TaskVerificationResult>> {
  const role = await requireRole(["student", "admin"]);
  if (!role) return { ok: false, data: null, error: "Student or admin access is required." };

  if (!input.lesson_title.trim() || !input.task_title.trim()) {
    return { ok: false, data: null, error: "Lesson title and task title are required." };
  }

  if (input.task_verification_criteria.length === 0) {
    return { ok: false, data: null, error: "Task verification criteria are required." };
  }

  if (!hasEvidence(input)) {
    return { ok: false, data: null, error: "Add a screenshot, file, link, or text explanation before verification." };
  }

  try {
    const supabase = createClient(await cookies());
    const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
      supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
      supabase.from("ai_module_context").select("*").eq("module_key", "lesson-studio").maybeSingle(),
    ]);
    const model = await getModel("json", aiConfig ?? {});
    const prompt = [
      "Verify this student task submission.",
      "Compare the evidence only against the Task Verification Criteria.",
      "Return only the required JSON object.",
      "",
      "GLOBAL AI CONFIG:",
      JSON.stringify(aiConfig ?? {}, null, 2),
      "",
      "LESSON STUDIO CONTEXT:",
      JSON.stringify(moduleContext ?? {}, null, 2),
      "",
      "TASK:",
      JSON.stringify(
        {
          lesson_title: input.lesson_title,
          task_title: input.task_title,
          task_instructions: input.task_instructions,
          task_verification_criteria: input.task_verification_criteria,
        },
        null,
        2,
      ),
      "",
      "STUDENT SUBMISSION EVIDENCE:",
      JSON.stringify(input.submission, null, 2),
    ].join("\n");

    const raw = await callJsonLLM<unknown>(model, prompt, {
      system: TASK_VERIFICATION_AGENT_SYSTEM,
      temperature: 0.15,
      metadata: { system: "task-verification-agent", lesson_title: input.lesson_title },
    });

    return { ok: true, data: normalizeVerification(raw), error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Task verification failed.",
    };
  }
}
