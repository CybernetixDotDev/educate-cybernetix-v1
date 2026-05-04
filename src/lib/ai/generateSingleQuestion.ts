"use server";

import { generateQuizQuestion, type QuizGenerationInput, type QuizGenerationResult } from "./generateQuiz";

export async function generateSingleQuestion(
  input: QuizGenerationInput,
  questionIndex: number,
): Promise<QuizGenerationResult> {
  try {
    return await generateQuizQuestion(input, questionIndex);
  } catch (error) {
    return {
      ok: false,
      quiz: null,
      error: error instanceof Error ? error.message : "Unable to regenerate question",
    };
  }
}
