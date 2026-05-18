export type CurriculumContentBlock = {
  type:
    | "learning_goal"
    | "text"
    | "example"
    | "code"
    | "image"
    | "video"
    | "diagram"
    | "task"
    | "checkpoint"
    | "common_mistake"
    | "mentor_prompt"
    | "recap"
    | "tip";
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

export type CurriculumQuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type CurriculumQuizJson = {
  id: string;
  questions: CurriculumQuizQuestion[];
};

export type CurriculumLessonJson = {
  id: string;
  module_id?: string;
  title: string;
  section?: string;
  description?: string;
  estimated_minutes?: number;
  skills?: string[];
  video?: CurriculumContentBlock | null;
  objectives: string[];
  content: CurriculumContentBlock[];
  quiz: CurriculumQuizJson;
};

export type ValidationResult<T = unknown> = {
  valid: boolean;
  errors: string[];
  data: T | null;
};

export const CURRICULUM_BLOCK_TYPES = [
  "learning_goal",
  "text",
  "example",
  "code",
  "image",
  "video",
  "diagram",
  "task",
  "checkpoint",
  "common_mistake",
  "mentor_prompt",
  "recap",
  "tip",
] as const;

const BLOCK_TYPES = new Set<string>(CURRICULUM_BLOCK_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateString(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string.`);
  }
}

function validateStringArray(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of strings.`);
    return;
  }

  value.forEach((item, index) => validateString(item, `${path}[${index}]`, errors));
}

function validateOptionalString(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    errors.push(`${path} must be a string when provided.`);
  }
}

function validateOptionalStringArray(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === null) return;
  validateStringArray(value, path, errors);
}

function validateOptionalNumber(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && value !== null && !Number.isFinite(Number(value))) {
    errors.push(`${path} must be a number when provided.`);
  }
}

function validateContentBlock(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (typeof value.type !== "string" || !BLOCK_TYPES.has(value.type)) {
    errors.push(`${path}.type must be one of ${CURRICULUM_BLOCK_TYPES.join(", ")}.`);
  }

  validateOptionalString(value.title, `${path}.title`, errors);
  validateOptionalString(value.value, `${path}.value`, errors);
  validateOptionalString(value.url, `${path}.url`, errors);
  validateOptionalString(value.alt, `${path}.alt`, errors);
  validateOptionalString(value.language, `${path}.language`, errors);
  validateOptionalString(value.provider, `${path}.provider`, errors);
  validateOptionalNumber(value.duration_seconds, `${path}.duration_seconds`, errors);
  validateOptionalString(value.thumbnail_url, `${path}.thumbnail_url`, errors);
  validateOptionalString(value.transcript, `${path}.transcript`, errors);

  const hasValue = typeof value.value === "string" && value.value.trim().length > 0;
  const hasUrl = typeof value.url === "string" && value.url.trim().length > 0;

  if (!hasValue && !hasUrl) {
    errors.push(`${path} must include value or url.`);
  }
}

function validateQuestions(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must contain at least one question.`);
    return;
  }

  value.forEach((question, index) => {
    if (!isRecord(question)) {
      errors.push(`${path}[${index}] must be an object.`);
      return;
    }

    validateString(question.question, `${path}[${index}].question`, errors);
    validateStringArray(question.options, `${path}[${index}].options`, errors);
    validateString(question.answer, `${path}[${index}].answer`, errors);
    validateString(question.explanation, `${path}[${index}].explanation`, errors);
  });
}

export function validateQuizJson(value: unknown): ValidationResult<CurriculumQuizJson> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { valid: false, errors: ["Quiz JSON must be an object."], data: null };
  }

  validateString(value.id, "id", errors);
  validateQuestions(value.questions, "questions", errors);

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (value as CurriculumQuizJson) : null,
  };
}

export function validateLessonJson(value: unknown): ValidationResult<CurriculumLessonJson> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { valid: false, errors: ["Lesson JSON must be an object."], data: null };
  }

  validateString(value.id, "id", errors);
  validateString(value.title, "title", errors);
  validateOptionalString(value.module_id, "module_id", errors);
  validateOptionalString(value.section, "section", errors);
  validateOptionalString(value.description, "description", errors);
  validateOptionalNumber(value.estimated_minutes, "estimated_minutes", errors);
  validateOptionalStringArray(value.skills, "skills", errors);
  validateStringArray(value.objectives, "objectives", errors);

  if (value.video !== undefined && value.video !== null) {
    validateContentBlock(value.video, "video", errors);
  }

  if (!Array.isArray(value.content) || value.content.length === 0) {
    errors.push("content must contain at least one block.");
  } else {
    value.content.forEach((block, index) => validateContentBlock(block, `content[${index}]`, errors));
  }

  if (!isRecord(value.quiz)) {
    errors.push("quiz must be an object.");
  } else {
    const quizResult = validateQuizJson(value.quiz);
    errors.push(...quizResult.errors.map((error) => `quiz.${error}`));
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (value as CurriculumLessonJson) : null,
  };
}
