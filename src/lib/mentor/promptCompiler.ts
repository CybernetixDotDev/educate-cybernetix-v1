import { MENTOR_IDENTITY, ZYLO_SYSTEM_PROMPT_BLOCK } from "@/lib/mentor/identity";

export type MentorMode =
  | "teacher"
  | "quiz"
  | "builder"
  | "debug"
  | "review"
  | "general";

export type MentorRequest = {
  student_id: string;
  mode: MentorMode;
  module_id: string;
  lesson_id: string | null;
  project_id: string | null;
  student_message: string;
  code_snippet: string | null;
  ai_config: Record<string, unknown>;
  module_context: Record<string, unknown> | null;
  progress: {
    lesson_progress: unknown[];
    quiz_results: unknown[];
    session_logs: unknown[];
    streaks: unknown[];
    student_projects: unknown[];
  };
};

export function compileMentorPrompt(request: MentorRequest) {
  const moduleContext = request.module_context?.context;
  const settings = request.ai_config.settings;
  const specialistGuidance: Record<MentorMode, string> = {
    teacher: "Act as a lesson teacher. Explain concepts clearly, use short examples, and guide without giving overwhelming detail.",
    quiz: "Act as a quiz coach. Ask or explain practice questions, diagnose weak concepts, and reinforce recall.",
    builder: "Act as a project builder. Turn ideas into concrete tasks, architecture choices, feature plans, and presentation-ready progress.",
    debug: "Act as a debugging coach. Identify likely root cause, explain why it happens, and give step-by-step fixes.",
    review: "Act as a code reviewer. Focus on correctness, clarity, accessibility, security, performance, and small practical improvements.",
    general: "Act as a general learning coach. Decide the most useful form of help from the student's message.",
  };

  return [
    `You are responding as ${MENTOR_IDENTITY.systemName}.`,
    `Your student-facing name is ${MENTOR_IDENTITY.name}.`,
    ZYLO_SYSTEM_PROMPT_BLOCK,
    "Students should experience one helpful mentor, even though the platform routes internally to specialist modes.",
    "Speak in first person as Zylo when it feels natural, but do not overdo your name.",
    "Your personality: warm, curious, playful, practical, and calm under pressure.",
    "Use simple explanations, relatable metaphors, and small next steps.",
    "When a student is stuck, reduce anxiety first, then give a clear plan.",
    "Do not dump long lectures. Prefer: quick explanation, example, next action.",
    "Celebrate genuine progress briefly. Never shame mistakes.",
    specialistGuidance[request.mode],
    "",
    "GLOBAL AI CONFIG:",
    JSON.stringify(settings ?? request.ai_config, null, 2),
    "",
    "MODULE CONTEXT:",
    JSON.stringify(moduleContext ?? request.module_context ?? {}, null, 2),
    "",
    "REQUEST:",
    JSON.stringify(
      {
        student_id: request.student_id,
        mode: request.mode,
        module_id: request.module_id,
        lesson_id: request.lesson_id,
        project_id: request.project_id,
        student_message: request.student_message,
        code_snippet: request.code_snippet,
      },
      null,
      2,
    ),
    "",
    "PROGRESS CONTEXT:",
    JSON.stringify(request.progress, null, 2),
    "",
    "Return JSON only with this shape:",
    '{"message":"string","next_actions":["string"],"metadata":{"confidence":number,"tags":["string"]}}',
  ].join("\n");
}
