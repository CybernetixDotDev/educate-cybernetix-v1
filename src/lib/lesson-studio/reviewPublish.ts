"use server";

import { requireRole } from "@/lib/auth/roles";
import { validateLessonJson, validateQuizJson, type CurriculumLessonJson, type CurriculumQuizJson } from "@/lib/curriculum/validateLessonJson";
import type {
  GeneratedQuizQuestion,
  LessonGeneratorOutput,
  LessonRender,
  LessonReviewStatus,
  LessonStoryboard,
  LessonStudioActionResult,
  PublishResult,
  PublishTarget,
} from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function quizAnswer(question: GeneratedQuizQuestion) {
  if (typeof question.answer === "number" && question.options) {
    return question.options[question.answer] ?? String(question.answer);
  }
  if (typeof question.answer === "boolean") return question.answer ? "True" : "False";
  return String(question.answer);
}

function quizOptions(question: GeneratedQuizQuestion) {
  if (question.type === "true_false") return ["True", "False"];
  return question.options && question.options.length > 0 ? question.options : [quizAnswer(question)];
}

function toCurriculumQuiz(lessonKey: string, lesson: LessonGeneratorOutput): CurriculumQuizJson {
  return {
    id: `${lessonKey}-quiz`,
    questions: lesson.quiz.questions.map((question) => ({
      question: question.question,
      options: quizOptions(question),
      answer: quizAnswer(question),
      explanation: question.explanation ?? `Correct answer: ${quizAnswer(question)}`,
    })),
  };
}

function toCurriculumLesson(target: PublishTarget, lesson: LessonGeneratorOutput, render?: LessonRender | null): CurriculumLessonJson {
  const content = lesson.lesson_blocks.length > 0
    ? lesson.lesson_blocks
    : [
        { type: "learning_goal" as const, value: lesson.objective.join("\n") },
        { type: "text" as const, title: "Hook", value: lesson.hook },
        { type: "example" as const, title: "Teaching Steps", value: lesson.teaching_steps.join("\n") },
        { type: "task" as const, title: lesson.build_task.title ?? "Build Task", value: lesson.build_task.instructions?.join("\n") ?? lesson.build_task.expected_outcome ?? "" },
        { type: "recap" as const, value: lesson.recap },
      ];
  const video = render?.mp4_url
    ? {
        type: "video" as const,
        title: "Cyber Mentor lesson video",
        value: render.mp4_url,
        url: render.mp4_url,
        provider: "lesson-renderer",
        thumbnail_url: render.thumbnail_url ?? undefined,
        transcript: render.transcript_url ?? lesson.transcript,
      }
    : undefined;

  return {
    id: target.lesson_key,
    module_id: target.module_key,
    title: lesson.build_task.title || target.lesson_key,
    description: lesson.hook,
    estimated_minutes: Math.max(10, Math.round(lesson.tasks.length * 8)),
    objectives: lesson.objective,
    ...(video ? { video } : {}),
    content,
    tasks: lesson.tasks,
    final_submission: lesson.final_submission,
    quiz: toCurriculumQuiz(target.lesson_key, lesson),
  };
}

async function nextVersion(supabase: ReturnType<typeof createClient>, table: "lesson_versions" | "quiz_versions", idField: "lesson_id" | "quiz_id", id: string) {
  const { data, error } = await supabase
    .from(table)
    .select("version_number")
    .eq(idField, id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.version_number ?? 0) + 1;
}

async function auditReview(
  supabase: ReturnType<typeof createClient>,
  status: LessonReviewStatus,
  generatedLessonId: string | null | undefined,
  storyboardId: string | null | undefined,
  note: string,
) {
  const { data: userResult } = await supabase.auth.getUser();
  await supabase.from("lesson_reviews").insert({
    generated_lesson_id: generatedLessonId ?? null,
    storyboard_id: storyboardId ?? null,
    status,
    note,
    created_by: userResult.user?.id ?? null,
  });
}

export async function saveReviewEdits(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  note = "Saved review edits",
): Promise<LessonStudioActionResult<{ lesson: LessonGeneratorOutput; storyboard: LessonStoryboard | null }>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const supabase = createClient(await cookies());

  if (lesson.generated_lesson_id) {
    const { error } = await supabase
      .from("generated_lessons")
      .update({ generated_json: lesson, updated_at: new Date().toISOString() })
      .eq("id", lesson.generated_lesson_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  if (storyboard?.storyboard_id) {
    const { error } = await supabase
      .from("lesson_storyboards")
      .update({ storyboard_json: storyboard, updated_at: new Date().toISOString() })
      .eq("id", storyboard.storyboard_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  await auditReview(supabase, "in_review", lesson.generated_lesson_id, storyboard?.storyboard_id, note);
  revalidatePath("/admin/ai-lesson-generator");

  return { ok: true, data: { lesson, storyboard }, error: null };
}

export async function setLessonReviewStatus(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  status: LessonReviewStatus,
  note = "",
): Promise<LessonStudioActionResult<{ status: LessonReviewStatus }>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const supabase = createClient(await cookies());
  if (lesson.generated_lesson_id) {
    const { error } = await supabase
      .from("generated_lessons")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", lesson.generated_lesson_id);
    if (error) return { ok: false, data: null, error: error.message };
  }
  if (storyboard?.storyboard_id) {
    const { error } = await supabase
      .from("lesson_storyboards")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", storyboard.storyboard_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  await auditReview(supabase, status, lesson.generated_lesson_id, storyboard?.storyboard_id, note);
  revalidatePath("/admin/ai-lesson-generator");

  return { ok: true, data: { status }, error: null };
}

export async function publishReviewedLesson(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  target: PublishTarget,
  render?: LessonRender | null,
): Promise<LessonStudioActionResult<PublishResult>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const normalizedTarget = {
    ...target,
    module_key: slug(target.module_key),
    lesson_key: slug(target.lesson_key),
    lesson_order_index: Math.max(1, Math.round(target.lesson_order_index || 1)),
  };

  if (!normalizedTarget.module_key || !normalizedTarget.lesson_key) {
    return { ok: false, data: null, error: "Module key and lesson key are required." };
  }

  const curriculumLesson = toCurriculumLesson(normalizedTarget, lesson, render);
  const curriculumQuiz = toCurriculumQuiz(normalizedTarget.lesson_key, lesson);
  const lessonValidation = validateLessonJson(curriculumLesson);
  if (!lessonValidation.valid || !lessonValidation.data) {
    return { ok: false, data: null, error: lessonValidation.errors.join(" ") };
  }
  const quizValidation = validateQuizJson(curriculumQuiz);
  if (!quizValidation.valid || !quizValidation.data) {
    return { ok: false, data: null, error: quizValidation.errors.join(" ") };
  }

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();

  const { data: moduleRow, error: moduleError } = await supabase
    .from("modules")
    .upsert(
      {
        module_key: normalizedTarget.module_key,
        title: normalizedTarget.module_title,
        description: normalizedTarget.module_description,
        order_index: 0,
        is_published: true,
        metadata: {
          source: "lesson_studio_publish",
          generated_lesson_id: lesson.generated_lesson_id ?? null,
          storyboard_id: storyboard?.storyboard_id ?? null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_key" },
    )
    .select("id")
    .single();

  if (moduleError) return { ok: false, data: null, error: moduleError.message };

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .upsert(
      {
        module_id: moduleRow.id,
        lesson_key: normalizedTarget.lesson_key,
        title: lessonValidation.data.title,
        order_index: normalizedTarget.lesson_order_index,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_id,lesson_key" },
    )
    .select("id")
    .single();

  if (lessonError) return { ok: false, data: null, error: lessonError.message };

  const lessonVersionNumber = await nextVersion(supabase, "lesson_versions", "lesson_id", lessonRow.id);
  const { data: lessonVersion, error: lessonVersionError } = await supabase
    .from("lesson_versions")
    .insert({
      lesson_id: lessonRow.id,
      version_number: lessonVersionNumber,
      content_json: lessonValidation.data,
      created_by: userResult.user?.id ?? null,
    })
    .select("id, version_number")
    .single();

  if (lessonVersionError) return { ok: false, data: null, error: lessonVersionError.message };

  const { error: lessonUpdateError } = await supabase
    .from("lessons")
    .update({ current_version_id: lessonVersion.id, updated_at: new Date().toISOString() })
    .eq("id", lessonRow.id);

  if (lessonUpdateError) return { ok: false, data: null, error: lessonUpdateError.message };

  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .upsert({ lesson_id: lessonRow.id, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" })
    .select("id")
    .single();

  if (quizError) return { ok: false, data: null, error: quizError.message };

  const quizVersionNumber = await nextVersion(supabase, "quiz_versions", "quiz_id", quizRow.id);
  const { data: quizVersion, error: quizVersionError } = await supabase
    .from("quiz_versions")
    .insert({
      quiz_id: quizRow.id,
      version_number: quizVersionNumber,
      content_json: quizValidation.data,
      created_by: userResult.user?.id ?? null,
    })
    .select("id, version_number")
    .single();

  if (quizVersionError) return { ok: false, data: null, error: quizVersionError.message };

  const { error: quizUpdateError } = await supabase
    .from("quizzes")
    .update({ current_version_id: quizVersion.id, updated_at: new Date().toISOString() })
    .eq("id", quizRow.id);

  if (quizUpdateError) return { ok: false, data: null, error: quizUpdateError.message };

  await setLessonReviewStatus(lesson, storyboard, "published", `Published to ${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`);

  revalidatePath("/admin/ai-lesson-generator");
  revalidatePath("/admin/curriculum");
  revalidatePath("/learn");
  revalidatePath(`/learn/${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`);

  return {
    ok: true,
    data: {
      module_id: moduleRow.id,
      lesson_id: lessonRow.id,
      lesson_version_id: lessonVersion.id,
      lesson_version_number: lessonVersion.version_number,
      quiz_id: quizRow.id,
      quiz_version_id: quizVersion.id,
      quiz_version_number: quizVersion.version_number,
      lesson_url: `/learn/${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`,
    },
    error: null,
  };
}
