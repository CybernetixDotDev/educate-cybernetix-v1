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

export type CurriculumLessonTask = {
  task_id: string;
  title: string;
  instruction: string;
  video_url: string;
  action: string;
  checkpoint_types?: Array<"screenshot" | "file" | "link" | "text">;
  checkpoint_type: "screenshot" | "file" | "link" | "text";
  ai_verification_criteria: string[];
};

export type CurriculumTeachingSequence = {
  cinematic_hook: {
    title: string;
    body: string;
    visual_prompt?: string;
  };
  why_it_matters: {
    title: string;
    body: string;
    relatable_example?: string;
  };
  mental_model: {
    title: string;
    body: string;
    metaphor?: string;
    diagram_prompt?: string;
  };
  i_do: {
    title: string;
    steps: string[];
    example?: string;
  };
  we_do: {
    title: string;
    steps: string[];
    guided_prompt?: string;
  };
  you_do: {
    title: string;
    instruction: string;
    expected_output?: string;
  };
  common_mistake: {
    title: string;
    mistake: string;
    fix: string;
  };
  recap: {
    title: string;
    bullets: string[];
    next_step?: string;
  };
};

export type CurriculumFinalSubmission = {
  required_task_checkpoints: string[];
  final_project_upload: {
    required: boolean;
    prompt: string;
    accepted_formats: Array<"screenshot" | "file" | "link" | "text">;
  };
  micro_survey: [
    {
      question_id: "continue";
      question: "Do you want to continue?";
      type: "yes_no";
    },
    {
      question_id: "most_interesting";
      question: "What was the most interesting thing you learned?";
      type: "text";
    },
  ];
  ai_mentor_final_review: {
    reviews_all_submissions: boolean;
    gives_feedback: boolean;
    awards_completion: boolean;
    unlocks_next_co_op: boolean;
    review_prompt: string;
  };
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
  teaching_sequence?: CurriculumTeachingSequence;
  content: CurriculumContentBlock[];
  tasks: CurriculumLessonTask[];
  final_submission: CurriculumFinalSubmission;
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

function validateLessonTasks(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must contain 5 to 7 guided build tasks.`);
    return;
  }

  if (value.length < 5 || value.length > 7) {
    errors.push(`${path} must contain 5 to 7 guided build tasks.`);
  }

  const checkpointTypes = new Set(["screenshot", "file", "link", "text"]);
  const taskIds = new Set<string>();

  value.forEach((task, index) => {
    if (!isRecord(task)) {
      errors.push(`${path}[${index}] must be an object.`);
      return;
    }

    validateString(task.task_id, `${path}[${index}].task_id`, errors);
    validateString(task.title, `${path}[${index}].title`, errors);
    validateString(task.instruction, `${path}[${index}].instruction`, errors);
    validateString(task.video_url, `${path}[${index}].video_url`, errors);
    validateString(task.action, `${path}[${index}].action`, errors);
    validateStringArray(task.ai_verification_criteria, `${path}[${index}].ai_verification_criteria`, errors);
    if (Array.isArray(task.ai_verification_criteria) && task.ai_verification_criteria.length === 0) {
      errors.push(`${path}[${index}].ai_verification_criteria must include at least one measurable criterion.`);
    }

    if (typeof task.task_id === "string") {
      if (taskIds.has(task.task_id)) errors.push(`${path}[${index}].task_id must be unique.`);
      taskIds.add(task.task_id);
    }

    if (typeof task.checkpoint_type !== "string" || !checkpointTypes.has(task.checkpoint_type)) {
      errors.push(`${path}[${index}].checkpoint_type must be one of screenshot, file, link, text.`);
    }
    validateOptionalStringArray(task.checkpoint_types, `${path}[${index}].checkpoint_types`, errors);
    if (Array.isArray(task.checkpoint_types)) {
      task.checkpoint_types.forEach((checkpointType, checkpointIndex) => {
        if (typeof checkpointType !== "string" || !checkpointTypes.has(checkpointType)) {
          errors.push(`${path}[${index}].checkpoint_types[${checkpointIndex}] must be one of screenshot, file, link, text.`);
        }
      });
    }
  });
}

function validateTeachingSequence(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === null) return;

  if (!isRecord(value)) {
    errors.push(`${path} must be an object when provided.`);
    return;
  }

  const requiredSections = [
    "cinematic_hook",
    "why_it_matters",
    "mental_model",
    "i_do",
    "we_do",
    "you_do",
    "common_mistake",
    "recap",
  ];

  requiredSections.forEach((sectionKey) => {
    if (!isRecord(value[sectionKey])) {
      errors.push(`${path}.${sectionKey} must be an object.`);
    }
  });

  if (isRecord(value.cinematic_hook)) {
    validateString(value.cinematic_hook.title, `${path}.cinematic_hook.title`, errors);
    validateString(value.cinematic_hook.body, `${path}.cinematic_hook.body`, errors);
    validateOptionalString(value.cinematic_hook.visual_prompt, `${path}.cinematic_hook.visual_prompt`, errors);
  }

  if (isRecord(value.why_it_matters)) {
    validateString(value.why_it_matters.title, `${path}.why_it_matters.title`, errors);
    validateString(value.why_it_matters.body, `${path}.why_it_matters.body`, errors);
    validateOptionalString(value.why_it_matters.relatable_example, `${path}.why_it_matters.relatable_example`, errors);
  }

  if (isRecord(value.mental_model)) {
    validateString(value.mental_model.title, `${path}.mental_model.title`, errors);
    validateString(value.mental_model.body, `${path}.mental_model.body`, errors);
    validateOptionalString(value.mental_model.metaphor, `${path}.mental_model.metaphor`, errors);
    validateOptionalString(value.mental_model.diagram_prompt, `${path}.mental_model.diagram_prompt`, errors);
  }

  if (isRecord(value.i_do)) {
    validateString(value.i_do.title, `${path}.i_do.title`, errors);
    validateStringArray(value.i_do.steps, `${path}.i_do.steps`, errors);
    validateOptionalString(value.i_do.example, `${path}.i_do.example`, errors);
  }

  if (isRecord(value.we_do)) {
    validateString(value.we_do.title, `${path}.we_do.title`, errors);
    validateStringArray(value.we_do.steps, `${path}.we_do.steps`, errors);
    validateOptionalString(value.we_do.guided_prompt, `${path}.we_do.guided_prompt`, errors);
  }

  if (isRecord(value.you_do)) {
    validateString(value.you_do.title, `${path}.you_do.title`, errors);
    validateString(value.you_do.instruction, `${path}.you_do.instruction`, errors);
    validateOptionalString(value.you_do.expected_output, `${path}.you_do.expected_output`, errors);
  }

  if (isRecord(value.common_mistake)) {
    validateString(value.common_mistake.title, `${path}.common_mistake.title`, errors);
    validateString(value.common_mistake.mistake, `${path}.common_mistake.mistake`, errors);
    validateString(value.common_mistake.fix, `${path}.common_mistake.fix`, errors);
  }

  if (isRecord(value.recap)) {
    validateString(value.recap.title, `${path}.recap.title`, errors);
    validateStringArray(value.recap.bullets, `${path}.recap.bullets`, errors);
    validateOptionalString(value.recap.next_step, `${path}.recap.next_step`, errors);
  }
}

function validateBoolean(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "boolean") {
    errors.push(`${path} must be a boolean.`);
  }
}

function validateAcceptedFormats(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must contain at least one accepted format.`);
    return;
  }

  const formats = new Set(["screenshot", "file", "link", "text"]);
  value.forEach((format, index) => {
    if (typeof format !== "string" || !formats.has(format)) {
      errors.push(`${path}[${index}] must be one of screenshot, file, link, text.`);
    }
  });
}

function validateFinalSubmission(value: unknown, taskIds: string[], path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  validateStringArray(value.required_task_checkpoints, `${path}.required_task_checkpoints`, errors);
  if (Array.isArray(value.required_task_checkpoints)) {
    const checkpoints = new Set(value.required_task_checkpoints.filter((item): item is string => typeof item === "string"));
    if (checkpoints.size < 5 || checkpoints.size > 7) {
      errors.push(`${path}.required_task_checkpoints must include all 5 to 7 task checkpoint IDs.`);
    }
    taskIds.forEach((taskId) => {
      if (!checkpoints.has(taskId)) {
        errors.push(`${path}.required_task_checkpoints must include task checkpoint ${taskId}.`);
      }
    });
    checkpoints.forEach((taskId) => {
      if (!taskIds.includes(taskId)) {
        errors.push(`${path}.required_task_checkpoints includes unknown task checkpoint ${taskId}.`);
      }
    });
  }

  if (!isRecord(value.final_project_upload)) {
    errors.push(`${path}.final_project_upload must be an object.`);
  } else {
    validateBoolean(value.final_project_upload.required, `${path}.final_project_upload.required`, errors);
    validateString(value.final_project_upload.prompt, `${path}.final_project_upload.prompt`, errors);
    validateAcceptedFormats(value.final_project_upload.accepted_formats, `${path}.final_project_upload.accepted_formats`, errors);
  }

  if (!Array.isArray(value.micro_survey) || value.micro_survey.length !== 2) {
    errors.push(`${path}.micro_survey must contain exactly two questions.`);
  } else {
    const [continueQuestion, interestingQuestion] = value.micro_survey;
    if (!isRecord(continueQuestion)) {
      errors.push(`${path}.micro_survey[0] must be an object.`);
    } else {
      if (continueQuestion.question_id !== "continue") errors.push(`${path}.micro_survey[0].question_id must be continue.`);
      if (continueQuestion.question !== "Do you want to continue?") {
        errors.push(`${path}.micro_survey[0].question must be "Do you want to continue?".`);
      }
      if (continueQuestion.type !== "yes_no") errors.push(`${path}.micro_survey[0].type must be yes_no.`);
    }

    if (!isRecord(interestingQuestion)) {
      errors.push(`${path}.micro_survey[1] must be an object.`);
    } else {
      if (interestingQuestion.question_id !== "most_interesting") {
        errors.push(`${path}.micro_survey[1].question_id must be most_interesting.`);
      }
      if (interestingQuestion.question !== "What was the most interesting thing you learned?") {
        errors.push(`${path}.micro_survey[1].question must be "What was the most interesting thing you learned?".`);
      }
      if (interestingQuestion.type !== "text") errors.push(`${path}.micro_survey[1].type must be text.`);
    }
  }

  if (!isRecord(value.ai_mentor_final_review)) {
    errors.push(`${path}.ai_mentor_final_review must be an object.`);
  } else {
    validateBoolean(value.ai_mentor_final_review.reviews_all_submissions, `${path}.ai_mentor_final_review.reviews_all_submissions`, errors);
    validateBoolean(value.ai_mentor_final_review.gives_feedback, `${path}.ai_mentor_final_review.gives_feedback`, errors);
    validateBoolean(value.ai_mentor_final_review.awards_completion, `${path}.ai_mentor_final_review.awards_completion`, errors);
    validateBoolean(value.ai_mentor_final_review.unlocks_next_co_op, `${path}.ai_mentor_final_review.unlocks_next_co_op`, errors);
    validateString(value.ai_mentor_final_review.review_prompt, `${path}.ai_mentor_final_review.review_prompt`, errors);
    if (value.ai_mentor_final_review.reviews_all_submissions !== true) {
      errors.push(`${path}.ai_mentor_final_review.reviews_all_submissions must be true.`);
    }
    if (value.ai_mentor_final_review.gives_feedback !== true) {
      errors.push(`${path}.ai_mentor_final_review.gives_feedback must be true.`);
    }
    if (value.ai_mentor_final_review.awards_completion !== true) {
      errors.push(`${path}.ai_mentor_final_review.awards_completion must be true.`);
    }
    if (value.ai_mentor_final_review.unlocks_next_co_op !== true) {
      errors.push(`${path}.ai_mentor_final_review.unlocks_next_co_op must be true.`);
    }
  }
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
  validateTeachingSequence(value.teaching_sequence, "teaching_sequence", errors);

  if (value.video !== undefined && value.video !== null) {
    validateContentBlock(value.video, "video", errors);
  }

  if (!Array.isArray(value.content) || value.content.length === 0) {
    errors.push("content must contain at least one block.");
  } else {
    value.content.forEach((block, index) => validateContentBlock(block, `content[${index}]`, errors));
  }

  validateLessonTasks(value.tasks, "tasks", errors);
  const taskIds = Array.isArray(value.tasks)
    ? value.tasks.filter(isRecord).map((task) => task.task_id).filter((taskId): taskId is string => typeof taskId === "string")
    : [];
  validateFinalSubmission(value.final_submission, taskIds, "final_submission", errors);

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
