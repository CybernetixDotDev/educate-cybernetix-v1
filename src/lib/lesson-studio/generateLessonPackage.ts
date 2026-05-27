"use server";

import { callJsonLLM } from "@/lib/ai/provider";
import { getModel } from "@/lib/ai/getModel";
import { requireRole } from "@/lib/auth/roles";
import type {
  CoOpTask,
  LessonBlock,
  LessonBrief,
  LessonFinalSubmission,
  LessonGeneratorOutput,
  LessonStudioActionResult,
  LessonTask,
  TeachingSequence,
} from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const LESSON_GENERATOR_SYSTEM = `You are the Lesson Generator for Educate-Cybernetix.

You take the Lesson Brief and generate a warm, simple, StarterSchool-style lesson package.

You MUST follow the brief exactly.
You MUST NOT change the topic, age range, skill level, tools, or objectives.
You MUST return valid JSON only.

Output exactly this JSON shape:
{
  "hook": "",
  "objective": [],
  "teaching_steps": [],
  "teaching_sequence": {
    "cinematic_hook": {
      "title": "",
      "body": "",
      "visual_prompt": ""
    },
    "why_it_matters": {
      "title": "",
      "body": "",
      "relatable_example": ""
    },
    "mental_model": {
      "title": "",
      "body": "",
      "metaphor": "",
      "diagram_prompt": ""
    },
    "i_do": {
      "title": "",
      "steps": [],
      "example": ""
    },
    "we_do": {
      "title": "",
      "steps": [],
      "guided_prompt": ""
    },
    "you_do": {
      "title": "",
      "instruction": "",
      "expected_output": ""
    },
    "common_mistake": {
      "title": "",
      "mistake": "",
      "fix": ""
    },
    "recap": {
      "title": "",
      "bullets": [],
      "next_step": ""
    }
  },
  "build_task": {},
  "checkpoint": [],
  "recap": "",
  "next_step": "",
  "video_script": "",
  "lesson_blocks": [],
  "tasks": [
    {
      "task_id": "w1d1-t1",
      "title": "",
      "instruction": "",
      "video_url": "",
      "action": "",
      "checkpoint_types": ["screenshot", "file"],
      "checkpoint_type": "screenshot",
      "ai_verification_criteria": []
    }
  ],
  "final_submission": {
    "required_task_checkpoints": [],
    "final_project_upload": {
      "required": true,
      "prompt": "",
      "accepted_formats": ["screenshot", "file", "link"]
    },
    "micro_survey": [
      {
        "question_id": "continue",
        "question": "Do you want to continue?",
        "type": "yes_no"
      },
      {
        "question_id": "most_interesting",
        "question": "What was the most interesting thing you learned?",
        "type": "text"
      }
    ],
    "ai_mentor_final_review": {
      "reviews_all_submissions": true,
      "gives_feedback": true,
      "awards_completion": true,
      "unlocks_next_co_op": true,
      "review_prompt": ""
    }
  },
  "co_op_tasks": [
    {
      "title": "",
      "instruction": "",
      "short_video": {
        "title": "",
        "script": "",
        "duration_minutes": 3,
        "url": ""
      },
      "action": "",
      "checkpoint_submission": {
        "prompt": "",
        "accepted_formats": ["screenshot", "file", "link", "text"]
      },
      "ai_verification": {
        "criteria": []
      },
      "ai_mentor_support": {
        "prompt_starter": "",
        "support_focus": ""
      }
    }
  ],
  "quiz": {
    "questions": [
      {
        "type": "mcq",
        "question": "",
        "options": ["", "", "", ""],
        "answer": "",
        "explanation": "",
        "difficulty": "easy",
        "skill_tags": []
      }
    ]
  },
  "project_checklist": [],
  "transcript": ""
}

Every lesson MUST contain 5-7 co_op_tasks.
Every lesson MUST also contain a matching first-class tasks array with 5-7 task objects.
Every lesson MUST include teaching_sequence before tasks. It must teach the concept with: cinematic hook, why it matters, mental model, I do, we do, you do, common mistake, recap.
teaching_sequence MUST be more detailed than headings. Use relatable examples, step-by-step explanation, concrete visuals, and simple language for ages 8-21.
The teaching_sequence should prepare the student for the guided tasks, not replace the tasks.
lesson_blocks are student-facing lesson material only. Do not write lesson_blocks as AI notes, prompt instructions, generation guidelines, or internal scaffolding.
lesson_blocks MUST read like an actual lesson directed to the student, with clear explanations, relatable examples, diagrams, and small practical prompts.
lesson_blocks MUST NOT use titles like "Hook", "Teaching Steps", "I do", "We do", "You do", "Watch out", or "Recap".
Good lesson_blocks titles include "What you're building", "The big idea", "A real-world example", "How it works", "Try this small idea", and "Before you start".
Each tasks item MUST include task_id, title, instruction, video_url, action, checkpoint_types, checkpoint_type, and ai_verification_criteria.
Each checkpoint_types array MUST include one or more of: screenshot, file, link, text. checkpoint_type MUST equal the first checkpoint_types value for backward compatibility.
The quiz MUST contain the exact number of questions requested in the Lesson Brief. Do not return an empty quiz.
Each lesson MUST include final_submission.
Final submission MUST include all 5-7 task checkpoint IDs, final project upload, the two-question micro-survey, and AI Mentor Final Review.
Each co_op_task MUST include instruction, short video, action, checkpoint submission, AI verification, and AI mentor support.
Short videos should be planned as 2-5 minutes.

Tone: warm, simple, mentor-like, practical, project-based, and confidence-building.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function normalizeBlocks(value: unknown): LessonBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((block) => ({
      type: stringValue(block.type, "text") as LessonBlock["type"],
      title: stringValue(block.title) || undefined,
      value: stringValue(block.value) || undefined,
      url: stringValue(block.url) || undefined,
      alt: stringValue(block.alt) || undefined,
      language: stringValue(block.language) || undefined,
      provider: stringValue(block.provider) || undefined,
      duration_seconds: typeof block.duration_seconds === "number" ? block.duration_seconds : undefined,
      thumbnail_url: stringValue(block.thumbnail_url) || undefined,
      transcript: stringValue(block.transcript) || undefined,
    }))
    .filter((block) => Boolean(block.value?.trim() || block.url?.trim()));
}

function normalizeQuiz(value: unknown): LessonGeneratorOutput["quiz"] {
  const record = isRecord(value) ? value : {};
  const questions = Array.isArray(record.questions) ? record.questions.filter(isRecord) : [];

  return {
    questions: questions.map((question) => {
      const type: LessonGeneratorOutput["quiz"]["questions"][number]["type"] =
        question.type === "true_false" || question.type === "short" || question.type === "mcq"
          ? question.type
          : Array.isArray(question.options)
            ? "mcq"
            : "short";
      const difficulty: LessonGeneratorOutput["quiz"]["questions"][number]["difficulty"] =
        question.difficulty === "easy" || question.difficulty === "medium" || question.difficulty === "hard"
          ? question.difficulty
          : undefined;

      return {
        type,
        question: stringValue(question.question),
        options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : undefined,
        answer:
          typeof question.answer === "string" || typeof question.answer === "number" || typeof question.answer === "boolean"
            ? question.answer
            : "",
        explanation: stringValue(question.explanation) || undefined,
        difficulty,
        skill_tags: stringArray(question.skill_tags),
      };
    }).filter((question) => question.question.trim().length > 0),
  };
}

function fallbackQuiz(brief: LessonBrief): LessonGeneratorOutput["quiz"] {
  const count = Math.max(1, Math.min(20, Math.round(brief.quiz_question_count || 5)));
  const objectives = brief.learning_objectives.length > 0 ? brief.learning_objectives : [brief.lesson_title];
  const taskRequirements = brief.hands_on_task_requirements ?? [];

  return {
    questions: Array.from({ length: count }, (_, index) => {
      const objective = objectives[index % objectives.length];
      const task = taskRequirements[index % Math.max(1, taskRequirements.length)];

      if (index % 3 === 1) {
        return {
          type: "true_false",
          question: `True or false: this lesson helps you ${objective.toLowerCase().replace(/[.?!]$/g, "")}.`,
          options: ["True", "False"],
          answer: true,
          explanation: `This is one of the lesson objectives: ${objective}`,
          difficulty: brief.quiz_difficulty,
          skill_tags: [brief.subject_area],
        };
      }

      if (index % 3 === 2) {
        return {
          type: "short",
          question: task?.task_name
            ? `In one sentence, what should you create for "${task.task_name}"?`
            : `In one sentence, explain the main idea of ${brief.lesson_title}.`,
          answer: task?.expected_output || brief.required_project_outcome,
          explanation: "A strong answer should describe the expected output in the student's own words.",
          difficulty: brief.quiz_difficulty,
          skill_tags: [brief.subject_area],
        };
      }

      return {
        type: "mcq",
        question: "What is the best description of the goal for this lesson?",
        options: [
          brief.required_project_outcome,
          "Only watch the video without doing the task",
          "Skip the checkpoint submission",
          "Memorize terms without building anything",
        ],
        answer: brief.required_project_outcome,
        explanation: "Educate-Cybernetix lessons are project-based, so the best answer is the visible project outcome.",
        difficulty: brief.quiz_difficulty,
        skill_tags: [brief.subject_area],
      };
    }),
  };
}

function acceptedFormats(value: unknown): CoOpTask["checkpoint_submission"]["accepted_formats"] {
  const allowed = new Set(["screenshot", "file", "link", "text"]);
  const formats = Array.isArray(value)
    ? value.filter((item): item is CoOpTask["checkpoint_submission"]["accepted_formats"][number] => typeof item === "string" && allowed.has(item))
    : [];

  return formats.length > 0 ? formats : ["screenshot", "file", "link", "text"];
}

function requirementCheckpointTypes(requirement: LessonBrief["hands_on_task_requirements"][number] | undefined) {
  if (!requirement) return [];
  return acceptedFormats(requirement.checkpoint_types?.length ? requirement.checkpoint_types : [requirement.checkpoint_type]);
}

function clampVideoDuration(value: unknown) {
  const duration = typeof value === "number" && Number.isFinite(value) ? value : 3;
  return Math.max(2, Math.min(5, Math.round(duration)));
}

function normalizeCoOpTasks(value: unknown, brief: LessonBrief): CoOpTask[] {
  const rawTasks = Array.isArray(value) ? value.filter(isRecord).slice(0, 7) : [];
  const taskRequirements = brief.hands_on_task_requirements ?? [];
  const tasks = rawTasks.map((task, index) => {
    const requirement = taskRequirements[index];
    const shortVideo = isRecord(task.short_video) ? task.short_video : {};
    const checkpointSubmission = isRecord(task.checkpoint_submission) ? task.checkpoint_submission : {};
    const aiVerification = isRecord(task.ai_verification) ? task.ai_verification : {};
    const aiMentorSupport = isRecord(task.ai_mentor_support) ? task.ai_mentor_support : {};

    return {
      title: stringValue(task.title, requirement?.task_name ?? `Guided Build Task ${index + 1}`),
      instruction: stringValue(task.instruction, requirement?.instruction ?? ""),
      short_video: {
        title: stringValue(shortVideo.title, `Watch: Guided Build Task ${index + 1}`),
        script: stringValue(shortVideo.script, requirement?.short_video_requirement ?? ""),
        duration_minutes: clampVideoDuration(shortVideo.duration_minutes),
        url: stringValue(shortVideo.url) || undefined,
      },
      action: stringValue(task.action, requirement?.student_action ?? ""),
      checkpoint_submission: {
        prompt: stringValue(checkpointSubmission.prompt, "Upload a screenshot, file, link, or short explanation showing your work."),
        accepted_formats: requirement ? requirementCheckpointTypes(requirement) : acceptedFormats(checkpointSubmission.accepted_formats),
      },
      ai_verification: {
        criteria:
          stringArray(aiVerification.criteria).length > 0
            ? stringArray(aiVerification.criteria)
            : requirement?.ai_verification_criteria ?? brief.task_verification_criteria,
      },
      ai_mentor_support: {
        prompt_starter: stringValue(aiMentorSupport.prompt_starter, "I need help with this task."),
        support_focus: stringValue(
          aiMentorSupport.support_focus,
          requirement?.ai_mentor_guidance ?? "Guide the student step by step without giving away the full answer.",
        ),
      },
    };
  });

  if (tasks.length >= 5) return tasks;

  if (taskRequirements.length >= 5) {
    return taskRequirements.slice(0, 7).map((task) => ({
      title: task.task_name,
      instruction: task.instruction,
      short_video: {
        title: `Watch: ${task.task_name}`,
        script: task.short_video_requirement,
        duration_minutes: 3,
      },
      action: task.student_action,
      checkpoint_submission: {
        prompt: task.expected_output,
        accepted_formats: requirementCheckpointTypes(task),
      },
      ai_verification: {
        criteria: task.ai_verification_criteria,
      },
      ai_mentor_support: {
        prompt_starter: `Can you help me with "${task.task_name}"?`,
        support_focus: task.ai_mentor_guidance,
      },
    }));
  }

  const fallbackTitles = ["Understand it", "Try it", "Build it", "Check it", "Improve it"];
  return fallbackTitles.map((title, index) => ({
    title,
    instruction: brief.learning_objectives[index] ?? `Work toward: ${brief.required_project_outcome}`,
    short_video: {
      title: `Watch: ${title}`,
      script: `Explain ${title.toLowerCase()} for ${brief.lesson_title} in a simple, practical way.`,
      duration_minutes: 3,
    },
    action: index === 4 ? brief.required_project_outcome : `Complete a small step toward ${brief.required_project_outcome}.`,
    checkpoint_submission: {
      prompt: "Submit evidence that shows what you completed.",
      accepted_formats: ["screenshot", "file", "link", "text"],
    },
    ai_verification: {
      criteria: brief.task_verification_criteria,
    },
    ai_mentor_support: {
      prompt_starter: `Can you help me with "${title}"?`,
      support_focus: "Give hints and small next steps without revealing the full solution.",
    },
  }));
}

function checkpointType(value: unknown): LessonTask["checkpoint_type"] {
  return value === "file" || value === "link" || value === "text" || value === "screenshot" ? value : "screenshot";
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function normalizeTasks(value: unknown, coOpTasks: CoOpTask[], brief: LessonBrief): LessonTask[] {
  const rawTasks = Array.isArray(value) ? value.filter(isRecord).slice(0, 7) : [];
  const taskRequirements = brief.hands_on_task_requirements ?? [];
  const tasks = rawTasks.map((task, index) => ({
    task_id: stringValue(task.task_id, `${slug(brief.lesson_title) || "lesson"}-t${index + 1}`),
    title: stringValue(task.title, taskRequirements[index]?.task_name ?? coOpTasks[index]?.title ?? `Task ${index + 1}`),
    instruction: stringValue(task.instruction, taskRequirements[index]?.instruction ?? coOpTasks[index]?.instruction ?? ""),
    video_url: stringValue(task.video_url, coOpTasks[index]?.short_video.url ?? ""),
    action: stringValue(task.action, taskRequirements[index]?.student_action ?? coOpTasks[index]?.action ?? ""),
    checkpoint_types: taskRequirements[index] ? requirementCheckpointTypes(taskRequirements[index]) : acceptedFormats(task.checkpoint_types),
    checkpoint_type: taskRequirements[index]
      ? requirementCheckpointTypes(taskRequirements[index])[0] ?? "screenshot"
      : acceptedFormats(task.checkpoint_types)[0] ?? checkpointType(task.checkpoint_type),
    ai_verification_criteria:
      stringArray(task.ai_verification_criteria).length > 0
        ? stringArray(task.ai_verification_criteria)
        : taskRequirements[index]?.ai_verification_criteria ?? coOpTasks[index]?.ai_verification.criteria ?? brief.task_verification_criteria,
  }));

  if (tasks.length >= 5) return tasks;

  return coOpTasks.slice(0, 7).map((task, index) => ({
    task_id: `${slug(brief.lesson_title) || "lesson"}-t${index + 1}`,
    title: task.title,
    instruction: task.instruction,
    video_url: task.short_video.url ?? "",
    action: task.action,
    checkpoint_types: task.checkpoint_submission.accepted_formats,
    checkpoint_type: task.checkpoint_submission.accepted_formats[0] ?? "screenshot",
    ai_verification_criteria: task.ai_verification.criteria.length > 0 ? task.ai_verification.criteria : brief.task_verification_criteria,
  }));
}

function normalizeFinalSubmission(value: unknown, tasks: LessonTask[], brief: LessonBrief): LessonFinalSubmission {
  const record = isRecord(value) ? value : {};
  const finalProjectUpload = isRecord(record.final_project_upload) ? record.final_project_upload : {};
  const aiMentorFinalReview = isRecord(record.ai_mentor_final_review) ? record.ai_mentor_final_review : {};
  const finalRequirements = brief.final_project_submission_requirements;
  const taskIds = tasks.map((task) => task.task_id);
  const requiredTaskCheckpoints = stringArray(record.required_task_checkpoints).filter((taskId) => taskIds.includes(taskId));
  const projectFormats = (
    finalRequirements?.required_uploads?.length ? finalRequirements.required_uploads : acceptedFormats(finalProjectUpload.accepted_formats)
  ).filter((format) => format !== "text");

  return {
    required_task_checkpoints: requiredTaskCheckpoints.length > 0 ? requiredTaskCheckpoints : taskIds,
    final_project_upload: {
      required: typeof finalProjectUpload.required === "boolean" ? finalProjectUpload.required : true,
      prompt: stringValue(
        finalProjectUpload.prompt,
        finalRequirements?.submission_checklist?.length
          ? finalRequirements.submission_checklist.join("\n")
          : `Upload or link your final project for: ${brief.required_project_outcome}`,
      ),
      accepted_formats: projectFormats.length > 0 ? projectFormats : ["screenshot", "file", "link"],
    },
    micro_survey: [
      {
        question_id: "continue",
        question: "Do you want to continue?",
        type: "yes_no",
      },
      {
        question_id: "most_interesting",
        question: "What was the most interesting thing you learned?",
        type: "text",
      },
    ],
    ai_mentor_final_review: {
      reviews_all_submissions:
        typeof aiMentorFinalReview.reviews_all_submissions === "boolean" ? aiMentorFinalReview.reviews_all_submissions : true,
      gives_feedback: typeof aiMentorFinalReview.gives_feedback === "boolean" ? aiMentorFinalReview.gives_feedback : true,
      awards_completion: typeof aiMentorFinalReview.awards_completion === "boolean" ? aiMentorFinalReview.awards_completion : true,
      unlocks_next_co_op: typeof aiMentorFinalReview.unlocks_next_co_op === "boolean" ? aiMentorFinalReview.unlocks_next_co_op : true,
      review_prompt: stringValue(
        aiMentorFinalReview.review_prompt,
        finalRequirements?.ai_mentor_feedback_rules?.length
          ? finalRequirements.ai_mentor_feedback_rules.join("\n")
          : "Review every task checkpoint, the final project upload, and the micro-survey. Give supportive feedback, award completion only when the criteria are met, then unlock the next guided build.",
      ),
    },
  };
}

function normalizeTeachingSequence(value: unknown, brief: LessonBrief, record: Record<string, unknown>): TeachingSequence {
  const sequence = isRecord(value) ? value : {};
  const section = (key: keyof TeachingSequence) => isRecord(sequence[key]) ? sequence[key] as Record<string, unknown> : {};
  const objectives = stringArray(record.objective).length > 0 ? stringArray(record.objective) : brief.learning_objectives;
  const teachingSteps = stringArray(record.teaching_steps);
  const checkpoints = stringArray(record.checkpoint);
  const buildTask = isRecord(record.build_task) ? record.build_task : {};
  const firstRequirement = brief.hands_on_task_requirements?.[0];

  const cinematicHook = section("cinematic_hook");
  const whyItMatters = section("why_it_matters");
  const mentalModel = section("mental_model");
  const iDo = section("i_do");
  const weDo = section("we_do");
  const youDo = section("you_do");
  const commonMistake = section("common_mistake");
  const recap = section("recap");

  return {
    cinematic_hook: {
      title: stringValue(cinematicHook.title, "Start with the real-world moment"),
      body: stringValue(
        cinematicHook.body,
        stringValue(record.hook, `Imagine using ${brief.lesson_title} to create something you can actually show someone.`),
      ),
      visual_prompt: stringValue(cinematicHook.visual_prompt) || `Create a cinematic visual that introduces ${brief.lesson_title}.`,
    },
    why_it_matters: {
      title: stringValue(whyItMatters.title, "Why this matters"),
      body: stringValue(
        whyItMatters.body,
        objectives[0]
          ? `This matters because it helps you ${objectives[0].toLowerCase().replace(/[.?!]$/g, "")}.`
          : `This matters because it turns ${brief.subject_area} into something practical you can build.`,
      ),
      relatable_example: stringValue(whyItMatters.relatable_example) || brief.required_project_outcome,
    },
    mental_model: {
      title: stringValue(mentalModel.title, "The simple mental model"),
      body: stringValue(
        mentalModel.body,
        `Think of ${brief.lesson_title} as a small system: one part starts the action, another part responds, and your job is to understand how the pieces connect.`,
      ),
      metaphor: stringValue(mentalModel.metaphor) || "Like following a recipe: each step has a job, and the final result only works when the steps connect.",
      diagram_prompt: stringValue(mentalModel.diagram_prompt) || `Draw the main parts of ${brief.lesson_title} and show how they connect with arrows.`,
    },
    i_do: {
      title: stringValue(iDo.title, "I do: watch the first move"),
      steps: stringArray(iDo.steps).length > 0
        ? stringArray(iDo.steps)
        : (teachingSteps.length > 0 ? teachingSteps.slice(0, 4) : [`Watch how to approach ${brief.lesson_title} one step at a time.`]),
      example: stringValue(iDo.example) || firstRequirement?.expected_output || brief.required_project_outcome,
    },
    we_do: {
      title: stringValue(weDo.title, "We do: try it together"),
      steps: stringArray(weDo.steps).length > 0
        ? stringArray(weDo.steps)
        : (checkpoints.length > 0 ? checkpoints.slice(0, 4) : ["Pause, check the key parts, and explain what each part does in your own words."]),
      guided_prompt: stringValue(weDo.guided_prompt) || "Use Zylo if one step feels unclear before moving on.",
    },
    you_do: {
      title: stringValue(youDo.title, "You do: build your version"),
      instruction: stringValue(
        youDo.instruction,
        firstRequirement?.student_action || stringValue(buildTask.expected_outcome, brief.required_project_outcome),
      ),
      expected_output: stringValue(youDo.expected_output) || firstRequirement?.expected_output || brief.required_project_outcome,
    },
    common_mistake: {
      title: stringValue(commonMistake.title, "Common mistake to avoid"),
      mistake: stringValue(commonMistake.mistake, "Trying to finish the task before you can explain what the main parts are doing."),
      fix: stringValue(commonMistake.fix, "Slow down, name each part, then do the next small step."),
    },
    recap: {
      title: stringValue(recap.title, "Quick recap"),
      bullets: stringArray(recap.bullets).length > 0
        ? stringArray(recap.bullets)
        : [
            objectives[0] ?? `You learned the main idea behind ${brief.lesson_title}.`,
            `You connected the idea to a visible project outcome: ${brief.required_project_outcome}.`,
            "You are ready to complete the guided build tasks.",
          ],
      next_step: stringValue(recap.next_step) || stringValue(record.next_step, "Start Task 1 and submit proof when it is complete."),
    },
  };
}

function normalizeLessonPackage(value: unknown, brief: LessonBrief): LessonGeneratorOutput {
  const record = isRecord(value) ? value : {};
  const buildTask = isRecord(record.build_task) ? record.build_task : {};
  const coOpTasks = normalizeCoOpTasks(record.co_op_tasks, brief);
  const tasks = normalizeTasks(record.tasks, coOpTasks, brief);
  const quiz = normalizeQuiz(record.quiz);
  const minimumQuiz = fallbackQuiz(brief);
  const quizQuestionCount = Math.max(1, Math.min(20, Math.round(brief.quiz_question_count || 5)));
  const finalQuiz = {
    questions: [...quiz.questions, ...minimumQuiz.questions].slice(0, quizQuestionCount),
  };

  return {
    hook: stringValue(record.hook, `Let's build ${brief.lesson_title}.`),
    objective: stringArray(record.objective).length > 0 ? stringArray(record.objective) : brief.learning_objectives,
    teaching_steps: stringArray(record.teaching_steps),
    teaching_sequence: normalizeTeachingSequence(record.teaching_sequence, brief, record),
    build_task: {
      title: stringValue(buildTask.title, brief.required_project_outcome),
      instructions: stringArray(buildTask.instructions),
      expected_outcome: stringValue(buildTask.expected_outcome, brief.required_project_outcome),
      tools: stringArray(buildTask.tools).length > 0 ? stringArray(buildTask.tools) : brief.required_tools,
    },
    checkpoint: stringArray(record.checkpoint),
    recap: stringValue(record.recap),
    next_step: stringValue(record.next_step),
    video_script: stringValue(record.video_script),
    lesson_blocks: normalizeBlocks(record.lesson_blocks),
    tasks,
    final_submission: normalizeFinalSubmission(record.final_submission, tasks, brief),
    co_op_tasks: coOpTasks,
    quiz: finalQuiz,
    project_checklist: stringArray(record.project_checklist),
    transcript: stringValue(record.transcript),
  };
}

async function lessonStudioContext() {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").eq("module_key", "lesson-studio").maybeSingle(),
  ]);

  return {
    supabase,
    aiConfig: aiConfig ?? {},
    moduleContext:
      moduleContext ?? {
        module_key: "lesson-studio",
        module_title: "Dynamic Lesson Generation Studio",
        context: {
          teacher_focus: "Create clear, practical lessons for ages 8-21.",
          builder_focus: "End every lesson with a small visible project outcome.",
          quiz_focus: "Check understanding with friendly, age-appropriate questions.",
        },
      },
  };
}

export async function generateLessonPackage(
  brief: LessonBrief,
  blueprintId?: string | null,
): Promise<LessonStudioActionResult<LessonGeneratorOutput>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  if (!brief.lesson_title.trim() || brief.learning_objectives.length === 0) {
    return { ok: false, data: null, error: "A lesson title and at least one learning objective are required." };
  }

  try {
    const context = await lessonStudioContext();
    const model = await getModel("json", context.aiConfig);
    const prompt = [
      "Generate a complete lesson package from this Lesson Brief.",
      "Use the global AI config and module context as supporting guidance only.",
      "Follow the Lesson Brief exactly and return only the required JSON object.",
      "",
      "GLOBAL AI CONFIG:",
      JSON.stringify(context.aiConfig, null, 2),
      "",
      "LESSON STUDIO CONTEXT:",
      JSON.stringify(context.moduleContext, null, 2),
      "",
      "LESSON BRIEF:",
      JSON.stringify(brief, null, 2),
      "",
      "TASK VERIFICATION CRITERIA:",
      JSON.stringify(brief.task_verification_criteria, null, 2),
      "",
      "HANDS-ON TASK REQUIREMENTS:",
      JSON.stringify(brief.hands_on_task_requirements, null, 2),
      "",
      "FINAL PROJECT SUBMISSION REQUIREMENTS:",
      JSON.stringify(brief.final_project_submission_requirements, null, 2),
      "",
      "CO-OP TASK REQUIREMENTS:",
      [
        "Generate 5-7 co_op_tasks.",
        "Generate a matching tasks array with 5-7 first-class task objects.",
        "Use task_id values that are stable and lesson-scoped, like w1d1-t1 when lesson keys are known.",
        "Each first-class task must include: task_id, title, instruction, video_url, action, checkpoint_types, checkpoint_type, ai_verification_criteria.",
        "Each checkpoint_types array must include every allowed submission format from the brief for that task.",
        `Generate exactly ${Math.max(1, Math.round(brief.quiz_question_count || 5))} quiz questions. Do not return an empty quiz.`,
        "Generate final_submission with all task checkpoint IDs, final project upload, the exact two-question micro-survey, and AI Mentor Final Review.",
        "The micro-survey must ask exactly: Do you want to continue? and What was the most interesting thing you learned?",
        "AI Mentor Final Review must review all submissions, give feedback, award completion, and unlock the next guided build.",
        "Each task must include: instruction, short_video, action, checkpoint_submission, ai_verification, ai_mentor_support.",
        "Each short_video must be planned for 2-5 minutes.",
        "Each ai_verification.criteria must map back to the Task Verification Criteria in the lesson brief.",
        "Each AI mentor support prompt should help the student get unstuck without revealing the full solution.",
      ].join("\n"),
    ].join("\n");

    const raw = await callJsonLLM<unknown>(model, prompt, {
      system: LESSON_GENERATOR_SYSTEM,
      temperature: 0.2,
      metadata: { system: "lesson-generator", lesson_title: brief.lesson_title },
    });
    const generated = normalizeLessonPackage(raw, brief);

    const { data: userResult } = await context.supabase.auth.getUser();
    const { data: savedLesson } = await context.supabase
      .from("generated_lessons")
      .insert({
        blueprint_id: blueprintId ?? null,
        generated_json: generated,
        status: "generated",
        created_by: userResult.user?.id ?? null,
      })
      .select("id")
      .single();

    revalidatePath("/admin/ai-lesson-generator");

    return { ok: true, data: { ...generated, generated_lesson_id: savedLesson?.id }, error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Lesson generation failed.",
    };
  }
}
