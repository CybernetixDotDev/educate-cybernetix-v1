export type CurriculumContentBlock = {
  type: "text" | "image" | "code" | "tip" | "example";
  value: string;
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
  title: string;
  objectives: string[];
  content: CurriculumContentBlock[];
  quiz: CurriculumQuizJson;
};

export type ValidationResult<T = unknown> = {
  valid: boolean;
  errors: string[];
  data: T | null;
};

const BLOCK_TYPES = new Set(["text", "image", "code", "tip", "example"]);

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
  validateStringArray(value.objectives, "objectives", errors);

  if (!Array.isArray(value.content) || value.content.length === 0) {
    errors.push("content must contain at least one block.");
  } else {
    value.content.forEach((block, index) => {
      if (!isRecord(block)) {
        errors.push(`content[${index}] must be an object.`);
        return;
      }

      if (typeof block.type !== "string" || !BLOCK_TYPES.has(block.type)) {
        errors.push(`content[${index}].type must be one of text, image, code, tip, example.`);
      }

      validateString(block.value, `content[${index}].value`, errors);
    });
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

