import type { QuizQuestion } from "@/hooks/useQuiz";

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

export type LessonSection = {
  heading: string;
  body: string;
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
  quiz: LessonQuizMetadata;
};

export type LessonNavigation = {
  previous: { moduleId: string; lessonId: string } | null;
  next: { moduleId: string; lessonId: string; label: string; isNextModule: boolean } | null;
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
        body: `This lesson focuses on ${moduleTitle.toLowerCase()} through one practical idea you can use in your project today. Read the concept, inspect the example, then try a small variation before moving on.`,
      },
      {
        heading: "Why it matters",
        body: "Good builders understand both the tool and the reason behind it. As you work, connect each step to user experience, reliability, accessibility, or project momentum.",
      },
      {
        heading: "Your quick challenge",
        body: "Change one part of the example, predict what will happen, test it, and write down what you learned. If your result is different from your prediction, ask the mentor to help you debug the gap.",
      },
    ],
    codeExamples: [
      {
        title: "Tiny practice pattern",
        language: moduleId.includes("javascript") || moduleId.includes("nextjs") ? "tsx" : "html",
        code: moduleId.includes("nextjs")
          ? `type LessonCardProps = {\n  title: string;\n  complete: boolean;\n};\n\nexport function LessonCard({ title, complete }: LessonCardProps) {\n  return <article>{complete ? "Done: " : "Next: "}{title}</article>;\n}`
          : `<section class="lesson-card">\n  <h2>${moduleTitle}</h2>\n  <p>Build, test, improve.</p>\n</section>`,
      },
    ],
    images: [],
    quiz: {
      quiz_key: `${moduleId}-${lessonId}`,
      title: `${lessonLabel} Quiz`,
      passing_score: 80,
      questions: [
        {
          id: "purpose",
          prompt: `What is the main goal of this ${moduleTitle} lesson?`,
          options: [
            "Copy code without understanding it",
            "Connect a concept to a practical project step",
            "Skip testing until deployment",
            "Memorize every possible command",
          ],
          correct_answer: "Connect a concept to a practical project step",
          points: 1,
          metadata: { skill },
        },
        {
          id: "debugging",
          prompt: "True or false: if your result differs from your prediction, you should inspect the smallest failing part before changing several things.",
          options: ["True", "False"],
          correct_answer: "True",
          points: 1,
          metadata: { skill: "project_management" },
        },
        {
          id: "reflection",
          prompt: "In one short sentence, what will you try next in your project?",
          correct_answer: null,
          points: 1,
          metadata: { skill },
        },
      ],
    },
  };
}

export async function getLesson(moduleId: string, lessonId: string): Promise<Lesson> {
  return buildLesson(moduleId, lessonId);
}

export function getLessonNavigation(moduleId: string, lessonId: string): LessonNavigation {
  const moduleIndex = MODULE_ORDER.findIndex((item) => item === moduleId);
  const lessonIndex = LESSON_ORDER.findIndex((item) => item === lessonId);
  const safeLessonIndex = lessonIndex >= 0 ? lessonIndex : 0;
  const previousLesson = LESSON_ORDER[safeLessonIndex - 1];
  const nextLesson = LESSON_ORDER[safeLessonIndex + 1];

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
