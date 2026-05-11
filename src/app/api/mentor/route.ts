import { compileMentorPrompt, type MentorMode, type MentorRequest } from "@/lib/mentor/promptCompiler";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const VALID_MODES = new Set<MentorMode>([
  "teacher",
  "quiz",
  "builder",
  "debug",
  "review",
  "general",
]);

type MentorBody = {
  student_id?: unknown;
  mode?: unknown;
  intent_hint?: unknown;
  module_id?: unknown;
  lesson_id?: unknown;
  project_id?: unknown;
  student_message?: unknown;
  code_snippet?: unknown;
};

type JsonRecord = Record<string, unknown>;

type LlmPayload = {
  message: string;
  next_actions: string[];
  metadata: JsonRecord;
};

function jsonError(message: string, status: number, metadata: JsonRecord = {}) {
  return Response.json({ error: message, metadata }, { status });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function cleanOptionalString(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return typeof value === "string" ? value.trim() : null;
}

function validateBody(body: MentorBody) {
  const student_id = cleanOptionalString(body.student_id);
  const module_id = cleanOptionalString(body.module_id);
  const mode = cleanOptionalString(body.mode);
  const lesson_id = cleanOptionalString(body.lesson_id);
  const project_id = cleanOptionalString(body.project_id);
  const student_message = cleanOptionalString(body.student_message);
  const code_snippet = cleanOptionalString(body.code_snippet);
  const intent_hint = cleanOptionalString(body.intent_hint);

  const errors: string[] = [];

  if (!student_id || !isUuid(student_id)) {
    errors.push("student_id must be a valid UUID");
  }

  if (!mode || !VALID_MODES.has(mode as MentorMode)) {
    errors.push(`mode must be one of: ${Array.from(VALID_MODES).join(", ")}`);
  }

  if (!module_id) {
    errors.push("module_id is required");
  }

  if (!student_message && !code_snippet) {
    errors.push("student_message or code_snippet is required");
  }

  if (lesson_id && lesson_id.length > 160) {
    errors.push("lesson_id is too long");
  }

  if (project_id && !isUuid(project_id)) {
    errors.push("project_id must be a valid UUID when provided");
  }

  return {
    data: {
      student_id: student_id ?? "",
      mode: (mode ?? "general") as MentorMode,
      module_id: module_id ?? "",
      lesson_id,
      project_id,
      student_message: student_message ?? "",
      code_snippet,
      intent_hint,
    },
    errors,
  };
}

function inferMode(body: ReturnType<typeof validateBody>["data"]): MentorMode {
  if (body.mode !== "general") return body.mode;

  if (body.intent_hint === "quiz") return "quiz";
  if (body.intent_hint === "project" || body.intent_hint === "presentation") return "builder";
  if (body.intent_hint === "debug") return "debug";
  if (body.intent_hint === "review") return "review";
  if (body.intent_hint === "lesson") return "teacher";

  const combined = `${body.student_message}\n${body.code_snippet ?? ""}`;
  const message = body.student_message.toLowerCase();
  const hasCode = Boolean(body.code_snippet?.trim());

  if (hasCode && /(error|exception|stack|trace|failed|bug|broken|not working|undefined|null|cannot|hydration|rls|policy|500|404)/i.test(combined)) {
    return "debug";
  }

  if (hasCode && /(review|improve|quality|clean|refactor|accessibility|security|performance|best practice)/i.test(message)) {
    return "review";
  }

  if (/(quiz|test me|practice question|checkpoint|answer|multiple choice|true or false)/i.test(message)) {
    return "quiz";
  }

  if (/(project|task|feature|mvp|architecture|build|repository|github|deploy|demo|presentation|slide|script|q&a)/i.test(message)) {
    return "builder";
  }

  if (body.project_id) return "builder";
  if (body.lesson_id || body.module_id !== "general") return "teacher";
  return "teacher";
}

async function fetchProgress(supabase: ReturnType<typeof createClient>, studentId: string, projectId: string | null) {
  const projectQuery = supabase
    .from("student_projects")
    .select("*, project_tasks(*)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const [
    lessonProgress,
    quizResults,
    sessionLogs,
    streaks,
    studentProjects,
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(25),
    supabase
      .from("quiz_results")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("session_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("streaks").select("*").eq("student_id", studentId),
    projectId ? projectQuery.eq("id", projectId).limit(1) : projectQuery.limit(10),
  ]);

  const errors = [
    lessonProgress.error,
    quizResults.error,
    sessionLogs.error,
    streaks.error,
    studentProjects.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join("; "));
  }

  return {
    lesson_progress: lessonProgress.data ?? [],
    quiz_results: quizResults.data ?? [],
    session_logs: sessionLogs.data ?? [],
    streaks: streaks.data ?? [],
    student_projects: studentProjects.data ?? [],
  };
}

function parseLlmJson(content: string): LlmPayload {
  try {
    const parsed = JSON.parse(content) as Partial<LlmPayload>;

    return {
      message: typeof parsed.message === "string" ? parsed.message : content,
      next_actions: Array.isArray(parsed.next_actions)
        ? parsed.next_actions.filter((item): item is string => typeof item === "string")
        : [],
      metadata:
        parsed.metadata && typeof parsed.metadata === "object" && !Array.isArray(parsed.metadata)
          ? (parsed.metadata as JsonRecord)
          : {},
    };
  } catch {
    return {
      message: content,
      next_actions: [],
      metadata: { response_format: "text" },
    };
  }
}

async function callLlmProvider(prompt: string, aiConfig: JsonRecord) {
  const apiKey = process.env.AI_PROVIDER_API_KEY ?? process.env.OPENAI_API_KEY;
  const endpoint = process.env.AI_PROVIDER_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = typeof aiConfig.model === "string" ? aiConfig.model : "gpt-4.1-mini";
  const temperature = typeof aiConfig.temperature === "number" ? aiConfig.temperature : 0.4;
  const maxTokens = typeof aiConfig.max_tokens === "number" ? aiConfig.max_tokens : 1600;

  if (!apiKey) {
    throw new Error("AI provider API key is not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are the Educate Cybernetix AI Mentor. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider request failed with ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: JsonRecord;
    model?: string;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response");
  }

  return {
    ...parseLlmJson(content),
    provider_metadata: {
      model: data.model ?? model,
      usage: data.usage ?? null,
    },
  };
}

async function logInteraction(
  supabase: ReturnType<typeof createClient>,
  request: MentorRequest,
  prompt: string,
  response: string,
  metadata: JsonRecord,
) {
  const { error } = await supabase.from("ai_interactions").insert({
    student_id: request.student_id,
    ai_config_id: typeof request.ai_config.id === "string" ? request.ai_config.id : null,
    ai_module_context_id:
      request.module_context && typeof request.module_context.id === "string"
        ? request.module_context.id
        : null,
    interaction_type: request.mode,
    prompt,
    response,
    metadata,
  });

  if (error) {
    throw error;
  }
}

async function updateProgress(
  supabase: ReturnType<typeof createClient>,
  request: MentorRequest,
  nextActions: string[],
) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const tasks: unknown[] = [
    supabase.from("session_logs").insert({
      student_id: request.student_id,
      duration_seconds: 300,
      session_started_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      session_ended_at: now.toISOString(),
      activities: [request.mode],
      metadata: {
        module_id: request.module_id,
        lesson_id: request.lesson_id,
        project_id: request.project_id,
        next_actions: nextActions,
      },
    }),
  ];

  if (request.lesson_id) {
    tasks.push(
      supabase.from("lesson_progress").upsert(
        {
          student_id: request.student_id,
          module_key: request.module_id,
          lesson_key: request.lesson_id,
          status: "in_progress",
          progress_percent: 5,
          time_spent_seconds: 300,
          started_at: now.toISOString(),
          metadata: {
            last_mode: request.mode,
            project_id: request.project_id,
          },
          updated_at: now.toISOString(),
        },
        { onConflict: "student_id,module_key,lesson_key" },
      ),
    );
  }

  if (request.mode === "quiz") {
    tasks.push(
      supabase.from("quiz_results").insert({
        student_id: request.student_id,
        module_key: request.module_id,
        lesson_key: request.lesson_id,
        quiz_key: request.lesson_id ? `${request.lesson_id}-mentor-check` : `${request.module_id}-mentor-check`,
        quiz_title: "Mentor Check",
        score: 0,
        max_score: 100,
        passed: false,
        answers: {
          student_message: request.student_message,
        },
        feedback: {
          next_actions: nextActions,
        },
      }),
    );
  }

  const existingStreak = request.progress.streaks.find((item) => {
    return (
      item &&
      typeof item === "object" &&
      "streak_type" in item &&
      item.streak_type === "daily_learning"
    );
  }) as { current_count?: number; longest_count?: number; last_activity_date?: string | null } | undefined;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const currentCount =
    existingStreak?.last_activity_date === today
      ? (existingStreak.current_count ?? 1)
      : existingStreak?.last_activity_date === yesterdayKey
        ? (existingStreak.current_count ?? 0) + 1
        : 1;
  const longestCount = Math.max(currentCount, existingStreak?.longest_count ?? 0);

  tasks.push(
    supabase.from("streaks").upsert(
      {
        student_id: request.student_id,
        streak_type: "daily_learning",
        current_count: currentCount,
        longest_count: longestCount,
        last_activity_date: today,
        metadata: {
          last_module_id: request.module_id,
          last_mode: request.mode,
        },
        updated_at: now.toISOString(),
      },
      { onConflict: "student_id,streak_type" },
    ),
  );

  const results = await Promise.allSettled(tasks);
  const errors = results
    .map((result) => (result.status === "fulfilled" ? null : result.reason))
    .filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => String(error)).join("; "));
  }
}

export async function POST(request: Request) {
  let rawBody: MentorBody;

  try {
    rawBody = (await request.json()) as MentorBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { data: body, errors } = validateBody(rawBody);
  body.mode = inferMode(body);

  if (errors.length > 0) {
    return jsonError("Invalid mentor request", 400, { errors });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: userResult, error: userError } = await supabase.auth.getUser();

    if (userError || !userResult.user) {
      return jsonError("Authentication required", 401);
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id,user_id,display_name,grade_level,learning_goals,accessibility_preferences")
      .eq("id", body.student_id)
      .single();

    if (studentError || !student) {
      return jsonError("Student profile not found", 404);
    }

    if (student.user_id !== userResult.user.id) {
      return jsonError("Student profile does not belong to the authenticated user", 403);
    }

    const [{ data: aiConfig, error: aiConfigError }, { data: moduleContext, error: moduleError }] =
      await Promise.all([
        supabase
          .from("ai_config")
          .select("*")
          .eq("config_key", "global-ai-mentor")
          .eq("is_active", true)
          .single(),
        supabase
          .from("ai_module_context")
          .select("*")
          .eq("module_key", body.module_id)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

    if (aiConfigError || !aiConfig) {
      return jsonError("AI mentor configuration is not available", 500, {
        detail: aiConfigError?.message,
      });
    }

    if (moduleError) {
      return jsonError("Module context could not be loaded", 500, {
        detail: moduleError.message,
      });
    }

    const progress = await fetchProgress(supabase, body.student_id, body.project_id);
    const mentorRequest: MentorRequest = {
      ...body,
      ai_config: aiConfig,
      module_context: moduleContext,
      progress,
    };
    const prompt = compileMentorPrompt(mentorRequest);
    const llm = await callLlmProvider(prompt, aiConfig);
    const metadata: JsonRecord = {
      ...llm.metadata,
      provider: llm.provider_metadata,
      module_context_found: Boolean(moduleContext),
      routed_mode: body.mode,
      intent_hint: body.intent_hint,
    };

    await logInteraction(supabase, mentorRequest, prompt, llm.message, metadata);

    try {
      await updateProgress(supabase, mentorRequest, llm.next_actions);
    } catch (progressError) {
      metadata.progress_update_error =
        progressError instanceof Error ? progressError.message : "Unknown progress update error";
    }

    return Response.json({
      message: llm.message,
      mode: body.mode,
      next_actions: llm.next_actions,
      metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected mentor error";

    return jsonError("Unable to process mentor request", 500, { detail: message });
  }
}
