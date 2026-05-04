"use server";

import { generateLessonSection, type LessonGenerationInput, type LessonGenerationResult } from "./generateLesson";

export async function generateLessonContent(input: LessonGenerationInput): Promise<LessonGenerationResult> {
  try {
    const lesson = await generateLessonSection(input, "content");
    return { ok: true, lesson, error: null };
  } catch (error) {
    return { ok: false, lesson: null, error: error instanceof Error ? error.message : "Unable to generate content" };
  }
}
