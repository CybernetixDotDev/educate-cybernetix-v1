import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type AIModelPurpose = "json" | "text" | "streaming";

export type AIConfigLike = {
  model?: unknown;
  settings?: unknown;
};

function settingModel(settings: unknown, purpose: AIModelPurpose) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const record = settings as Record<string, unknown>;
  const value = record[`${purpose}_model`] ?? record.model;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function getModel(purpose: AIModelPurpose = "json", aiConfig?: AIConfigLike | null): Promise<string> {
  const envModel =
    purpose === "streaming"
      ? process.env.AI_STREAMING_MODEL
      : purpose === "text"
        ? process.env.AI_TEXT_MODEL
        : process.env.AI_JSON_MODEL;

  if (envModel) return envModel;

  const configuredModel =
    settingModel(aiConfig?.settings, purpose) ??
    (typeof aiConfig?.model === "string" && aiConfig.model.trim().length > 0 ? aiConfig.model : null);

  if (configuredModel) return configuredModel;

  try {
    const supabase = createClient(await cookies());
    const { data } = await supabase
      .from("ai_config")
      .select("model, settings")
      .eq("config_key", "global-ai-mentor")
      .maybeSingle();

    const dbModel = settingModel(data?.settings, purpose) ?? data?.model;
    if (typeof dbModel === "string" && dbModel.trim().length > 0) return dbModel;
  } catch {
    // Fall back to environment/default model when the request has no Supabase context.
  }

  return process.env.AI_MODEL ?? "gpt-4.1-mini";
}

