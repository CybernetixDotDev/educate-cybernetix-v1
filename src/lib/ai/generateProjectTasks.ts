"use server";

import { compileMentorPrompt } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type ProjectTaskStatus = "todo" | "in-progress" | "done";
export type ProjectTaskDifficulty = "easy" | "medium" | "hard";

export type GeneratedProjectTask = {
  task_id: string;
  title: string;
  description: string;
  difficulty: ProjectTaskDifficulty;
  skill_tags: string[];
  order_index: number;
  status: ProjectTaskStatus;
};

export type ProjectTasksJSON = {
  project_id: string;
  tasks: GeneratedProjectTask[];
};

export type ProjectTaskGenerationInput = {
  project_id: string;
};

export type ProjectTaskGenerationResult = {
  ok: boolean;
  taskList: ProjectTasksJSON | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeStatus(value: unknown): ProjectTaskStatus {
  if (value === "in-progress" || value === "done" || value === "todo") return value;
  if (value === "completed") return "done";
  return "todo";
}

function normalizeDifficulty(value: unknown): ProjectTaskDifficulty {
  return value === "medium" || value === "hard" ? value : "easy";
}

function normalizeTask(value: unknown, index: number): GeneratedProjectTask {
  const task = isRecord(value) ? value : {};
  const skillTags = strings(task.skill_tags ?? task.required_skills);

  return {
    task_id: typeof task.task_id === "string" && task.task_id ? task.task_id : crypto.randomUUID(),
    title: typeof task.title === "string" && task.title ? task.title : `Project task ${index + 1}`,
    description: typeof task.description === "string" ? task.description : "",
    difficulty: normalizeDifficulty(task.difficulty),
    skill_tags: skillTags,
    order_index: Number.isFinite(Number(task.order_index ?? task.position)) ? Number(task.order_index ?? task.position) : index,
    status: normalizeStatus(task.status),
  };
}

function normalizeProjectTasks(value: unknown, input: ProjectTaskGenerationInput): ProjectTasksJSON {
  const record = isRecord(value) ? value : {};
  const rawTasks = Array.isArray(record.tasks) ? record.tasks : [];

  return {
    project_id: typeof record.project_id === "string" ? record.project_id : input.project_id,
    tasks: rawTasks
      .map((task, index) => normalizeTask(task, index))
      .sort((left, right) => left.order_index - right.order_index),
  };
}

async function fetchProjectContext(input: ProjectTaskGenerationInput) {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: project }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase
      .from("student_projects")
      .select("*, project_tasks(*)")
      .eq("id", input.project_id)
      .maybeSingle(),
  ]);

  const templateId = isRecord(project) && typeof project.template_id === "string" ? project.template_id : null;
  const { data: template } = templateId
    ? await supabase.from("project_templates").select("*").eq("id", templateId).maybeSingle()
    : { data: null };

  return {
    aiConfig: (aiConfig ?? {}) as Record<string, unknown>,
    project: (project ?? null) as Record<string, unknown> | null,
    template: (template ?? null) as Record<string, unknown> | null,
    existingTasks: (isRecord(project) && Array.isArray(project.project_tasks) ? project.project_tasks : []) as unknown[],
  };
}

function buildPrompt(
  input: ProjectTaskGenerationInput,
  context: Awaited<ReturnType<typeof fetchProjectContext>>,
  selectedTask?: GeneratedProjectTask,
) {
  const outputFormat = {
    project_id: "string",
    tasks: [
      {
        task_id: "string",
        title: "string",
        description: "string",
        difficulty: "easy | medium | hard",
        skill_tags: ["string"],
        order_index: 0,
        status: "todo | in-progress | done",
      },
    ],
  };

  return compileMentorPrompt({
    student_id: isRecord(context.project) && typeof context.project.student_id === "string" ? context.project.student_id : "project-mentor",
    mode: "builder",
    module_id: "project-mentor",
    lesson_id: null,
    project_id: input.project_id,
    student_message: [
      selectedTask
        ? "Regenerate the selected project task and return the full JSON shape with one refined task."
        : "Generate a complete practical project task breakdown.",
      "Builder mode tone: practical, step-by-step, encouraging.",
      "Debugging tone: clear, structured, actionable.",
      "Architecture guidance: high-level and implementation-ready.",
      `Project template: ${JSON.stringify(context.template ?? {})}`,
      `Student project data: ${JSON.stringify(context.project ?? {})}`,
      `Existing tasks: ${JSON.stringify(context.existingTasks)}`,
      selectedTask ? `Selected task to refine: ${JSON.stringify(selectedTask)}` : "",
      "Return valid JSON only. Do not use markdown fences.",
      `Required output format: ${JSON.stringify(outputFormat)}`,
    ].filter(Boolean).join("\n"),
    code_snippet: null,
    ai_config: context.aiConfig,
    module_context: null,
    progress: {
      lesson_progress: [],
      quiz_results: [],
      session_logs: [],
      streaks: [],
      student_projects: context.project ? [context.project] : [],
    },
  });
}

async function callLlm(prompt: string, aiConfig: Record<string, unknown>) {
  const apiKey = process.env.AI_PROVIDER_API_KEY ?? process.env.OPENAI_API_KEY;
  const endpoint = process.env.AI_PROVIDER_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = typeof aiConfig.model === "string" ? aiConfig.model : "gpt-4.1-mini";

  if (!apiKey) throw new Error("AI provider API key is not configured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You generate practical project mentor task JSON. Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty project task list");
  return JSON.parse(content) as unknown;
}

export async function generateProjectTasks(input: ProjectTaskGenerationInput): Promise<ProjectTaskGenerationResult> {
  try {
    if (!input.project_id) throw new Error("project_id is required");
    const context = await fetchProjectContext(input);
    const raw = await callLlm(buildPrompt(input, context), context.aiConfig);
    return { ok: true, taskList: normalizeProjectTasks(raw, input), error: null };
  } catch (error) {
    return {
      ok: false,
      taskList: null,
      error: error instanceof Error ? error.message : "Unable to generate project tasks",
    };
  }
}

export async function generateProjectTask(input: ProjectTaskGenerationInput, selectedTask: GeneratedProjectTask) {
  const context = await fetchProjectContext(input);
  const raw = await callLlm(buildPrompt(input, context, selectedTask), context.aiConfig);
  return normalizeProjectTasks(raw, input);
}
