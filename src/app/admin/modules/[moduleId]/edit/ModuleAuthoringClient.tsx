"use client";

import { ModuleLessonManager } from "@/components/module-editor/ModuleLessonManager";
import { ModuleMetadataEditor } from "@/components/module-editor/ModuleMetadataEditor";
import { ModulePreview } from "@/components/module-editor/ModulePreview";
import type { ModuleLessonOption } from "@/lib/modules/loadModule";
import { saveModule, type ModuleAuthoringSchema } from "@/lib/modules/saveModule";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ModuleAuthoringClientProps = {
  initialModule: ModuleAuthoringSchema;
  lessonOptions: ModuleLessonOption[];
  exists: boolean;
};

type Tab = "metadata" | "lessons" | "preview";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "metadata", label: "Metadata" },
  { key: "lessons", label: "Lessons" },
  { key: "preview", label: "Preview" },
];

export function ModuleAuthoringClient({ initialModule, lessonOptions, exists }: ModuleAuthoringClientProps) {
  const [module, setModule] = useState(initialModule);
  const [tab, setTab] = useState<Tab>("metadata");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(exists ? "Loaded module" : "New module draft");
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(
    async (nextModule = module) => {
      setSaving(true);
      setError(null);

      try {
        const result = await saveModule(nextModule);
        if (!result.ok || !result.module) {
          setError(result.error ?? "Unable to save module");
          return;
        }
        setModule(result.module);
        setStatus("Saved");
      } finally {
        setSaving(false);
      }
    },
    [module],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      void handleSave();
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [handleSave]);

  async function togglePublish() {
    const next = { ...module, published: !module.published };
    setModule(next);
    await handleSave(next);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Link href={`/admin/modules/${module.module_id}`} className="text-sm font-semibold text-cyan-700">
            Back to module details
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Module Authoring</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">{module.title || "Untitled module"}</h1>
              <p className="mt-1 font-mono text-sm text-slate-500">{module.module_id}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void togglePublish()}
                disabled={saving}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${module.published ? "bg-amber-600" : "bg-emerald-600"}`}
              >
                {module.published ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
          {(status || error) && <p className={`mt-3 text-sm ${error ? "text-rose-600" : "text-emerald-700"}`}>{error ?? status}</p>}
        </header>

        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === item.key ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {tab === "metadata" && <ModuleMetadataEditor module={module} onChange={setModule} />}
          {tab === "lessons" && <ModuleLessonManager module={module} lessonOptions={lessonOptions} onChange={setModule} />}
          {tab === "preview" && <ModulePreview module={module} lessonOptions={lessonOptions} />}
        </section>
      </div>
    </main>
  );
}
