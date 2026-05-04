"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type GeneratedQuestion = {
  type: "mcq" | "truefalse" | "short";
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  skill_tags: string[];
};

export type GeneratedLesson = {
  title: string;
  body: string;
  codeExamples: Array<{ language: string; code: string }>;
  images: string[];
  quiz: {
    questions: GeneratedQuestion[];
  };
  metadata: {
    module_id: string;
    lesson_id: string;
    order_index: number;
    estimated_time: number;
    prerequisites: string[];
    next_lessons: string[];
    skill_tags: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
  };
};

export type LessonGenerationInput = {
  module_id: string;
  lesson_title: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  learning_objectives: string[];
};

export type LessonGenerationResult = {
  ok: boolean;
  lesson: GeneratedLesson | null;
  error: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeQuestion(value: unknown, fallbackSkill: string): GeneratedQuestion {
  const question = isRecord(value) ? value : {};
  const type = question.type === "truefalse" || question.type === "short" ? question.type : "mcq";
  const difficulty =
    question.difficulty === "medium" || question.difficulty === "hard" ? question.difficulty : "easy";

  return {
    type,
    question: typeof question.question === "string" ? question.question : "What is the key idea?",
    options: type === "short" ? [] : strings(question.options),
    correct_answer: typeof question.correct_answer === "string" ? question.correct_answer : "",
    difficulty,
    skill_tags: strings(question.skill_tags).length > 0 ? strings(question.skill_tags) : [fallbackSkill],
  };
}

export async function normalizeGeneratedLesson(value: unknown, input: LessonGenerationInput): Promise<GeneratedLesson> {
  const record = isRecord(value) ? value : {};
  const metadata = isRecord(record.metadata) ? record.metadata : {};
  const quiz = isRecord(record.quiz) ? record.quiz : {};
  const fallbackSkill = input.module_id.split("-")[0] ?? "general";
  const difficulty =
    metadata.difficulty === "intermediate" || metadata.difficulty === "advanced"
      ? metadata.difficulty
      : input.difficulty_level;

  return {
    title: typeof record.title === "string" ? record.title : input.lesson_title,
    body:
      typeof record.body === "string"
        ? record.body
        : `## ${input.lesson_title}\n\nStart with the core idea, then build a small working example.`,
    codeExamples: Array.isArray(record.codeExamples)
      ? record.codeExamples
          .filter(isRecord)
          .map((example) => ({
            language: typeof example.language === "string" ? example.language : "tsx",
            code: typeof example.code === "string" ? example.code : "",
          }))
      : [],
    images: strings(record.images),
    quiz: {
      questions: Array.isArray(quiz.questions)
        ? quiz.questions.map((question) => normalizeQuestion(question, fallbackSkill))
        : [],
    },
    metadata: {
      module_id: typeof metadata.module_id === "string" ? metadata.module_id : input.module_id,
      lesson_id: typeof metadata.lesson_id === "string" ? metadata.lesson_id : slugify(input.lesson_title),
      order_index: Number(metadata.order_index ?? 0),
      estimated_time: Number(metadata.estimated_time ?? 25),
      prerequisites: strings(metadata.prerequisites),
      next_lessons: strings(metadata.next_lessons),
      skill_tags: strings(metadata.skill_tags).length > 0 ? strings(metadata.skill_tags) : [fallbackSkill],
      difficulty,
    },
  };
}

async function fetchGenerationContext(moduleId: string) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").eq("module_key", moduleId).maybeSingle(),
  ]);

  return {
    aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    moduleContext: (moduleContext ?? null) as Record<string, unknown> | null,
  };
}

function buildPrompt(input: LessonGenerationInput, section: "full" | "content" | "quiz" | "metadata", context: Awaited<ReturnType<typeof fetchGenerationContext>>) {
  const outputFormat = {
    title: "string",
    body: "markdown string",
    codeExamples: [{ language: "string", code: "string" }],
    images: ["string"],
    quiz: {
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
    },
    metadata: {
      module_id: "string",
      lesson_id: "string",
      order_index: 0,
      estimated_time: 25,
      prerequisites: ["string"],
      next_lessons: ["string"],
      skill_tags: ["string"],
      difficulty: "beginner | intermediate | advanced",
    },
  };

  return compileMentorPrompt({
    student_id: "admin-lesson-generator",
    mode: "builder",
    module_id: input.module_id,
    lesson_id: null,
    project_id: null,
    student_message: [
      `Generate ${section} for an Educate Cybernetix lesson.`,
      `Lesson title: ${input.lesson_title}`,
      `Difficulty level: ${input.difficulty_level}`,
      `Learning objectives: ${input.learning_objectives.join("; ")}`,
      "Use a practical, teen-friendly tone. Include project-oriented examples.",
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
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate production-ready lesson JSON. Return JSON only." },
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
    throw new Error("AI provider returned an empty lesson");
  }

  return JSON.parse(content) as unknown;
}

export async function generateLesson(input: LessonGenerationInput): Promise<LessonGenerationResult> {
  try {
    const context = await fetchGenerationContext(input.module_id);
    const prompt = buildPrompt(input, "full", context);
    const raw = await callLlm(prompt, context.aiConfig);

    return { ok: true, lesson: await normalizeGeneratedLesson(raw, input), error: null };
  } catch (error) {
    return {
      ok: false,
      lesson: null,
      error: error instanceof Error ? error.message : "Unable to generate lesson",
    };
  }
}

export async function generateLessonSection(input: LessonGenerationInput, section: "content" | "quiz" | "metadata") {
  const context = await fetchGenerationContext(input.module_id);
  const prompt = buildPrompt(input, section, context);
  const raw = await callLlm(prompt, context.aiConfig);

  return normalizeGeneratedLesson(raw, input);
}
