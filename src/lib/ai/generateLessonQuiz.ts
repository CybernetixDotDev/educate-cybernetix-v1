"use server";

import { generateLessonSection, type LessonGenerationInput, type LessonGenerationResult } from "./generateLesson";

export async function generateLessonQuiz(input: LessonGenerationInput): Promise<LessonGenerationResult> {
  try {
    const lesson = await generateLessonSection(input, "quiz");
    return { ok: true, lesson, error: null };
  } catch (error) {
    return { ok: false, lesson: null, error: error instanceof Error ? error.message : "Unable to generate quiz" };
  }
}
