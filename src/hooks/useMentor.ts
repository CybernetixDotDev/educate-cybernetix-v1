"use client";

import { useCallback, useState } from "react";

export type MentorRole = "student" | "mentor" | "system";

export type MentorMode = "teacher" | "quiz" | "quizmaster" | "builder" | "debug" | "review" | "general";

export type MentorMessage = {
  id: string;
  role: MentorRole;
  content: string;
  created_at: string;
  mode?: MentorMode;
  metadata?: Record<string, unknown>;
  next_actions?: string[];
};

export type MentorSendInput = {
  student_id: string;
  mode?: MentorMode;
  intent_hint?: "lesson" | "quiz" | "project" | "debug" | "review" | "presentation" | "coach" | null;
  module_id?: string | null;
  lesson_id?: string | null;
  project_id?: string | null;
  student_message: string;
  code_snippet?: string | null;
};

export type MentorResponse = {
  message: string;
  mode: MentorMode;
  next_actions: string[];
  metadata: Record<string, unknown>;
};

export type UseMentorResult = {
  messages: MentorMessage[];
  sendMessage: (input: MentorSendInput) => Promise<MentorResponse | null>;
  loading: boolean;
  error: string | null;
  mode: MentorMode;
  setMode: (mode: MentorMode) => void;
  reset: () => void;
};

function createMessage(role: MentorRole, content: string, extras: Partial<MentorMessage> = {}): MentorMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
    ...extras,
  };
}

function inferMentorMode(input: MentorSendInput, currentMode: MentorMode): MentorMode {
  if (input.mode && input.mode !== "general") return input.mode;

  const hint = input.intent_hint;
  if (hint === "quiz") return "quiz";
  if (hint === "project" || hint === "presentation") return "builder";
  if (hint === "debug") return "debug";
  if (hint === "review") return "review";
  if (hint === "lesson") return "teacher";

  const message = input.student_message.toLowerCase();
  const combined = `${input.student_message}\n${input.code_snippet ?? ""}`;
  const hasCode = Boolean(input.code_snippet?.trim());

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

  if (input.project_id) return "builder";
  if (input.lesson_id || input.module_id) return "teacher";
  return currentMode === "general" ? "teacher" : currentMode;
}

function describeSpecialist(mode: MentorMode, intentHint: MentorSendInput["intent_hint"]) {
  if (intentHint === "presentation") return "presentation coach";
  if (mode === "debug") return "debugging coach";
  if (mode === "review") return "code reviewer";
  if (mode === "builder") return "project builder";
  if (mode === "quiz" || mode === "quizmaster") return "quiz coach";
  if (mode === "teacher") return "teacher";
  return "general coach";
}

async function readMentorResponse(response: Response): Promise<MentorResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const errorPayload = contentType.includes("application/json")
      ? ((await response.json()) as { error?: string })
      : { error: await response.text() };

    throw new Error(errorPayload.error ?? `Mentor request failed with ${response.status}`);
  }

  if (response.body && contentType.includes("text/event-stream")) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      content += decoder.decode(value, { stream: true });
    }

    return {
      message: content.trim(),
      mode: "general",
      next_actions: [],
      metadata: { response_format: "stream" },
    };
  }

  return (await response.json()) as MentorResponse;
}

export function useMentor(): UseMentorResult {
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MentorMode>("general");

  const sendMessage = useCallback(async (input: MentorSendInput) => {
    const trimmedMessage = input.student_message.trim();
    const trimmedCode = input.code_snippet?.trim() ?? null;
    const requestMode = inferMentorMode(input, input.mode ?? mode);
    const apiMode = requestMode === "quizmaster" ? "quiz" : requestMode;
    const moduleId = input.module_id ?? "general";

    if (!input.student_id || !requestMode || (!trimmedMessage && !trimmedCode)) {
      setError("student_id and a message or code snippet are required");
      return null;
    }

    const studentMessage = createMessage("student", trimmedMessage || "Code review request", {
      mode: requestMode,
      metadata: {
        module_id: moduleId,
        lesson_id: input.lesson_id ?? null,
        project_id: input.project_id ?? null,
        intent_hint: input.intent_hint ?? null,
        routed_to: describeSpecialist(apiMode, input.intent_hint),
        has_code_snippet: Boolean(trimmedCode),
      },
    });

    setMessages((current) => [...current, studentMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          mode: apiMode,
          module_id: moduleId,
          student_message: trimmedMessage,
          code_snippet: trimmedCode,
        }),
      });
      const mentorResponse = await readMentorResponse(response);
      setMode(mentorResponse.mode);
      const mentorMessage = createMessage("mentor", mentorResponse.message, {
        mode: mentorResponse.mode,
        metadata: {
          ...mentorResponse.metadata,
          intent_hint: input.intent_hint ?? null,
          routed_to: describeSpecialist(mentorResponse.mode, input.intent_hint),
        },
        next_actions: mentorResponse.next_actions,
      });

      setMessages((current) => [...current, mentorMessage]);
      return mentorResponse;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to send mentor message";
      setError(message);
      setMessages((current) => [
        ...current,
        createMessage("system", message, {
          metadata: { level: "error" },
        }),
      ]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    messages,
    sendMessage,
    loading,
    error,
    mode,
    setMode,
    reset,
  };
}
