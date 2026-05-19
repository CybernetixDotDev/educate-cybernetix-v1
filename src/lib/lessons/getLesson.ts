import type { QuizQuestion } from "@/hooks/useQuiz";
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

export type Lesson = {
  moduleId: string;
  lessonId: string;
  title: string;
  summary: string;
  body: LessonSection[];
  codeExamples: LessonCodeExample[];
  images: LessonImage[];
  videos: LessonVideo[];
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
  video?: ContentBlock | null;
  objectives?: string[];
  content?: ContentBlock[];
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
  lesson_versions?: Array<{ id: string; content_json: LessonVersionJson }>;
  modules?: { module_key: string | null; title: string | null } | Array<{ module_key: string | null; title: string | null }> | null;
};

type QuizRow = {
  id: string;
  current_version_id: string | null;
  quiz_versions?: Array<{ id: string; content_json: QuizVersionJson }>;
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
    { lessonId: "w1l1", title: "How the Internet Works" },
    { lessonId: "w1l2", title: "HTML Structure" },
    { lessonId: "w1l3", title: "CSS Basics" },
    { lessonId: "w1l4", title: "Box Model & Layout" },
    { lessonId: "w1l5", title: "Responsive Design" },
  ],
};

const IMPORTED_FIRST_LESSON: Record<string, string> = {
  "week1-internet-html-css": "w1l1",
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

function getSkill(moduleId: string) {
  return SKILL_BY_MODULE[moduleId] ?? "project_management";
}

export function getCanonicalLessonId(moduleId: string, lessonId: string) {
  if (lessonId === "intro") {
    return IMPORTED_FIRST_LESSON[moduleId] ?? lessonId;
  }

  if (moduleId === "week1-internet-html-css" && /^w1d\d+$/.test(lessonId)) {
    return lessonId.replace("w1d", "w1l");
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

function transformLesson(moduleId: string, lessonId: string, lessonJson: LessonVersionJson, quizJson: QuizVersionJson | null): Lesson {
  const content = lessonJson.content ?? [];
  const objectives = lessonJson.objectives ?? [];
  const body: LessonSection[] = [
    ...(objectives.length > 0
      ? [{
          heading: "Objectives",
          body: objectives.map((objective) => `- ${objective}`).join("\n"),
        }]
      : []),
    ...content
      .filter((block) => !["code", "image", "video"].includes(block.type))
      .map((block, index) => ({
        heading: block.title ?? (block.type === "text" && index === 0 ? "Lesson" : SECTION_LABELS[block.type].heading),
        body: blockText(block),
        tone: SECTION_LABELS[block.type].tone,
      })),
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
    body: body.length > 0 ? body : [{ heading: "Lesson", body: "Lesson content is being prepared." }],
    codeExamples,
    images,
    videos,
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
    .select("id, module_id, lesson_key, title, order_index, current_version_id, modules!inner(module_key, title), lesson_versions(id, content_json)")
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
    .select("id, module_id, lesson_key, title, order_index, current_version_id, modules!inner(module_key, title), lesson_versions(id, content_json)")
    .eq("modules.module_key", moduleId)
    .order("order_index", { ascending: true })
    .limit(1);

  if (error) {
    return null;
  }

  return (lessonRows?.[0] ?? null) as unknown as LessonRow | null;
}

export async function getLesson(moduleId: string, lessonId: string): Promise<Lesson> {
  const supabase = createClient();
  const canonicalLessonId = getCanonicalLessonId(moduleId, lessonId);
  const firstLessonAlias = IMPORTED_FIRST_LESSON[moduleId];
  const shouldUseFirstLesson = lessonId === "intro" || canonicalLessonId === firstLessonAlias;
  const lessonRow = (await fetchLessonRow(moduleId, canonicalLessonId)) ?? (shouldUseFirstLesson ? await fetchFirstLessonRow(moduleId) : null);
  const lessonVersion = lessonRow?.lesson_versions?.find((version) => version.id === lessonRow.current_version_id) ?? lessonRow?.lesson_versions?.[0];

  if (!lessonRow || !lessonVersion?.content_json) {
    return buildAuthoredFallbackLesson(moduleId, canonicalLessonId) ?? buildLesson(moduleId, canonicalLessonId);
  }

  const { data: quizRows } = await supabase
    .from("quizzes")
    .select("id, current_version_id, quiz_versions(id, content_json)")
    .eq("lesson_id", lessonRow.id)
    .limit(1);
  const quizRow = (quizRows?.[0] ?? null) as QuizRow | null;
  const quizVersion = quizRow?.quiz_versions?.find((version) => version.id === quizRow.current_version_id) ?? quizRow?.quiz_versions?.[0] ?? null;

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
