import {
  CURRICULUM_BLOCK_TYPES,
  validateLessonJson,
  type CurriculumContentBlock,
  type CurriculumLessonJson,
  type CurriculumQuizJson,
} from "@/lib/curriculum/validateLessonJson";

export type AuthorModuleBlock = {
  type: CurriculumContentBlock["type"];
  title?: string;
  value?: string;
  url?: string;
  alt?: string;
  language?: string;
  provider?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  transcript?: string;
};

export type AuthorModuleQuestion = {
  type?: "mcq" | "true_false" | "truefalse" | "short";
  question: string;
  options?: string[];
  answer: string | number | boolean | null;
  explanation?: string;
};

export type AuthorModuleLesson = {
  id: string;
  module_id: string;
  title: string;
  section?: string;
  description?: string;
  order_index: number;
  estimated_minutes?: number;
  skills?: string[];
  video?: AuthorModuleBlock | null;
  blocks: AuthorModuleBlock[];
  quiz?: {
    questions: AuthorModuleQuestion[];
  };
  ai_context?: {
    teacher_focus?: string;
    quiz_focus?: string;
    builder_focus?: string;
  };
};

export type AuthorModuleJson = {
  module_id: string;
  title: string;
  description: string;
  difficulty?: string;
  estimated_hours?: number;
  skills?: string[];
  video?: AuthorModuleBlock | null;
  project?: Record<string, unknown>;
  ai_prompt_pack?: Record<string, unknown>;
  lessons: AuthorModuleLesson[];
};

export type NormalizedModuleLesson = {
  lesson_key: string;
  order_index: number;
  estimated_minutes: number | null;
  lesson: CurriculumLessonJson;
  quiz: CurriculumQuizJson;
  ai_context: NonNullable<AuthorModuleLesson["ai_context"]>;
};

export type NormalizedModuleJson = {
  module_key: string;
  title: string;
  description: string;
  difficulty: string | null;
  estimated_hours: number | null;
  skills?: string[];
  video?: CurriculumContentBlock | null;
  project?: Record<string, unknown>;
  ai_prompt_pack?: Record<string, unknown>;
  lessons: NormalizedModuleLesson[];
};

export type ModuleValidationResult = {
  valid: boolean;
  errors: string[];
  data: NormalizedModuleJson | null;
};

const BLOCK_TYPES = new Set<string>(CURRICULUM_BLOCK_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeBlock(block: AuthorModuleBlock): CurriculumContentBlock {
  const value = block.value ?? (block.type === "image" || block.type === "video" ? undefined : block.url);
  return {
    type: block.type,
    ...(block.title ? { title: block.title } : {}),
    ...(value ? { value } : {}),
    ...(block.url ? { url: block.url } : {}),
    ...(block.alt ? { alt: block.alt } : {}),
    ...(block.language ? { language: block.language } : {}),
    ...(block.provider ? { provider: block.provider } : {}),
    ...(Number.isFinite(Number(block.duration_seconds)) ? { duration_seconds: Number(block.duration_seconds) } : {}),
    ...(block.thumbnail_url ? { thumbnail_url: block.thumbnail_url } : {}),
    ...(block.transcript ? { transcript: block.transcript } : {}),
  };
}

function normalizeQuestion(question: AuthorModuleQuestion) {
  const options = question.type === "true_false" || question.type === "truefalse"
    ? ["True", "False"]
    : question.options ?? [];
  const answer =
    typeof question.answer === "number"
      ? options[question.answer] ?? String(question.answer)
      : typeof question.answer === "boolean"
        ? question.answer ? "True" : "False"
        : String(question.answer ?? "");

  return {
    question: question.question,
    options,
    answer,
    explanation: question.explanation ?? `Correct answer: ${answer}`,
  };
}

export function validateModuleJson(value: unknown): ModuleValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { valid: false, errors: ["Module JSON must be an object."], data: null };
  }

  if (!nonEmptyString(value.module_id)) errors.push("module_id must be a non-empty string.");
  if (!nonEmptyString(value.title)) errors.push("title must be a non-empty string.");
  if (!nonEmptyString(value.description)) errors.push("description must be a non-empty string.");
  if (!Array.isArray(value.lessons) || value.lessons.length === 0) errors.push("lessons must contain at least one lesson.");

  const lessons: NormalizedModuleLesson[] = [];
  const lessonIds = new Set<string>();

  if (Array.isArray(value.lessons)) {
    value.lessons.forEach((rawLesson, lessonIndex) => {
      if (!isRecord(rawLesson)) {
        errors.push(`lessons[${lessonIndex}] must be an object.`);
        return;
      }

      if (!nonEmptyString(rawLesson.id)) errors.push(`lessons[${lessonIndex}].id must be a non-empty string.`);
      if (!nonEmptyString(rawLesson.title)) errors.push(`lessons[${lessonIndex}].title must be a non-empty string.`);
      if (!Array.isArray(rawLesson.blocks) || rawLesson.blocks.length === 0) errors.push(`lessons[${lessonIndex}].blocks must contain at least one block.`);

      const lessonId = String(rawLesson.id ?? "");
      if (lessonIds.has(lessonId)) errors.push(`Duplicate lesson id: ${lessonId}.`);
      lessonIds.add(lessonId);

      const blocks = Array.isArray(rawLesson.blocks)
        ? rawLesson.blocks.map((block, blockIndex) => {
            if (!isRecord(block)) {
              errors.push(`lessons[${lessonIndex}].blocks[${blockIndex}] must be an object.`);
              return null;
            }

            if (typeof block.type !== "string" || !BLOCK_TYPES.has(block.type)) {
              errors.push(`lessons[${lessonIndex}].blocks[${blockIndex}].type must be one of ${CURRICULUM_BLOCK_TYPES.join(", ")}.`);
            }

            const normalized = normalizeBlock(block as AuthorModuleBlock);
            if (!nonEmptyString(normalized.value) && !nonEmptyString(normalized.url)) {
              errors.push(`lessons[${lessonIndex}].blocks[${blockIndex}] must include value or url.`);
            }

            return normalized;
          }).filter((block): block is NonNullable<typeof block> => Boolean(block))
        : [];

      const rawQuestions = isRecord(rawLesson.quiz) && Array.isArray(rawLesson.quiz.questions)
        ? rawLesson.quiz.questions
        : [];
      if (rawQuestions.length === 0) errors.push(`lessons[${lessonIndex}].quiz.questions must contain at least one question.`);

      const quiz: CurriculumQuizJson = {
        id: `${lessonId}-quiz`,
        questions: rawQuestions.map((question) => normalizeQuestion(question as AuthorModuleQuestion)),
      };
      const lesson: CurriculumLessonJson = {
        id: lessonId,
        module_id: nonEmptyString(rawLesson.module_id) ? String(rawLesson.module_id) : String(value.module_id ?? ""),
        title: String(rawLesson.title ?? ""),
        section: nonEmptyString(rawLesson.section) ? String(rawLesson.section) : undefined,
        description: nonEmptyString(rawLesson.description) ? String(rawLesson.description) : undefined,
        estimated_minutes: Number.isFinite(Number(rawLesson.estimated_minutes)) ? Number(rawLesson.estimated_minutes) : undefined,
        skills: Array.isArray(rawLesson.skills) ? rawLesson.skills.map(String).filter(Boolean) : undefined,
        video: isRecord(rawLesson.video) ? normalizeBlock(rawLesson.video as AuthorModuleBlock) : null,
        objectives: [`Complete ${String(rawLesson.title ?? "this lesson")}`, "Apply the concept in a small task"],
        content: blocks,
        quiz,
      };
      const lessonValidation = validateLessonJson(lesson);

      if (!lessonValidation.valid) {
        errors.push(...lessonValidation.errors.map((error) => `lessons[${lessonIndex}].${error}`));
      }

      lessons.push({
        lesson_key: lessonId,
        order_index: Number(rawLesson.order_index ?? lessonIndex + 1),
        estimated_minutes: Number.isFinite(Number(rawLesson.estimated_minutes)) ? Number(rawLesson.estimated_minutes) : null,
        lesson,
        quiz,
        ai_context: isRecord(rawLesson.ai_context) ? rawLesson.ai_context : {},
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0
      ? {
          module_key: String(value.module_id),
          title: String(value.title),
          description: String(value.description),
          difficulty: nonEmptyString(value.difficulty) ? String(value.difficulty) : null,
          estimated_hours: Number.isFinite(Number(value.estimated_hours)) ? Number(value.estimated_hours) : null,
          skills: Array.isArray(value.skills) ? value.skills.map(String).filter(Boolean) : undefined,
          video: isRecord(value.video) ? normalizeBlock(value.video as AuthorModuleBlock) : null,
          project: isRecord(value.project) ? value.project : undefined,
          ai_prompt_pack: isRecord(value.ai_prompt_pack) ? value.ai_prompt_pack : undefined,
          lessons: lessons.sort((left, right) => left.order_index - right.order_index),
        }
      : null,
  };
}
