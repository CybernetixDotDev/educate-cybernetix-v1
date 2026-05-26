import type { QuizQuestion } from "@/hooks/useQuiz";
import type { TeachingSequence } from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/client";

export type LessonCodeExample = {
  title: string;
  language: string;
  code: string;
};

export type LessonImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type LessonVideo = {
  url: string;
  title: string;
  provider?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  transcript?: string;
};

export type LessonCheckpointType = "screenshot" | "file" | "link" | "text";

export type LessonTask = {
  task_id: string;
  title: string;
  instruction: string;
  video_url?: string;
  action: string;
  checkpoint_types?: LessonCheckpointType[];
  checkpoint_type: LessonCheckpointType;
  ai_verification_criteria: string[];
};

export type LessonFinalSubmission = {
  required_task_checkpoints: string[];
  final_project_upload: {
    required: boolean;
    prompt: string;
    accepted_formats: LessonCheckpointType[];
  };
  micro_survey: Array<{
    question_id: string;
    question: string;
    type: "yes_no" | "text";
  }>;
  ai_mentor_final_review: {
    reviews_all_submissions: boolean;
    gives_feedback: boolean;
    awards_completion: boolean;
    unlocks_next_co_op: boolean;
    review_prompt: string;
  };
};

export type LessonSection = {
  heading: string;
  body: string;
  tone?: "default" | "goal" | "example" | "task" | "checkpoint" | "mistake" | "mentor" | "recap" | "diagram";
};

export type LessonQuizMetadata = {
  quiz_key: string;
  title: string;
  passing_score: number;
  questions: QuizQuestion[];
};

export type LessonTeachingSequence = TeachingSequence;

export type Lesson = {
  moduleId: string;
  lessonId: string;
  title: string;
  summary: string;
  objectives: string[];
  teachingSequence: LessonTeachingSequence | null;
  body: LessonSection[];
  codeExamples: LessonCodeExample[];
  images: LessonImage[];
  videos: LessonVideo[];
  tasks: LessonTask[];
  finalSubmission: LessonFinalSubmission | null;
  quiz: LessonQuizMetadata;
};

export type LessonNavigation = {
  previous: { moduleId: string; lessonId: string } | null;
  next: { moduleId: string; lessonId: string; label: string; isNextModule: boolean } | null;
};

type ContentBlock = {
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

type LessonVersionJson = {
  id: string;
  title: string;
  description?: string;
  section?: string;
  estimated_minutes?: number;
  video?: ContentBlock | null;
  objectives?: string[];
  teaching_sequence?: LessonTeachingSequence;
  content?: ContentBlock[];
  tasks?: LessonTask[];
  final_submission?: LessonFinalSubmission;
  quiz?: QuizVersionJson;
};

type QuizVersionJson = {
  id?: string;
  questions?: Array<{
    question: string;
    options?: string[];
    answer?: string | string[] | number | boolean | null;
    explanation?: string;
  }>;
};

type LessonRow = {
  id: string;
  module_id: string;
  lesson_key: string | null;
  title: string;
  order_index: number;
  current_version_id: string | null;
  modules?: { module_key: string | null; title: string | null } | Array<{ module_key: string | null; title: string | null }> | null;
};

type QuizRow = {
  id: string;
  current_version_id: string | null;
};

type LessonVersionRow = {
  id: string;
  content_json: LessonVersionJson;
};

type QuizVersionRow = {
  id: string;
  content_json: QuizVersionJson;
};

const MODULE_ORDER = [
  "week1-internet-html-css",
  "week2-tailwind-uiux",
  "week3-git-github-terminal",
  "week4-javascript-fundamentals",
  "week5-nextjs-fundamentals",
  "week6-apis-datafetching",
  "week7-supabase-database-auth",
  "week8-threejs-fundamentals",
  "week9-project-planning",
  "week10-build-phase-1",
  "week11-build-phase-2",
  "week12-deploy-present",
] as const;

const LESSON_ORDER = ["intro", "practice", "checkpoint"] as const;

const IMPORTED_LESSON_ORDER: Record<string, Array<{ lessonId: string; title: string }>> = {
  "week1-internet-html-css": [
    { lessonId: "w1d1", title: "How the Internet Works" },
    { lessonId: "w1d2", title: "HTML Structure" },
    { lessonId: "w1d3", title: "CSS Basics" },
    { lessonId: "w1d4", title: "Box Model & Layout" },
    { lessonId: "w1d5", title: "Responsive Design" },
  ],
};

const IMPORTED_FIRST_LESSON: Record<string, string> = {
  "week1-internet-html-css": "w1d1",
};

const WEEK1_AUTHORED_LESSONS: Record<string, LessonVersionJson> = {
  w1d1: {
    id: "w1d1",
    title: "How the Internet Works",
    objectives: ["Understand how browsers request webpages", "Identify clients, servers, DNS, HTTP, APIs, and databases"],
    content: [
      { type: "text", value: "The internet is a global network of computers that communicate using standardized rules called protocols." },
      { type: "text", value: "When you type a website into your browser, several steps happen behind the scenes." },
      { type: "example", value: "Typing google.com -> DNS lookup -> server request -> server response -> browser renders page." },
      { type: "text", value: "Key concepts: server, client, DNS, HTTP, API, database." },
      { type: "tip", value: "Draw a simple diagram showing how a browser requests a webpage from a server." },
    ],
    quiz: {
      id: "w1d1-quiz",
      questions: [
        { question: "What does DNS do?", options: ["Translates domain names to IP addresses", "Stores website files"], answer: "Translates domain names to IP addresses" },
        { question: "A server sends data back to the client.", options: ["True", "False"], answer: "True" },
        { question: "Which protocol is used to load webpages?", options: ["FTP", "HTTP"], answer: "HTTP" },
      ],
    },
  },
  w1d2: {
    id: "w1d2",
    title: "HTML Structure",
    objectives: ["Understand HTML as webpage structure", "Build a simple About Me page"],
    content: [
      { type: "text", value: "HTML is the structure of a webpage. It defines the content and layout." },
      { type: "code", value: "<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>" },
      { type: "tip", value: "Create an About Me page with a heading, paragraph, and image." },
    ],
    quiz: {
      id: "w1d2-quiz",
      questions: [
        { question: "Which tag defines the main content?", options: ["<head>", "<body>"], answer: "<body>" },
        { question: "<h1> is used for the largest heading.", options: ["True", "False"], answer: "True" },
      ],
    },
  },
  w1d3: {
    id: "w1d3",
    title: "CSS Basics",
    objectives: ["Understand CSS styling", "Style an About Me page"],
    content: [
      { type: "text", value: "CSS controls the styling of a webpage: colors, fonts, spacing, layout." },
      { type: "code", value: "h1 { color: blue; font-size: 32px; }" },
      { type: "tip", value: "Style your About Me page with colors and fonts." },
    ],
    quiz: {
      id: "w1d3-quiz",
      questions: [{ question: "Which property changes text color?", options: ["font-size", "color"], answer: "color" }],
    },
  },
  w1d4: {
    id: "w1d4",
    title: "Box Model & Layout",
    objectives: ["Understand margin, border, padding, and content", "Create a simple card layout"],
    content: [
      { type: "text", value: "Every element in CSS is a box with margin, border, padding, and content." },
      { type: "image", value: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model/box-model.png" },
      { type: "tip", value: "Create a card layout using margin, padding, and borders." },
    ],
    quiz: {
      id: "w1d4-quiz",
      questions: [{ question: "Padding is the space outside the border.", options: ["True", "False"], answer: "False" }],
    },
  },
  w1d5: {
    id: "w1d5",
    title: "Responsive Design",
    objectives: ["Understand responsive design", "Use a media query"],
    content: [
      { type: "text", value: "Responsive design ensures your site looks good on all screen sizes." },
      { type: "code", value: "@media (max-width: 600px) { h1 { font-size: 20px; } }" },
      { type: "tip", value: "Make your About Me page mobile-friendly." },
    ],
    quiz: {
      id: "w1d5-quiz",
      questions: [{ question: "Which CSS feature is used for responsive design?", options: ["Variables", "Media queries"], answer: "Media queries" }],
    },
  },
};

const MODULE_TITLES: Record<string, string> = {
  "week1-internet-html-css": "Internet, HTML, and CSS",
  "week2-tailwind-uiux": "Tailwind, UI, and UX",
  "week3-git-github-terminal": "Git, GitHub, and Terminal",
  "week4-javascript-fundamentals": "JavaScript Fundamentals",
  "week5-nextjs-fundamentals": "Next.js Fundamentals",
  "week6-apis-datafetching": "APIs and Data Fetching",
  "week7-supabase-database-auth": "Supabase Database and Auth",
  "week8-threejs-fundamentals": "Three.js Fundamentals",
  "week9-project-planning": "Project Planning",
  "week10-build-phase-1": "Build Phase 1",
  "week11-build-phase-2": "Build Phase 2",
  "week12-deploy-present": "Deploy and Present",
};

const SKILL_BY_MODULE: Record<string, string> = {
  "week1-internet-html-css": "html",
  "week2-tailwind-uiux": "css",
  "week3-git-github-terminal": "project_management",
  "week4-javascript-fundamentals": "javascript",
  "week5-nextjs-fundamentals": "nextjs",
  "week6-apis-datafetching": "apis",
  "week7-supabase-database-auth": "supabase",
  "week8-threejs-fundamentals": "threejs",
  "week9-project-planning": "project_management",
  "week10-build-phase-1": "project_management",
  "week11-build-phase-2": "project_management",
  "week12-deploy-present": "project_management",
};

const LESSON_LABELS: Record<string, string> = {
  intro: "Concepts",
  practice: "Guided Practice",
  checkpoint: "Checkpoint",
};

function humanize(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function getSkill(moduleId: string) {
  return SKILL_BY_MODULE[moduleId] ?? "project_management";
}

export function getCanonicalLessonId(moduleId: string, lessonId: string) {
  if (lessonId === "intro") {
    return IMPORTED_FIRST_LESSON[moduleId] ?? lessonId;
  }

  if (moduleId === "week1-internet-html-css" && /^w1l\d+$/.test(lessonId)) {
    return lessonId.replace("w1l", "w1d");
  }

  return lessonId;
}

function buildLesson(moduleId: string, lessonId: string): Lesson {
  const moduleTitle = MODULE_TITLES[moduleId] ?? humanize(moduleId);
  const lessonLabel = LESSON_LABELS[lessonId] ?? humanize(lessonId);
  const skill = getSkill(moduleId);

  return {
    moduleId,
    lessonId,
    title: `${moduleTitle}: ${lessonLabel}`,
    summary: `Learn the core ${moduleTitle.toLowerCase()} idea, practice it, then check your understanding with a short quiz.`,
    objectives: [],
    teachingSequence: null,
    body: [
      {
        heading: "What you are learning",
        body: `This lesson focuses on ${moduleTitle.toLowerCase()} through one practical idea you can use in your project today.`,
      },
      {
        heading: "Why it matters",
        body: "Good builders understand both the tool and the reason behind it.",
      },
      {
        heading: "Your quick challenge",
        body: "Change one part of the example, predict what will happen, test it, and write down what you learned.",
      },
    ],
    codeExamples: [
      {
        title: "Tiny practice pattern",
        language: moduleId.includes("javascript") || moduleId.includes("nextjs") ? "tsx" : "html",
        code: `<section class="lesson-card">\n  <h2>${moduleTitle}</h2>\n  <p>Build, test, improve.</p>\n</section>`,
      },
    ],
    images: [],
    videos: [],
    tasks: [],
    finalSubmission: null,
    quiz: {
      quiz_key: `${moduleId}-${lessonId}`,
      title: `${lessonLabel} Quiz`,
      passing_score: 80,
      questions: [
        {
          id: "purpose",
          prompt: `What is the main goal of this ${moduleTitle} lesson?`,
          options: ["Copy code without understanding it", "Connect a concept to a practical project step"],
          correct_answer: "Connect a concept to a practical project step",
          points: 1,
          metadata: { skill },
        },
      ],
    },
  };
}

function buildAuthoredFallbackLesson(moduleId: string, lessonId: string) {
  if (moduleId !== "week1-internet-html-css") return null;

  const fallbackLessonId = lessonId.replace("w1l", "w1d");
  const authoredLesson = WEEK1_AUTHORED_LESSONS[lessonId] ?? WEEK1_AUTHORED_LESSONS[fallbackLessonId];
  return authoredLesson ? transformLesson(moduleId, lessonId, authoredLesson, authoredLesson.quiz ?? null) : null;
}

const SECTION_LABELS: Record<ContentBlock["type"], { heading: string; tone: LessonSection["tone"] }> = {
  learning_goal: { heading: "Learning Goal", tone: "goal" },
  text: { heading: "Key Idea", tone: "default" },
  example: { heading: "Example", tone: "example" },
  code: { heading: "Code", tone: "default" },
  image: { heading: "Image", tone: "default" },
  video: { heading: "Video", tone: "default" },
  diagram: { heading: "Diagram", tone: "diagram" },
  task: { heading: "Task", tone: "task" },
  checkpoint: { heading: "Checkpoint", tone: "checkpoint" },
  common_mistake: { heading: "Common Mistake", tone: "mistake" },
  mentor_prompt: { heading: "Ask Your Mentor", tone: "mentor" },
  recap: { heading: "Recap", tone: "recap" },
  tip: { heading: "Tip", tone: "task" },
};

function blockText(block: ContentBlock) {
  return block.value ?? block.url ?? "";
}

function sectionLabelFor(block: ContentBlock, index: number) {
  const knownLabel = SECTION_LABELS[block.type];

  if (knownLabel) {
    return {
      heading: block.title ?? (block.type === "text" && index === 0 ? "Lesson" : knownLabel.heading),
      tone: knownLabel.tone,
    };
  }

  return {
    heading: block.title ?? "Lesson",
    tone: "default" as const,
  };
}

const CHECKPOINT_TYPES = new Set<LessonCheckpointType>(["screenshot", "file", "link", "text"]);

function normalizeCheckpointType(value: unknown): LessonCheckpointType {
  return typeof value === "string" && CHECKPOINT_TYPES.has(value as LessonCheckpointType) ? value as LessonCheckpointType : "text";
}

function normalizeCheckpointTypes(value: unknown, fallback: LessonCheckpointType): LessonCheckpointType[] {
  const formats = Array.isArray(value)
    ? value.map(normalizeCheckpointType).filter((item, index, array) => array.indexOf(item) === index)
    : [];

  return formats.length > 0 ? formats : [fallback];
}

function normalizeTasks(value: unknown): LessonTask[] {
  if (!Array.isArray(value)) return [];

  const tasks: LessonTask[] = [];

  value.forEach((task, index) => {
      if (typeof task !== "object" || task === null || Array.isArray(task)) return null;
      const record = task as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title : `Task ${index + 1}`;
      const taskId = typeof record.task_id === "string" ? record.task_id : `task-${index + 1}`;
      const criteria = Array.isArray(record.ai_verification_criteria)
        ? record.ai_verification_criteria.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
      const videoUrl = typeof record.video_url === "string" && record.video_url.trim() ? record.video_url : undefined;

      const checkpointType = normalizeCheckpointType(record.checkpoint_type);

      tasks.push({
        task_id: taskId,
        title,
        instruction: typeof record.instruction === "string" ? record.instruction : "",
        ...(videoUrl ? { video_url: videoUrl } : {}),
        action: typeof record.action === "string" ? record.action : "",
        checkpoint_type: checkpointType,
        checkpoint_types: normalizeCheckpointTypes(record.checkpoint_types, checkpointType),
        ai_verification_criteria: criteria,
      });
    });

  return tasks;
}

function normalizeTeachingSequence(value: unknown): LessonTeachingSequence | null {
  if (!isRecord(value)) return null;

  const section = (key: keyof LessonTeachingSequence) => isRecord(value[key]) ? value[key] as Record<string, unknown> : null;
  const cinematicHook = section("cinematic_hook");
  const whyItMatters = section("why_it_matters");
  const mentalModel = section("mental_model");
  const iDo = section("i_do");
  const weDo = section("we_do");
  const youDo = section("you_do");
  const commonMistake = section("common_mistake");
  const recap = section("recap");

  if (!cinematicHook || !whyItMatters || !mentalModel || !iDo || !weDo || !youDo || !commonMistake || !recap) {
    return null;
  }

  return {
    cinematic_hook: {
      title: stringValue(cinematicHook.title, "Start here"),
      body: stringValue(cinematicHook.body),
      visual_prompt: stringValue(cinematicHook.visual_prompt) || undefined,
    },
    why_it_matters: {
      title: stringValue(whyItMatters.title, "Why it matters"),
      body: stringValue(whyItMatters.body),
      relatable_example: stringValue(whyItMatters.relatable_example) || undefined,
    },
    mental_model: {
      title: stringValue(mentalModel.title, "Mental model"),
      body: stringValue(mentalModel.body),
      metaphor: stringValue(mentalModel.metaphor) || undefined,
      diagram_prompt: stringValue(mentalModel.diagram_prompt) || undefined,
    },
    i_do: {
      title: stringValue(iDo.title, "I do"),
      steps: stringArray(iDo.steps),
      example: stringValue(iDo.example) || undefined,
    },
    we_do: {
      title: stringValue(weDo.title, "We do"),
      steps: stringArray(weDo.steps),
      guided_prompt: stringValue(weDo.guided_prompt) || undefined,
    },
    you_do: {
      title: stringValue(youDo.title, "You do"),
      instruction: stringValue(youDo.instruction),
      expected_output: stringValue(youDo.expected_output) || undefined,
    },
    common_mistake: {
      title: stringValue(commonMistake.title, "Common mistake"),
      mistake: stringValue(commonMistake.mistake),
      fix: stringValue(commonMistake.fix),
    },
    recap: {
      title: stringValue(recap.title, "Recap"),
      bullets: stringArray(recap.bullets),
      next_step: stringValue(recap.next_step) || undefined,
    },
  };
}

function normalizeFinalSubmission(value: unknown, tasks: LessonTask[]): LessonFinalSubmission | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    if (tasks.length === 0) return null;

    return {
      required_task_checkpoints: tasks.map((task) => task.task_id),
      final_project_upload: {
        required: true,
        prompt: "Share the finished project or a screenshot of your work.",
        accepted_formats: ["screenshot", "link", "text"],
      },
      micro_survey: [
        { question_id: "continue", question: "Do you want to continue?", type: "yes_no" },
        { question_id: "most_interesting", question: "What was the most interesting thing you learned?", type: "text" },
      ],
      ai_mentor_final_review: {
        reviews_all_submissions: true,
        gives_feedback: true,
        awards_completion: true,
        unlocks_next_co_op: true,
        review_prompt: "Review all checkpoint submissions and give supportive next-step feedback.",
      },
    };
  }

  const record = value as Record<string, unknown>;
  const upload = typeof record.final_project_upload === "object" && record.final_project_upload !== null && !Array.isArray(record.final_project_upload)
    ? record.final_project_upload as Record<string, unknown>
    : {};
  const review = typeof record.ai_mentor_final_review === "object" && record.ai_mentor_final_review !== null && !Array.isArray(record.ai_mentor_final_review)
    ? record.ai_mentor_final_review as Record<string, unknown>
    : {};
  const rawSurvey = Array.isArray(record.micro_survey) ? record.micro_survey : [];
  const microSurvey = rawSurvey
    .map((question, index) => {
      if (typeof question !== "object" || question === null || Array.isArray(question)) return null;
      const item = question as Record<string, unknown>;
      return {
        question_id: typeof item.question_id === "string" ? item.question_id : `question-${index + 1}`,
        question: typeof item.question === "string" ? item.question : "",
        type: item.type === "yes_no" ? "yes_no" as const : "text" as const,
      };
    })
    .filter((question): question is LessonFinalSubmission["micro_survey"][number] => Boolean(question?.question));

  return {
    required_task_checkpoints: Array.isArray(record.required_task_checkpoints)
      ? record.required_task_checkpoints.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : tasks.map((task) => task.task_id),
    final_project_upload: {
      required: typeof upload.required === "boolean" ? upload.required : true,
      prompt: typeof upload.prompt === "string" ? upload.prompt : "Share the finished project or a screenshot of your work.",
      accepted_formats: Array.isArray(upload.accepted_formats)
        ? upload.accepted_formats.map(normalizeCheckpointType)
        : ["screenshot", "link", "text"],
    },
    micro_survey: microSurvey.length > 0
      ? microSurvey
      : [
          { question_id: "continue", question: "Do you want to continue?", type: "yes_no" },
          { question_id: "most_interesting", question: "What was the most interesting thing you learned?", type: "text" },
        ],
    ai_mentor_final_review: {
      reviews_all_submissions: typeof review.reviews_all_submissions === "boolean" ? review.reviews_all_submissions : true,
      gives_feedback: typeof review.gives_feedback === "boolean" ? review.gives_feedback : true,
      awards_completion: typeof review.awards_completion === "boolean" ? review.awards_completion : true,
      unlocks_next_co_op: typeof review.unlocks_next_co_op === "boolean" ? review.unlocks_next_co_op : true,
      review_prompt: typeof review.review_prompt === "string"
        ? review.review_prompt
        : "Review all checkpoint submissions and give supportive next-step feedback.",
    },
  };
}

function transformLesson(moduleId: string, lessonId: string, lessonJson: LessonVersionJson, quizJson: QuizVersionJson | null): Lesson {
  const content = lessonJson.content ?? [];
  const objectives = lessonJson.objectives ?? [];
  const tasks = normalizeTasks(lessonJson.tasks);
  const finalSubmission = normalizeFinalSubmission(lessonJson.final_submission, tasks);
  const teachingSequence = normalizeTeachingSequence(lessonJson.teaching_sequence);
  const body: LessonSection[] = [
    ...content
      .filter((block) => !["code", "image", "video"].includes(block.type))
      .map((block, index) => {
        const label = sectionLabelFor(block, index);
        return {
          heading: label.heading,
          body: blockText(block),
          tone: label.tone,
        };
      })
      .filter((section) => section.body.trim().length > 0),
  ];

  const codeExamples = content
    .filter((block) => block.type === "code")
    .map((block, index) => ({
      title: block.title ?? `Code Example ${index + 1}`,
      language: block.language ?? "html",
      code: blockText(block),
    }));

  const images = content
    .filter((block) => block.type === "image")
    .map((block, index) => ({
      src: block.url ?? block.value ?? "",
      alt: block.alt ?? block.title ?? `${lessonJson.title} image ${index + 1}`,
      caption: block.title,
    }))
    .filter((image) => image.src);

  const videos = [
    ...(lessonJson.video ? [lessonJson.video] : []),
    ...content.filter((block) => block.type === "video"),
  ]
    .map((block, index) => ({
      url: block.url ?? block.value ?? "",
      title: block.title ?? `${lessonJson.title} video ${index + 1}`,
      provider: block.provider,
      duration_seconds: block.duration_seconds,
      thumbnail_url: block.thumbnail_url,
      transcript: block.transcript,
    }))
    .filter((video) => video.url);

  const quizSource = quizJson ?? lessonJson.quiz ?? { questions: [] };
  const questions = (quizSource.questions ?? []).map((question, index): QuizQuestion => ({
    id: `${lessonId}-${index + 1}`,
    prompt: question.question,
    options: question.options,
    correct_answer: question.answer,
    points: 1,
    metadata: { skill: getSkill(moduleId), explanation: question.explanation },
  }));

  return {
    moduleId,
    lessonId,
    title: lessonJson.title,
    summary: lessonJson.description ?? objectives[0] ?? `Complete ${lessonJson.title} and check your understanding.`,
    objectives,
    teachingSequence,
    body: body.length > 0 ? body : [{ heading: "Lesson", body: "Lesson content is being prepared." }],
    codeExamples,
    images,
    videos,
    tasks,
    finalSubmission,
    quiz: {
      quiz_key: quizSource.id ?? `${moduleId}-${lessonId}`,
      title: `${lessonJson.title} Quiz`,
      passing_score: 80,
      questions,
    },
  };
}

async function fetchLessonRow(moduleId: string, lessonId: string): Promise<LessonRow | null> {
  const supabase = createClient();
  const { data: lessonRows, error } = await supabase
    .from("lessons")
    .select("id, module_id, lesson_key, title, order_index, current_version_id, modules!inner(module_key, title)")
    .eq("lesson_key", lessonId)
    .eq("modules.module_key", moduleId)
    .limit(1);

  if (error) {
    return null;
  }

  return (lessonRows?.[0] ?? null) as unknown as LessonRow | null;
}

async function fetchFirstLessonRow(moduleId: string): Promise<LessonRow | null> {
  const supabase = createClient();
  const { data: lessonRows, error } = await supabase
    .from("lessons")
    .select("id, module_id, lesson_key, title, order_index, current_version_id, modules!inner(module_key, title)")
    .eq("modules.module_key", moduleId)
    .order("order_index", { ascending: true })
    .limit(1);

  if (error) {
    return null;
  }

  return (lessonRows?.[0] ?? null) as unknown as LessonRow | null;
}

async function fetchCurrentLessonVersion(lessonRow: LessonRow): Promise<LessonVersionRow | null> {
  const supabase = createClient();

  if (lessonRow.current_version_id) {
    const { data, error } = await supabase
      .from("lesson_versions")
      .select("id, content_json")
      .eq("id", lessonRow.current_version_id)
      .maybeSingle();

    if (!error && data?.content_json) {
      return data as unknown as LessonVersionRow;
    }
  }

  const { data: versions, error } = await supabase
    .from("lesson_versions")
    .select("id, content_json")
    .eq("lesson_id", lessonRow.id)
    .order("version_number", { ascending: false })
    .limit(1);

  if (error) return null;
  return (versions?.[0] ?? null) as unknown as LessonVersionRow | null;
}

async function fetchCurrentQuizVersion(lessonId: string): Promise<QuizVersionRow | null> {
  const supabase = createClient();
  const { data: quizRows, error: quizError } = await supabase
    .from("quizzes")
    .select("id, current_version_id")
    .eq("lesson_id", lessonId)
    .limit(1);

  if (quizError) return null;

  const quizRow = (quizRows?.[0] ?? null) as QuizRow | null;
  if (!quizRow) return null;

  if (quizRow.current_version_id) {
    const { data, error } = await supabase
      .from("quiz_versions")
      .select("id, content_json")
      .eq("id", quizRow.current_version_id)
      .maybeSingle();

    if (!error && data?.content_json) {
      return data as unknown as QuizVersionRow;
    }
  }

  const { data: versions, error } = await supabase
    .from("quiz_versions")
    .select("id, content_json")
    .eq("quiz_id", quizRow.id)
    .order("version_number", { ascending: false })
    .limit(1);

  if (error) return null;
  return (versions?.[0] ?? null) as unknown as QuizVersionRow | null;
}

export async function getLesson(moduleId: string, lessonId: string): Promise<Lesson> {
  const canonicalLessonId = getCanonicalLessonId(moduleId, lessonId);
  const firstLessonAlias = IMPORTED_FIRST_LESSON[moduleId];
  const shouldUseFirstLesson = lessonId === "intro" || canonicalLessonId === firstLessonAlias;
  const lessonRow = (await fetchLessonRow(moduleId, canonicalLessonId)) ?? (shouldUseFirstLesson ? await fetchFirstLessonRow(moduleId) : null);
  const lessonVersion = lessonRow ? await fetchCurrentLessonVersion(lessonRow) : null;

  if (!lessonRow || !lessonVersion?.content_json) {
    return buildAuthoredFallbackLesson(moduleId, canonicalLessonId) ?? buildLesson(moduleId, canonicalLessonId);
  }

  const quizVersion = await fetchCurrentQuizVersion(lessonRow.id);

  return transformLesson(moduleId, lessonRow.lesson_key ?? lessonId, lessonVersion.content_json, quizVersion?.content_json ?? null);
}

export function getLessonNavigation(moduleId: string, lessonId: string): LessonNavigation {
  const importedLessons = IMPORTED_LESSON_ORDER[moduleId];

  if (importedLessons) {
    const lessonIndex = importedLessons.findIndex((item) => item.lessonId === lessonId);

    if (lessonIndex >= 0) {
      const previousLesson = importedLessons[lessonIndex - 1];
      const nextLesson = importedLessons[lessonIndex + 1];
      const nextModule = MODULE_ORDER[MODULE_ORDER.findIndex((item) => item === moduleId) + 1];

      return {
        previous: previousLesson ? { moduleId, lessonId: previousLesson.lessonId } : null,
        next: nextLesson
          ? {
              moduleId,
              lessonId: nextLesson.lessonId,
              label: `Next Lesson: ${nextLesson.title}`,
              isNextModule: false,
            }
          : nextModule
            ? {
                moduleId: nextModule,
                lessonId: "intro",
                label: `Proceed to Next Module: ${MODULE_TITLES[nextModule]}`,
                isNextModule: true,
              }
            : null,
      };
    }
  }

  const moduleIndex = MODULE_ORDER.findIndex((item) => item === moduleId);
  const lessonIndex = LESSON_ORDER.findIndex((item) => item === lessonId);
  const safeLessonIndex = lessonIndex >= 0 ? lessonIndex : 0;
  const previousLesson = LESSON_ORDER[safeLessonIndex - 1];
  const nextLesson = LESSON_ORDER[safeLessonIndex + 1];

  if (!LESSON_ORDER.includes(lessonId as (typeof LESSON_ORDER)[number])) {
    return {
      previous: null,
      next: null,
    };
  }

  if (nextLesson) {
    return {
      previous: previousLesson ? { moduleId, lessonId: previousLesson } : null,
      next: {
        moduleId,
        lessonId: nextLesson,
        label: `Next Lesson: ${LESSON_LABELS[nextLesson]}`,
        isNextModule: false,
      },
    };
  }

  const nextModule = MODULE_ORDER[moduleIndex + 1];

  return {
    previous: previousLesson ? { moduleId, lessonId: previousLesson } : null,
    next: nextModule
      ? {
          moduleId: nextModule,
          lessonId: "intro",
          label: `Proceed to Next Module: ${MODULE_TITLES[nextModule]}`,
          isNextModule: true,
        }
      : null,
  };
}
