"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { normalizeGeneratedQuiz, type GeneratedQuiz } from "./generateQuiz";

export type SaveGeneratedQuizResult = {
  ok: boolean;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateQuiz(quiz: GeneratedQuiz) {
  const errors: string[] = [];

  if (!quiz.module_id) {
    errors.push("module_id is required");
  }

  if (quiz.quiz_type === "lesson" && !quiz.lesson_id) {
    errors.push("lesson_id is required for lesson quizzes");
  }

  if (quiz.questions.length === 0) {
    errors.push("at least one question is required");
  }

  quiz.questions.forEach((question, index) => {
    if (!question.question.trim()) {
      errors.push(`question ${index + 1} is missing text`);
    }

    if (question.type !== "short" && question.options.length === 0) {
      errors.push(`question ${index + 1} needs options`);
    }
  });

  return errors;
}

export async function saveGeneratedQuiz(quiz: GeneratedQuiz): Promise<SaveGeneratedQuizResult> {
  try {
    const normalized = await normalizeGeneratedQuiz(quiz, {
      module_id: quiz.module_id,
      lesson_id: quiz.lesson_id,
      quiz_type: quiz.quiz_type,
      weak_skills: [],
      strong_skills: [],
    });
    const errors = validateQuiz(normalized);

    if (errors.length > 0) {
      return { ok: false, error: errors.join("; ") };
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("ai_module_context")
      .select("context")
      .eq("module_key", normalized.module_id)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    const context: Record<string, unknown> = isRecord(data?.context) ? data.context : {};
    const lessons: Record<string, unknown> = isRecord(context.lessons) ? context.lessons : {};

    if (normalized.quiz_type === "lesson" && normalized.lesson_id) {
      const lessonValue = lessons[normalized.lesson_id];
      const lesson: Record<string, unknown> = isRecord(lessonValue)
        ? lessonValue
        : {};

      await supabase
        .from("ai_module_context")
        .update({
          context: {
            ...context,
            lessons: {
              ...lessons,
              [normalized.lesson_id]: {
                ...lesson,
                quiz: { questions: normalized.questions },
                updated_at: new Date().toISOString(),
              },
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq("module_key", normalized.module_id);
    } else {
      const generatedQuizzes: Record<string, unknown> = isRecord(context.generated_quizzes)
        ? context.generated_quizzes
        : {};
      const key = `${normalized.quiz_type}-${Date.now()}`;

      await supabase
        .from("ai_module_context")
        .update({
          context: {
            ...context,
            generated_quizzes: {
              ...generatedQuizzes,
              [key]: {
                ...normalized,
                saved_at: new Date().toISOString(),
              },
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq("module_key", normalized.module_id);
    }

    revalidatePath(`/admin/modules/${normalized.module_id}`);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save generated quiz" };
  }
}
