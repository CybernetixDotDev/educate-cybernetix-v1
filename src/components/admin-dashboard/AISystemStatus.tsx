import type { AdminAIConfig, AdminAIInteraction } from "@/app/admin/page";
import Link from "next/link";

export function AISystemStatus({ aiConfig, interactions }: { aiConfig: AdminAIConfig | null; interactions: AdminAIInteraction[] }) {
  const lastSuccess = interactions.find((interaction) => interaction.response);
  const lastError = interactions.find((interaction) => {
    const error = interaction.metadata?.error ?? interaction.metadata?.error_message;
    return typeof error === "string" && error.length > 0;
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">AI System Monitoring</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Mentor provider</h2>
        </div>
        <Link href="/admin/ai-config" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
          Open AI Config
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatusBox label="Provider" value={aiConfig?.provider ?? "Not configured"} />
        <StatusBox label="Model" value={aiConfig?.model ?? "No model"} />
        <StatusBox label="Status" value={aiConfig?.is_active ? "Active" : "Inactive"} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-emerald-50 p-4">
          <h3 className="text-sm font-semibold text-emerald-950">Last successful call</h3>
          <p className="mt-2 text-sm text-emerald-800">{lastSuccess ? new Date(lastSuccess.created_at).toLocaleString() : "No AI calls logged yet."}</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-4">
          <h3 className="text-sm font-semibold text-rose-950">Last error</h3>
          <p className="mt-2 text-sm text-rose-800">{lastError ? String(lastError.metadata.error ?? lastError.metadata.error_message) : "No stored AI errors found."}</p>
        </div>
      </div>
    </section>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

