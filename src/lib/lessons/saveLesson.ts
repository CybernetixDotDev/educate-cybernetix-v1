"use client";

import { createClient } from "@/utils/supabase/client";

export type LessonQuestionType = "mcq" | "truefalse" | "short";
export type LessonDifficulty = "easy" | "medium" | "hard";

export type LessonAuthoringQuestion = {
  type: LessonQuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: LessonDifficulty;
  skill_tags: string[];
};

export type LessonAuthoringSchema = {
  title: string;
  body: string;
  codeExamples: Array<{ language: string; code: string }>;
  images: string[];
  quiz: {
    questions: LessonAuthoringQuestion[];
  };
  metadata: {
    module_id: string;
    lesson_id: string;
    order_index: number;
    estimated_time: number;
    prerequisites: string[];
    next_lessons: string[];
  };
  description?: string;
  status?: "draft" | "published";
  updated_at?: string;
  published_at?: string | null;
};

export type SaveLessonResult = {
  ok: boolean;
  error: string | null;
  lesson: LessonAuthoringSchema | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createEmptyLesson(moduleId = "", lessonId = ""): LessonAuthoringSchema {
  return {
    title: "",
    body: "",
    codeExamples: [],
    images: [],
    quiz: {
      questions: [],
    },
    metadata: {
      module_id: moduleId,
      lesson_id: lessonId,
      order_index: 0,
      estimated_time: 20,
      prerequisites: [],
      next_lessons: [],
    },
    description: "",
    status: "draft",
    published_at: null,
  };
}

export function validateLessonSchema(lesson: LessonAuthoringSchema) {
  const errors: string[] = [];

  if (!lesson.title.trim()) {
    errors.push("Lesson title is required");
  }

  if (!lesson.metadata.module_id.trim()) {
    errors.push("module_id is required");
  }

  if (!lesson.metadata.lesson_id.trim()) {
    errors.push("lesson_id is required");
  }

  if (!Number.isFinite(lesson.metadata.order_index)) {
    errors.push("order_index must be a number");
  }

  if (!Number.isFinite(lesson.metadata.estimated_time)) {
    errors.push("estimated_time must be a number");
  }

  lesson.quiz.questions.forEach((question, index) => {
    if (!question.question.trim()) {
      errors.push(`Question ${index + 1} is missing text`);
    }

    if ((question.type === "mcq" || question.type === "truefalse") && question.options.length === 0) {
      errors.push(`Question ${index + 1} needs options`);
    }
  });

  return errors;
}

export function normalizeLesson(input: Partial<LessonAuthoringSchema>): LessonAuthoringSchema {
  const empty = createEmptyLesson(input.metadata?.module_id, input.metadata?.lesson_id);

  return {
    ...empty,
    ...input,
    codeExamples: Array.isArray(input.codeExamples) ? input.codeExamples : [],
    images: Array.isArray(input.images) ? input.images : [],
    quiz: {
      questions: Array.isArray(input.quiz?.questions) ? input.quiz.questions : [],
    },
    metadata: {
      ...empty.metadata,
      ...input.metadata,
      prerequisites: Array.isArray(input.metadata?.prerequisites) ? input.metadata.prerequisites : [],
      next_lessons: Array.isArray(input.metadata?.next_lessons) ? input.metadata.next_lessons : [],
      order_index: Number(input.metadata?.order_index ?? empty.metadata.order_index),
      estimated_time: Number(input.metadata?.estimated_time ?? empty.metadata.estimated_time),
    },
  };
}

export async function saveLesson(lesson: LessonAuthoringSchema, options: { publish?: boolean } = {}): Promise<SaveLessonResult> {
  const normalized = normalizeLesson(lesson);
  const errors = validateLessonSchema(normalized);

  if (errors.length > 0) {
    return { ok: false, error: errors.join("; "), lesson: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_module_context")
    .select("context")
    .eq("module_key", normalized.metadata.module_id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, lesson: null };
  }

  const context = isRecord(data?.context) ? data.context : {};
  const lessons = isRecord(context.lessons) ? context.lessons : {};
  const nextLesson: LessonAuthoringSchema = {
    ...normalized,
    status: options.publish ? "published" : normalized.status ?? "draft",
    updated_at: new Date().toISOString(),
    published_at: options.publish ? new Date().toISOString() : normalized.published_at ?? null,
  };

  const { error: updateError } = await supabase
    .from("ai_module_context")
    .update({
      context: {
        ...context,
        lessons: {
          ...lessons,
          [nextLesson.metadata.lesson_id]: nextLesson,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("module_key", nextLesson.metadata.module_id);

  if (updateError) {
    return { ok: false, error: updateError.message, lesson: null };
  }

  return { ok: true, error: null, lesson: nextLesson };
}
