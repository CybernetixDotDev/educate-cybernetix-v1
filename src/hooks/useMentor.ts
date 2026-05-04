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
  const [mode, setMode] = useState<MentorMode>("teacher");

  const sendMessage = useCallback(async (input: MentorSendInput) => {
    const trimmedMessage = input.student_message.trim();
    const trimmedCode = input.code_snippet?.trim() ?? null;
    const requestMode = input.mode ?? mode;
    const apiMode = requestMode === "quizmaster" ? "quiz" : requestMode;
    const moduleId = input.module_id ?? "general";

    if (!input.student_id || !requestMode || (!trimmedMessage && !trimmedCode)) {
      setError("student_id, mode, and a message or code snippet are required");
      return null;
    }

    const studentMessage = createMessage("student", trimmedMessage || "Code review request", {
      mode: requestMode,
      metadata: {
        module_id: moduleId,
        lesson_id: input.lesson_id ?? null,
        project_id: input.project_id ?? null,
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
      const mentorMessage = createMessage("mentor", mentorResponse.message, {
        mode: mentorResponse.mode,
        metadata: mentorResponse.metadata,
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
