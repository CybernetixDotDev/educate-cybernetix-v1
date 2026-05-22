"use server";

import type { CheckpointType, HandsOnTaskRequirement, LessonBlueprintSummary, LessonBrief, LessonStudioActionResult } from "@/lib/lesson-studio/types";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const DEFAULT_FINAL_REQUIREMENTS = {
  required_uploads: ["screenshot", "link"] as CheckpointType[],
  submission_checklist: [] as string[],
  stretch_goals: [] as string[],
  completion_criteria: [] as string[],
  micro_survey_questions: ["Do you want to continue?", "What was the most interesting thing you learned?"],
  ai_mentor_feedback_rules: [] as string[],
};

function cleanList(values: string[] = []) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function cleanCheckpointTypes(values: CheckpointType[] = []) {
  const allowed = new Set<CheckpointType>(["screenshot", "file", "link", "text"]);
  return values.filter((value, index): value is CheckpointType => allowed.has(value) && values.indexOf(value) === index);
}

function taskCheckpointTypes(task: HandsOnTaskRequirement) {
  return cleanCheckpointTypes(task.checkpoint_types?.length ? task.checkpoint_types : [task.checkpoint_type]);
}

function cleanTask(task: HandsOnTaskRequirement): HandsOnTaskRequirement {
  const checkpointTypes = taskCheckpointTypes(task);

  return {
    task_name: task.task_name.trim(),
    instruction: task.instruction.trim(),
    short_video_requirement: task.short_video_requirement.trim(),
    student_action: task.student_action.trim(),
    checkpoint_types: checkpointTypes.length > 0 ? checkpointTypes : ["screenshot"],
    checkpoint_type: checkpointTypes[0] ?? "screenshot",
    ai_verification_criteria: cleanList(task.ai_verification_criteria),
    ai_mentor_guidance: task.ai_mentor_guidance.trim(),
    expected_output: task.expected_output.trim(),
    difficulty_level: task.difficulty_level,
  };
}

function validateBrief(brief: LessonBrief) {
  const errors: string[] = [];
  const finalRequirements = brief.final_project_submission_requirements ?? DEFAULT_FINAL_REQUIREMENTS;

  if (!brief.lesson_title.trim()) errors.push("Lesson title is required.");
  if (!brief.age_range.trim()) errors.push("Age range is required.");
  if (!brief.subject_area.trim()) errors.push("Subject area is required.");
  if (cleanList(brief.learning_objectives).length === 0) errors.push("Add at least one learning objective.");
  if (!brief.required_project_outcome.trim()) errors.push("Required project outcome is required.");
  if (brief.hands_on_task_requirements.length < 5 || brief.hands_on_task_requirements.length > 7) {
    errors.push("Hands-on task requirements must include 5 to 7 tasks.");
  }
  brief.hands_on_task_requirements.forEach((task, index) => {
    if (!task.task_name.trim()) errors.push(`Task ${index + 1} needs a task name.`);
    if (!task.instruction.trim()) errors.push(`Task ${index + 1} needs an instruction.`);
    if (!task.short_video_requirement.trim()) errors.push(`Task ${index + 1} needs a short video requirement.`);
    if (!task.student_action.trim()) errors.push(`Task ${index + 1} needs a student action.`);
    if (taskCheckpointTypes(task).length === 0) errors.push(`Task ${index + 1} needs at least one checkpoint type.`);
    if (cleanList(task.ai_verification_criteria).length === 0) errors.push(`Task ${index + 1} needs AI verification criteria.`);
    if (!task.ai_mentor_guidance.trim()) errors.push(`Task ${index + 1} needs AI Mentor guidance.`);
    if (!task.expected_output.trim()) errors.push(`Task ${index + 1} needs an expected output.`);
  });
  if (cleanList(brief.task_verification_criteria).length === 0) errors.push("Add at least one task verification criterion.");
  if (cleanList(finalRequirements.submission_checklist).length === 0) {
    errors.push("Add at least one final project submission checklist item.");
  }
  if (cleanList(finalRequirements.completion_criteria).length === 0) {
    errors.push("Add at least one final project completion criterion.");
  }
  if (cleanList(finalRequirements.micro_survey_questions).length < 2) {
    errors.push("Add the final project micro-survey questions.");
  }
  if (cleanList(finalRequirements.ai_mentor_feedback_rules).length === 0) {
    errors.push("Add at least one AI Mentor feedback rule.");
  }
  if (cleanList(brief.required_tools).length === 0) errors.push("Add at least one required tool or software item.");
  if (!brief.estimated_duration.trim()) errors.push("Estimated duration is required.");
  if (!brief.tone_style.trim()) errors.push("Tone/style is required.");
  if (!Number.isFinite(brief.quiz_question_count) || brief.quiz_question_count < 1) {
    errors.push("Quiz question count must be at least 1.");
  }

  return errors;
}

export async function saveLessonBlueprint(
  brief: LessonBrief,
  blueprintId?: string | null,
): Promise<LessonStudioActionResult<LessonBlueprintSummary>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const errors = validateBrief(brief);
  if (errors.length > 0) return { ok: false, data: null, error: errors.join(" ") };
  const finalRequirements = brief.final_project_submission_requirements ?? DEFAULT_FINAL_REQUIREMENTS;

  const cleanedBrief: LessonBrief = {
    ...brief,
    lesson_title: brief.lesson_title.trim(),
    age_range: brief.age_range.trim(),
    subject_area: brief.subject_area.trim(),
    learning_objectives: cleanList(brief.learning_objectives),
    required_project_outcome: brief.required_project_outcome.trim(),
    hands_on_task_requirements: brief.hands_on_task_requirements.map(cleanTask),
    task_verification_criteria: cleanList(brief.task_verification_criteria),
    final_project_submission_requirements: {
      required_uploads: cleanCheckpointTypes(finalRequirements.required_uploads),
      submission_checklist: cleanList(finalRequirements.submission_checklist),
      stretch_goals: cleanList(finalRequirements.stretch_goals),
      completion_criteria: cleanList(finalRequirements.completion_criteria),
      micro_survey_questions: cleanList(finalRequirements.micro_survey_questions),
      ai_mentor_feedback_rules: cleanList(finalRequirements.ai_mentor_feedback_rules),
    },
    required_tools: cleanList(brief.required_tools),
    estimated_duration: brief.estimated_duration.trim(),
    tone_style: brief.tone_style.trim(),
    quiz_question_count: Math.max(1, Math.round(brief.quiz_question_count)),
    safety_constraints: cleanList(brief.safety_constraints),
    reference_notes: brief.reference_notes.trim(),
    example_assets: cleanList(brief.example_assets),
    branding_theme_tags: cleanList(brief.branding_theme_tags),
  };

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const userId = userResult.user?.id ?? null;

  const insertPayload = {
    title: cleanedBrief.lesson_title,
    brief_json: cleanedBrief,
    status: "draft",
    created_by: userId,
    updated_at: new Date().toISOString(),
  };
  const updatePayload = {
    title: cleanedBrief.lesson_title,
    brief_json: cleanedBrief,
    status: "draft",
    updated_at: new Date().toISOString(),
  };

  const query = blueprintId
    ? supabase
        .from("lesson_blueprints")
        .update(updatePayload)
        .eq("id", blueprintId)
        .select("id,title,status,updated_at,brief_json")
        .single()
    : supabase
        .from("lesson_blueprints")
        .insert(insertPayload)
        .select("id,title,status,updated_at,brief_json")
        .single();

  const { data, error } = await query;
  if (error) return { ok: false, data: null, error: error.message };

  revalidatePath("/admin/ai-lesson-generator");

  return {
    ok: true,
    data: {
      id: data.id,
      title: data.title,
      status: data.status,
      updated_at: data.updated_at,
      brief: data.brief_json as LessonBrief,
    },
    error: null,
  };
}
