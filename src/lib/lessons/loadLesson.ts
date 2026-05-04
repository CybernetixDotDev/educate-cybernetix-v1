import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyLesson, normalizeLesson, type LessonAuthoringSchema } from "./saveLesson";

type ModuleContextRecord = {
  module_key: string;
  module_title: string;
  context: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function loadLesson(
  supabase: SupabaseClient,
  moduleId: string,
  lessonId: string,
): Promise<{ lesson: LessonAuthoringSchema; moduleTitle: string; exists: boolean }> {
  const { data, error } = await supabase
    .from("ai_module_context")
    .select("module_key,module_title,context")
    .eq("module_key", moduleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const moduleRecord = data as ModuleContextRecord | null;
  const context = isRecord(moduleRecord?.context) ? moduleRecord.context : {};
  const lessons = isRecord(context.lessons) ? context.lessons : {};
  const rawLesson = isRecord(lessons[lessonId]) ? (lessons[lessonId] as Partial<LessonAuthoringSchema>) : null;

  return {
    lesson: rawLesson ? normalizeLesson(rawLesson) : createEmptyLesson(moduleId, lessonId),
    moduleTitle: moduleRecord?.module_title ?? moduleId,
    exists: Boolean(rawLesson),
  };
}
