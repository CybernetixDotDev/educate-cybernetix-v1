"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { normalizeGeneratedLesson, type GeneratedLesson, type LessonGenerationInput } from "./generateLesson";

export type SaveGeneratedLessonResult = {
  ok: boolean;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function saveGeneratedLesson(lesson: GeneratedLesson): Promise<SaveGeneratedLessonResult> {
  try {
    const input: LessonGenerationInput = {
      module_id: lesson.metadata.module_id,
      lesson_title: lesson.title,
      difficulty_level: lesson.metadata.difficulty,
      learning_objectives: lesson.metadata.skill_tags,
    };
    const normalized = await normalizeGeneratedLesson(lesson, input);

    if (!normalized.title || !normalized.metadata.module_id || !normalized.metadata.lesson_id) {
      return { ok: false, error: "Generated lesson is missing title, module_id, or lesson_id" };
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("ai_module_context")
      .select("context")
      .eq("module_key", normalized.metadata.module_id)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    const context = isRecord(data?.context) ? data.context : {};
    const lessons = isRecord(context.lessons) ? context.lessons : {};
    await supabase
      .from("ai_module_context")
      .update({
        context: {
          ...context,
          lessons: {
            ...lessons,
            [normalized.metadata.lesson_id]: {
              ...normalized,
              status: "published",
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("module_key", normalized.metadata.module_id);

    revalidatePath(`/admin/modules/${normalized.metadata.module_id}`);
    revalidatePath(`/admin/lessons/${normalized.metadata.module_id}__${normalized.metadata.lesson_id}/edit`);

    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save generated lesson" };
  }
}
