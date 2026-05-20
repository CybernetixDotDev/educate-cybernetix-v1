"use server";

import { callJsonLLM } from "@/lib/ai/provider";
import { getModel } from "@/lib/ai/getModel";
import { requireRole } from "@/lib/auth/roles";
import type { CoOpActionResult, CoOpFinalSubmission, CoOpProgress, CoOpSubmissionEvidence, CoOpTaskSubmission } from "@/lib/learning/coOpTypes";
import type { LessonFinalSubmission, LessonTask } from "@/lib/lessons/getLesson";
import { verifyTaskSubmission } from "@/lib/lesson-studio/verifyTaskSubmission";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function hasEvidence(evidence: CoOpSubmissionEvidence) {
  return Boolean(
    evidence.screenshot_url?.trim() ||
      evidence.uploaded_file_url?.trim() ||
      evidence.link?.trim() ||
      evidence.text_explanation?.trim(),
  );
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function currentStudent() {
  const role = await requireRole(["student", "admin"]);
  if (!role) throw new Error("Student access is required.");

  const supabase = createClient(await cookies());
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in is required.");

  const { data: student, error } = await supabase
    .from("students")
    .select("id, user_id, display_name")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!student?.id) throw new Error("Student profile was not found.");

  return { supabase, studentId: String(student.id), userId: userResult.user.id };
}

function normalizeFinalReview(value: unknown) {
  const record = isRecord(value) ? value : {};
  const status = record.status === "pass" ? "pass" : "needs_revision";

  return {
    status,
    feedback: stringValue(record.feedback, status === "pass" ? "Your lesson work is complete." : "Review the feedback and try one more update."),
    next_step: stringValue(record.next_step, status === "pass" ? "Move to the next lesson." : "Update the missing checkpoints and resubmit."),
    completion_awarded: typeof record.completion_awarded === "boolean" ? record.completion_awarded : status === "pass",
    unlock_next: typeof record.unlock_next === "boolean" ? record.unlock_next : status === "pass",
  };
}

async function mentorFinalReview(input: {
  lessonTitle: string;
  tasks: LessonTask[];
  taskSubmissions: CoOpTaskSubmission[];
  finalSubmission: LessonFinalSubmission;
  projectSubmission: CoOpSubmissionEvidence;
  microSurvey: Record<string, string>;
}) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").eq("module_key", "lesson-studio").maybeSingle(),
  ]);
  const model = await getModel("json", aiConfig ?? {});
  const raw = await callJsonLLM<unknown>(
    model,
    [
      "You are Cyber Mentor giving a final co-op review.",
      "Review all checkpoint verification results, the final project submission, and the micro-survey.",
      "Award completion only if all required checkpoints passed and the final project evidence is clear.",
      "Return JSON only with this shape:",
      JSON.stringify({
        status: "pass | needs_revision",
        feedback: "supportive feedback for the student",
        next_step: "one clear next action",
        completion_awarded: true,
        unlock_next: true,
      }),
      "",
      "Lesson:",
      input.lessonTitle,
      "",
      "Lesson studio context:",
      JSON.stringify(moduleContext ?? {}, null, 2),
      "",
      "Final review rules:",
      JSON.stringify(input.finalSubmission.ai_mentor_final_review, null, 2),
      "",
      "Required checkpoints:",
      JSON.stringify(input.finalSubmission.required_task_checkpoints, null, 2),
      "",
      "Tasks:",
      JSON.stringify(input.tasks, null, 2),
      "",
      "Checkpoint submissions:",
      JSON.stringify(input.taskSubmissions, null, 2),
      "",
      "Final project submission:",
      JSON.stringify(input.projectSubmission, null, 2),
      "",
      "Micro-survey:",
      JSON.stringify(input.microSurvey, null, 2),
    ].join("\n"),
    {
      system: "You are Cyber Mentor, a warm teen-friendly coach. Be clear, supportive, and practical. Never shame the student.",
      temperature: 0.2,
      metadata: { system: "student-coop-final-review", lesson_title: input.lessonTitle },
    },
  );

  return normalizeFinalReview(raw);
}

export async function getCoOpProgress(moduleKey: string, lessonKey: string): Promise<CoOpActionResult<CoOpProgress>> {
  try {
    const { supabase, studentId } = await currentStudent();
    const [{ data: taskRows, error: taskError }, { data: finalRow, error: finalError }] = await Promise.all([
      supabase
        .from("lesson_task_submissions")
        .select("*")
        .eq("student_id", studentId)
        .eq("module_key", moduleKey)
        .eq("lesson_key", lessonKey)
        .order("created_at", { ascending: true }),
      supabase
        .from("lesson_final_submissions")
        .select("*")
        .eq("student_id", studentId)
        .eq("module_key", moduleKey)
        .eq("lesson_key", lessonKey)
        .maybeSingle(),
    ]);

    if (taskError) throw new Error(taskError.message);
    if (finalError) throw new Error(finalError.message);

    return {
      ok: true,
      data: {
        taskSubmissions: (taskRows ?? []) as CoOpTaskSubmission[],
        finalSubmission: (finalRow ?? null) as CoOpFinalSubmission | null,
      },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : "Unable to load co-op progress." };
  }
}

export async function submitTaskCheckpoint(input: {
  moduleKey: string;
  lessonKey: string;
  lessonTitle: string;
  task: LessonTask;
  evidence: CoOpSubmissionEvidence;
}): Promise<CoOpActionResult<CoOpTaskSubmission>> {
  try {
    if (!hasEvidence(input.evidence)) {
      return { ok: false, data: null, error: "Add a checkpoint screenshot, file, link, or note first." };
    }

    const verification = await verifyTaskSubmission({
      lesson_title: input.lessonTitle,
      task_title: input.task.title,
      task_instructions: `${input.task.instruction}\n\nAction: ${input.task.action}`,
      task_verification_criteria: input.task.ai_verification_criteria,
      submission: input.evidence,
    });

    if (!verification.ok || !verification.data) {
      return { ok: false, data: null, error: verification.error ?? "Verification failed." };
    }

    const { supabase, studentId } = await currentStudent();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("lesson_task_submissions")
      .upsert(
        {
          student_id: studentId,
          module_key: input.moduleKey,
          lesson_key: input.lessonKey,
          task_id: input.task.task_id,
          checkpoint_type: input.task.checkpoint_type,
          submission_json: input.evidence,
          verification_json: verification.data,
          status: verification.data.status,
          updated_at: now,
        },
        { onConflict: "student_id,module_key,lesson_key,task_id" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/learn/${input.moduleKey}/${input.lessonKey}`);
    return { ok: true, data: data as CoOpTaskSubmission, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : "Unable to submit checkpoint." };
  }
}

export async function submitFinalCoOp(input: {
  moduleKey: string;
  lessonKey: string;
  lessonTitle: string;
  tasks: LessonTask[];
  finalSubmission: LessonFinalSubmission;
  projectSubmission: CoOpSubmissionEvidence;
  microSurvey: Record<string, string>;
}): Promise<CoOpActionResult<CoOpFinalSubmission>> {
  try {
    if (!hasEvidence(input.projectSubmission)) {
      return { ok: false, data: null, error: "Add your final project evidence before asking Cyber Mentor for the final review." };
    }

    const { supabase, studentId } = await currentStudent();
    const { data: taskRows, error: taskError } = await supabase
      .from("lesson_task_submissions")
      .select("*")
      .eq("student_id", studentId)
      .eq("module_key", input.moduleKey)
      .eq("lesson_key", input.lessonKey);

    if (taskError) throw new Error(taskError.message);

    const taskSubmissions = (taskRows ?? []) as CoOpTaskSubmission[];
    const passedTaskIds = new Set(taskSubmissions.filter((row) => row.status === "pass").map((row) => row.task_id));
    const requiredIds = input.finalSubmission.required_task_checkpoints.length > 0
      ? input.finalSubmission.required_task_checkpoints
      : input.tasks.map((task) => task.task_id);
    const missing = requiredIds.filter((taskId) => !passedTaskIds.has(taskId));

    if (missing.length > 0) {
      return {
        ok: false,
        data: null,
        error: `Complete these checkpoints before final review: ${missing.join(", ")}`,
      };
    }

    const mentorReview = await mentorFinalReview({
      lessonTitle: input.lessonTitle,
      tasks: input.tasks,
      taskSubmissions,
      finalSubmission: input.finalSubmission,
      projectSubmission: input.projectSubmission,
      microSurvey: input.microSurvey,
    });
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("lesson_final_submissions")
      .upsert(
        {
          student_id: studentId,
          module_key: input.moduleKey,
          lesson_key: input.lessonKey,
          task_checkpoint_ids: requiredIds,
          project_submission_json: input.projectSubmission,
          micro_survey_json: input.microSurvey,
          mentor_review_json: mentorReview,
          status: mentorReview.status,
          updated_at: now,
        },
        { onConflict: "student_id,module_key,lesson_key" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (mentorReview.status === "pass") {
      await supabase.from("lesson_progress").upsert(
        {
          student_id: studentId,
          module_key: input.moduleKey,
          lesson_key: input.lessonKey,
          lesson_title: input.lessonTitle,
          status: "completed",
          progress_percent: 100,
          completed_steps: ["co_op_tasks", "final_project_submission", "mentor_final_review"],
          completed_at: now,
          started_at: now,
          metadata: {
            source: "student_co_op_lesson",
            final_submission_id: (data as CoOpFinalSubmission).id,
            mentor_review: mentorReview,
          },
          updated_at: now,
        },
        { onConflict: "student_id,module_key,lesson_key" },
      );
    }

    revalidatePath(`/learn/${input.moduleKey}/${input.lessonKey}`);
    revalidatePath("/dashboard");
    return { ok: true, data: data as CoOpFinalSubmission, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : "Unable to complete final review." };
  }
}
