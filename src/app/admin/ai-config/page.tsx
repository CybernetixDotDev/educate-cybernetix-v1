import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { JSONEditor } from "@/components/admin/JSONEditor";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type AIConfig = {
  id: string;
  config_key: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number | null;
  system_prompt: string | null;
  safety_rules: string[];
  settings: unknown;
};

function json(value: FormDataEntryValue | null, fallback: unknown) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

async function saveConfig(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase
    .from("ai_config")
    .update({
      provider: String(formData.get("provider") ?? ""),
      model: String(formData.get("model") ?? ""),
      temperature: Number(formData.get("temperature") ?? 0.4),
      max_tokens: Number(formData.get("max_tokens") ?? 0) || null,
      system_prompt: String(formData.get("system_prompt") ?? ""),
      safety_rules: String(formData.get("safety_rules") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
      settings: json(formData.get("settings"), {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/ai-config");
}

export default async function AdminAIConfigPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle();
  const config = data as AIConfig | null;

  if (!config) {
    return <main className="p-8 text-slate-600">Global AI mentor config not found.</main>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <FormSection title="Global AI Mentor Config" description="Controls the global mentor brain and provider settings.">
          <form action={saveConfig} className="space-y-4">
            <input type="hidden" name="id" value={config.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Provider" name="provider" defaultValue={config.provider} />
              <Field label="Model" name="model" defaultValue={config.model} />
              <Field label="Temperature" name="temperature" type="number" defaultValue={config.temperature} />
              <Field label="Max tokens" name="max_tokens" type="number" defaultValue={config.max_tokens} />
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">System prompt</span>
              <textarea name="system_prompt" defaultValue={config.system_prompt ?? ""} rows={6} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Safety rules</span>
              <textarea name="safety_rules" defaultValue={config.safety_rules.join("\n")} rows={6} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" />
            </label>
            <JSONEditor name="settings" label="Mentor settings JSON" value={config.settings} />
            <SubmitButton>Save Config</SubmitButton>
          </form>
        </FormSection>
      </div>
    </main>
  );
}
