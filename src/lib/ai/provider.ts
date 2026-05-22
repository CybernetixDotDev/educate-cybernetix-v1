import "server-only";

import { compilePrompt, type CompilePromptInput } from "@/lib/ai/compilePrompt";
import { getModel, type AIModelPurpose } from "@/lib/ai/getModel";

type ChatCompletionPayload = {
  choices?: Array<{
    message?: { content?: string | null };
    delta?: { content?: string | null };
  }>;
};

type LLMOptions = {
  purpose?: AIModelPurpose;
  system?: string;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
  metadata?: Record<string, unknown>;
};

function apiKey() {
  return process.env.AI_PROVIDER_API_KEY ?? process.env.OPENAI_API_KEY;
}

function endpoint() {
  return process.env.AI_PROVIDER_URL ?? "https://api.openai.com/v1/chat/completions";
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function defaultTimeoutMs(json: boolean) {
  if (json) {
    return numberEnv("AI_PROVIDER_JSON_TIMEOUT_MS", numberEnv("AI_PROVIDER_TIMEOUT_MS", 120_000));
  }

  return numberEnv("AI_PROVIDER_TEXT_TIMEOUT_MS", numberEnv("AI_PROVIDER_TIMEOUT_MS", 60_000));
}

function logLLM(event: string, metadata: Record<string, unknown>) {
  if (process.env.AI_PROVIDER_LOGS === "silent") return;
  console.info(`[ai-provider] ${event}`, metadata);
}

function isTransientStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed) as unknown;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callChatCompletion(modelInput: string, promptInput: CompilePromptInput, options: LLMOptions & { json: boolean }) {
  const key = apiKey();
  if (!key) throw new Error("AI provider API key is not configured");

  const prompt = await compilePrompt(promptInput);
  const model = modelInput || (await getModel(options.purpose ?? (options.json ? "json" : "text")));
  const retries = options.retries ?? (options.json ? 1 : 0);
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs(options.json);
  const startedAt = Date.now();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        endpoint(),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: options.temperature ?? (options.json ? 0.25 : 0.5),
            response_format: options.json ? { type: "json_object" } : undefined,
            messages: [
              {
                role: "system",
                content:
                  options.system ??
                  (options.json
                    ? "Return valid JSON only. Do not wrap the response in markdown fences."
                    : "Return a concise, useful response."),
              },
              { role: "user", content: prompt },
            ],
          }),
        },
        timeoutMs,
      );

      if (!response.ok) {
        const body = (await response.text()).slice(0, 700);
        const message = `AI provider failed with ${response.status}: ${body}`;
        if (attempt < retries && isTransientStatus(response.status)) {
          logLLM("retry", { model, attempt: attempt + 1, status: response.status, ...options.metadata });
          continue;
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as ChatCompletionPayload;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI provider returned an empty response");

      logLLM("complete", {
        model,
        purpose: options.purpose ?? (options.json ? "json" : "text"),
        elapsed_ms: Date.now() - startedAt,
        ...options.metadata,
      });

      return content;
    } catch (error) {
      const transient = error instanceof Error && error.name === "AbortError";
      if (attempt < retries && transient) {
        logLLM("retry", { model, attempt: attempt + 1, reason: "timeout", ...options.metadata });
        continue;
      }

      logLLM("error", {
        model,
        purpose: options.purpose ?? (options.json ? "json" : "text"),
        error: error instanceof Error ? error.message : "Unknown AI provider error",
        ...options.metadata,
      });
      throw error;
    }
  }

  throw new Error("AI provider failed after retry");
}

export async function callJsonLLM<T = unknown>(
  model: string,
  prompt: CompilePromptInput,
  options: LLMOptions = {},
): Promise<T> {
  const content = await callChatCompletion(model, prompt, { ...options, purpose: options.purpose ?? "json", json: true });

  try {
    return parseJsonContent(content) as T;
  } catch (error) {
    throw new Error(`AI provider returned invalid JSON: ${error instanceof Error ? error.message : "parse failed"}`);
  }
}

export async function callTextLLM(
  model: string,
  prompt: CompilePromptInput,
  options: LLMOptions = {},
): Promise<string> {
  return callChatCompletion(model, prompt, { ...options, purpose: options.purpose ?? "text", json: false });
}

export async function* callStreamingLLM(
  modelInput: string,
  promptInput: CompilePromptInput,
  options: LLMOptions = {},
): AsyncGenerator<string> {
  const key = apiKey();
  if (!key) throw new Error("AI provider API key is not configured");

  const prompt = await compilePrompt(promptInput);
  const model = modelInput || (await getModel(options.purpose ?? "streaming"));
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.5,
      stream: true,
      messages: [
        { role: "system", content: options.system ?? "Return a concise, useful response." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI provider stream failed with ${response.status}: ${(await response.text()).slice(0, 700)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const payload = JSON.parse(data) as ChatCompletionPayload;
          const token = payload.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // Ignore malformed stream frames and continue reading.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
