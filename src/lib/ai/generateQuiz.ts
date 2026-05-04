"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type QuizType = "lesson" | "module" | "remediation" | "challenge";

export type GeneratedQuizQuestion = {
  type: "mcq" | "truefalse" | "short";
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  skill_tags: string[];
};

export type GeneratedQuiz = {
  lesson_id: string | null;
  module_id: string;
  quiz_type: QuizType;
  questions: GeneratedQuizQuestion[];
};

export type QuizGenerationInput = {
  module_id: string;
  lesson_id: string | null;
  quiz_type: QuizType;
  weak_skills: string[];
  strong_skills: string[];
};

export type QuizGenerationResult = {
  ok: boolean;
  quiz: GeneratedQuiz | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeQuestion(value: unknown, fallbackSkill: string): GeneratedQuizQuestion {
  const question = isRecord(value) ? value : {};
  const type = question.type === "truefalse" || question.type === "short" ? question.type : "mcq";
  const difficulty =
    question.difficulty === "medium" || question.difficulty === "hard" ? question.difficulty : "easy";

  return {
    type,
    question: typeof question.question === "string" ? question.question : "What is the best answer?",
    options: type === "short" ? [] : strings(question.options),
    correct_answer: typeof question.correct_answer === "string" ? question.correct_answer : "",
    difficulty,
    skill_tags: strings(question.skill_tags).length > 0 ? strings(question.skill_tags) : [fallbackSkill],
  };
}

export async function normalizeGeneratedQuiz(value: unknown, input: QuizGenerationInput): Promise<GeneratedQuiz> {
  const record = isRecord(value) ? value : {};
  const fallbackSkill = input.module_id.split("-")[0] ?? "general";

  return {
    lesson_id: typeof record.lesson_id === "string" ? record.lesson_id : input.lesson_id,
    module_id: typeof record.module_id === "string" ? record.module_id : input.module_id,
    quiz_type:
      record.quiz_type === "module" ||
      record.quiz_type === "remediation" ||
      record.quiz_type === "challenge" ||
      record.quiz_type === "lesson"
        ? record.quiz_type
        : input.quiz_type,
    questions: Array.isArray(record.questions)
      ? record.questions.map((question) => normalizeQuestion(question, fallbackSkill))
      : [],
  };
}

async function fetchQuizContext(input: QuizGenerationInput) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").eq("module_key", input.module_id).maybeSingle(),
  ]);
  const context = isRecord(moduleContext?.context) ? moduleContext.context : {};
  const lessons = isRecord(context.lessons) ? context.lessons : {};
  const lessonContent = input.lesson_id && isRecord(lessons[input.lesson_id]) ? lessons[input.lesson_id] : null;

  return {
    aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    moduleContext: (moduleContext ?? null) as Record<string, unknown> | null,
    lessonContent,
  };
}

function buildPrompt(
  input: QuizGenerationInput,
  context: Awaited<ReturnType<typeof fetchQuizContext>>,
  singleQuestionIndex?: number,
) {
  const outputFormat = {
    lesson_id: "string | null",
    module_id: "string",
    quiz_type: "lesson | module | remediation | challenge",
    questions: [
      {
        type: "mcq | truefalse | short",
        question: "string",
        options: ["string"],
        correct_answer: "string",
        difficulty: "easy | medium | hard",
        skill_tags: ["string"],
      },
    ],
  };

  return compileMentorPrompt({
    student_id: "admin-quiz-generator",
    mode: "quiz",
    module_id: input.module_id,
    lesson_id: input.lesson_id,
    project_id: null,
    student_message: [
      singleQuestionIndex === undefined
        ? "Generate a complete quiz for Educate Cybernetix."
        : `Regenerate only question ${singleQuestionIndex + 1} and return the full quiz JSON shape with one question.`,
      `Quiz type: ${input.quiz_type}`,
      `Module ID: ${input.module_id}`,
      `Lesson ID: ${input.lesson_id ?? "none"}`,
      `Weak skills for remediation: ${input.weak_skills.join(", ") || "none"}`,
      `Strong skills for challenge: ${input.strong_skills.join(", ") || "none"}`,
      `Lesson content: ${JSON.stringify(context.lessonContent ?? {})}`,
      "Use teen-friendly wording, clear distractors, and practical project-oriented assessment.",
      "Return valid JSON only. Do not wrap in markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].join("\n"),
    code_snippet: null,
    ai_config: context.aiConfig,
    module_context: context.moduleContext,
    progress: {
      lesson_progress: [],
      quiz_results: [],
      session_logs: [],
      streaks: [],
      student_projects: [],
    },
  });
}

async function callLlm(prompt: string, aiConfig: Record<string, unknown>) {
  const apiKey = process.env.AI_PROVIDER_API_KEY ?? process.env.OPENAI_API_KEY;
  const endpoint = process.env.AI_PROVIDER_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = typeof aiConfig.model === "string" ? aiConfig.model : "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("AI provider API key is not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate production-ready quiz JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty quiz");
  }

  return JSON.parse(content) as unknown;
}

export async function generateQuiz(input: QuizGenerationInput): Promise<QuizGenerationResult> {
  try {
    const context = await fetchQuizContext(input);
    const raw = await callLlm(buildPrompt(input, context), context.aiConfig);

    return { ok: true, quiz: await normalizeGeneratedQuiz(raw, input), error: null };
  } catch (error) {
    return { ok: false, quiz: null, error: error instanceof Error ? error.message : "Unable to generate quiz" };
  }
}

export async function generateQuizQuestion(input: QuizGenerationInput, questionIndex: number): Promise<QuizGenerationResult> {
  const context = await fetchQuizContext(input);
  const raw = await callLlm(buildPrompt(input, context, questionIndex), context.aiConfig);

  return { ok: true, quiz: await normalizeGeneratedQuiz(raw, input), error: null };
}
