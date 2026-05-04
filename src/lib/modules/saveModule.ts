"use client";

import { createClient } from "@/utils/supabase/client";

export type ModuleLessonRef = {
  lesson_id: string;
  order_index: number;
};

export type ModuleAuthoringSchema = {
  module_id: string;
  title: string;
  description: string;
  week_number: number;
  prerequisites: string[];
  outcomes: string[];
  lessons: ModuleLessonRef[];
  published: boolean;
};

export type SaveModuleResult = {
  ok: boolean;
  error: string | null;
  module: ModuleAuthoringSchema | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createEmptyModule(moduleId = ""): ModuleAuthoringSchema {
  return {
    module_id: moduleId,
    title: "",
    description: "",
    week_number: 1,
    prerequisites: [],
    outcomes: [],
    lessons: [],
    published: false,
  };
}

export function normalizeModule(input: Partial<ModuleAuthoringSchema>): ModuleAuthoringSchema {
  const empty = createEmptyModule(input.module_id);

  return {
    ...empty,
    ...input,
    week_number: Number(input.week_number ?? empty.week_number),
    prerequisites: Array.isArray(input.prerequisites) ? input.prerequisites : [],
    outcomes: Array.isArray(input.outcomes) ? input.outcomes : [],
    lessons: Array.isArray(input.lessons)
      ? input.lessons
          .filter((lesson) => lesson.lesson_id)
          .map((lesson, index) => ({
            lesson_id: lesson.lesson_id,
            order_index: Number.isFinite(lesson.order_index) ? lesson.order_index : index,
          }))
          .sort((left, right) => left.order_index - right.order_index)
          .map((lesson, index) => ({ ...lesson, order_index: index }))
      : [],
    published: Boolean(input.published),
  };
}

export function validateModuleSchema(module: ModuleAuthoringSchema) {
  const errors: string[] = [];

  if (!module.module_id.trim()) {
    errors.push("module_id is required");
  }

  if (!module.title.trim()) {
    errors.push("title is required");
  }

  if (!Number.isFinite(module.week_number) || module.week_number < 1) {
    errors.push("week_number must be a positive number");
  }

  const lessonIds = new Set<string>();
  for (const lesson of module.lessons) {
    if (lessonIds.has(lesson.lesson_id)) {
      errors.push(`duplicate lesson_id: ${lesson.lesson_id}`);
    }
    lessonIds.add(lesson.lesson_id);
  }

  return errors;
}

export async function saveModule(module: ModuleAuthoringSchema): Promise<SaveModuleResult> {
  const normalized = normalizeModule(module);
  const errors = validateModuleSchema(normalized);

  if (errors.length > 0) {
    return { ok: false, error: errors.join("; "), module: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_module_context")
    .select("context")
    .eq("module_key", normalized.module_id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, module: null };
  }

  const context = isRecord(data?.context) ? data.context : {};
  const { error: upsertError } = await supabase.from("ai_module_context").upsert(
    {
      module_key: normalized.module_id,
      module_title: normalized.title,
      module_description: normalized.description,
      learning_objectives: normalized.outcomes,
      context: {
        ...context,
        module_id: normalized.module_id,
        module_authoring: normalized,
      },
      is_active: normalized.published,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_key" },
  );

  if (upsertError) {
    return { ok: false, error: upsertError.message, module: null };
  }

  return { ok: true, error: null, module: normalized };
}
