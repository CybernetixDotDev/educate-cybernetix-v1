"use server";

import { requireRole } from "@/lib/auth/roles";
import { validateModuleJson } from "@/lib/curriculum/validateModuleJson";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function nextLessonVersion(supabase: ReturnType<typeof createClient>, lessonId: string) {
  const { data, error } = await supabase
    .from("lesson_versions")
    .select("version_number")
    .eq("lesson_id", lessonId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.version_number ?? 0) + 1;
}

async function nextQuizVersion(supabase: ReturnType<typeof createClient>, quizId: string) {
  const { data, error } = await supabase
    .from("quiz_versions")
    .select("version_number")
    .eq("quiz_id", quizId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.version_number ?? 0) + 1;
}

export async function publishModuleJson(courseId: string | null, moduleJson: unknown) {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, error: "Admin access required." };

  const validation = validateModuleJson(moduleJson);
  if (!validation.valid || !validation.data) return { ok: false, error: validation.errors.join(" ") };

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const normalized = validation.data;
  const weekNumber = Number(normalized.module_key.match(/week(\d+)/)?.[1] ?? normalized.lessons[0]?.order_index ?? 0);
  let resolvedCourseId = courseId;

  if (!resolvedCourseId) {
    const { data: defaultCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("course_key", "12-week-tech-foundations-accelerator")
      .maybeSingle();

    resolvedCourseId = defaultCourse?.id ?? null;
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("modules")
    .upsert(
      {
        course_id: resolvedCourseId || null,
        module_key: normalized.module_key,
        title: normalized.title,
        description: normalized.description,
        order_index: Number.isFinite(weekNumber) ? weekNumber : 0,
        week_number: Number.isFinite(weekNumber) ? weekNumber : null,
        is_published: true,
        metadata: {
          difficulty: normalized.difficulty,
          estimated_hours: normalized.estimated_hours,
          skills: normalized.skills ?? [],
          video: normalized.video ?? null,
          project: normalized.project ?? null,
          ai_prompt_pack: normalized.ai_prompt_pack ?? null,
          source: "module_json_import",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_key" },
    )
    .select("id")
    .single();

  if (moduleError) return { ok: false, error: moduleError.message };

  const lessonContext: Record<string, unknown> = {};

  for (const item of normalized.lessons) {
    const { data: lessonRow, error: lessonError } = await supabase
      .from("lessons")
      .upsert(
        {
          module_id: moduleRow.id,
          lesson_key: item.lesson_key,
          title: item.lesson.title,
          order_index: item.order_index,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "module_id,lesson_key" },
      )
      .select("id")
      .single();

    if (lessonError) return { ok: false, error: lessonError.message };

    const lessonVersionNumber = await nextLessonVersion(supabase, lessonRow.id);
    const { data: lessonVersion, error: lessonVersionError } = await supabase
      .from("lesson_versions")
      .insert({
        lesson_id: lessonRow.id,
        version_number: lessonVersionNumber,
        content_json: item.lesson,
        created_by: userResult.user?.id ?? null,
      })
      .select("id")
      .single();

    if (lessonVersionError) return { ok: false, error: lessonVersionError.message };

    const { error: lessonUpdateError } = await supabase
      .from("lessons")
      .update({ current_version_id: lessonVersion.id, updated_at: new Date().toISOString() })
      .eq("id", lessonRow.id);

    if (lessonUpdateError) return { ok: false, error: lessonUpdateError.message };

    const { data: quizRow, error: quizError } = await supabase
      .from("quizzes")
      .upsert({ lesson_id: lessonRow.id, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" })
      .select("id")
      .single();

    if (quizError) return { ok: false, error: quizError.message };

    const quizVersionNumber = await nextQuizVersion(supabase, quizRow.id);
    const { data: quizVersion, error: quizVersionError } = await supabase
      .from("quiz_versions")
      .insert({
        quiz_id: quizRow.id,
        version_number: quizVersionNumber,
        content_json: item.quiz,
        created_by: userResult.user?.id ?? null,
      })
      .select("id")
      .single();

    if (quizVersionError) return { ok: false, error: quizVersionError.message };

    const { error: quizUpdateError } = await supabase
      .from("quizzes")
      .update({ current_version_id: quizVersion.id, updated_at: new Date().toISOString() })
      .eq("id", quizRow.id);

    if (quizUpdateError) return { ok: false, error: quizUpdateError.message };

    lessonContext[item.lesson_key] = {
      title: item.lesson.title,
      estimated_minutes: item.estimated_minutes,
      teacher_focus: item.ai_context.teacher_focus ?? "",
      quiz_focus: item.ai_context.quiz_focus ?? "",
      builder_focus: item.ai_context.builder_focus ?? "",
    };
  }

  const { error: contextError } = await supabase.from("ai_module_context").upsert(
    {
      module_key: normalized.module_key,
      module_title: normalized.title,
      module_description: normalized.description,
      learning_objectives: normalized.lessons.map((lesson) => lesson.lesson.title),
      context: {
        module_id: normalized.module_key,
        difficulty: normalized.difficulty,
        estimated_hours: normalized.estimated_hours,
        skills: normalized.skills ?? [],
        video: normalized.video ?? null,
        project: normalized.project ?? null,
        ai_prompt_pack: normalized.ai_prompt_pack ?? null,
        lessons: lessonContext,
      },
      prompt_overrides: {
        teacher_focus: normalized.lessons.map((lesson) => lesson.ai_context.teacher_focus).filter(Boolean).join("\n"),
        quiz_focus: normalized.lessons.map((lesson) => lesson.ai_context.quiz_focus).filter(Boolean).join("\n"),
        builder_focus: normalized.lessons.map((lesson) => lesson.ai_context.builder_focus).filter(Boolean).join("\n"),
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_key" },
  );

  if (contextError) return { ok: false, error: contextError.message };

  revalidatePath("/admin/curriculum");
  revalidatePath("/learn");

  return {
    ok: true,
    module_id: moduleRow.id as string,
    lessons_published: normalized.lessons.length,
  };
}
