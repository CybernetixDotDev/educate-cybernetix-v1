import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyModule, normalizeModule, type ModuleAuthoringSchema } from "./saveModule";

export type ModuleLessonOption = {
  lesson_id: string;
  title: string;
  estimated_time: number;
};

type ModuleRecord = {
  module_key: string;
  module_title: string;
  module_description: string | null;
  learning_objectives: string[];
  is_active: boolean;
  context: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getWeekNumber(moduleId: string) {
  return Number(moduleId.match(/week(\d+)/)?.[1] ?? 1);
}

export async function loadModule(
  supabase: SupabaseClient,
  moduleId: string,
): Promise<{ module: ModuleAuthoringSchema; lessonOptions: ModuleLessonOption[]; exists: boolean }> {
  const { data, error } = await supabase
    .from("ai_module_context")
    .select("*")
    .eq("module_key", moduleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as ModuleRecord | null;

  if (!row) {
    return { module: createEmptyModule(moduleId), lessonOptions: [], exists: false };
  }

  const context = isRecord(row.context) ? row.context : {};
  const authored = isRecord(context.module_authoring)
    ? normalizeModule(context.module_authoring as Partial<ModuleAuthoringSchema>)
    : normalizeModule({
        module_id: row.module_key,
        title: row.module_title,
        description: row.module_description ?? "",
        week_number: getWeekNumber(row.module_key),
        prerequisites: [],
        outcomes: row.learning_objectives ?? [],
        lessons: [],
        published: row.is_active,
      });
  const rawLessons = isRecord(context.lessons) ? context.lessons : {};
  const lessonOptions = Object.entries(rawLessons).map(([lessonId, value]) => {
    const lesson = isRecord(value) ? value : {};
    const metadata = isRecord(lesson.metadata) ? lesson.metadata : {};

    return {
      lesson_id: lessonId,
      title: typeof lesson.title === "string" ? lesson.title : lessonId,
      estimated_time: Number(metadata.estimated_time ?? 20),
    };
  });

  return { module: authored, lessonOptions, exists: true };
}
