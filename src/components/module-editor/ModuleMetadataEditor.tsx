"use client";

import type { ModuleAuthoringSchema } from "@/lib/modules/saveModule";

type ModuleMetadataEditorProps = {
  module: ModuleAuthoringSchema;
  onChange: (module: ModuleAuthoringSchema) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function ModuleMetadataEditor({ module, onChange }: ModuleMetadataEditorProps) {
  function update(patch: Partial<ModuleAuthoringSchema>) {
    onChange({ ...module, ...patch });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="text-sm font-semibold text-slate-800">module_id</span>
        <input
          value={module.module_id}
          onChange={(event) => update({ module_id: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">week_number</span>
        <input
          type="number"
          value={module.week_number}
          onChange={(event) => update({ week_number: Number(event.target.value) })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="md:col-span-2">
        <span className="text-sm font-semibold text-slate-800">Title</span>
        <input
          value={module.title}
          onChange={(event) => update({ title: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="md:col-span-2">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <textarea
          value={module.description}
          onChange={(event) => update({ description: event.target.value })}
          rows={5}
          className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">Prerequisites</span>
        <input
          value={module.prerequisites.join(", ")}
          onChange={(event) => update({ prerequisites: csv(event.target.value) })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-slate-800">Outcomes</span>
        <input
          value={module.outcomes.join(", ")}
          onChange={(event) => update({ outcomes: csv(event.target.value) })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 md:col-span-2">
        <input
          type="checkbox"
          checked={module.published}
          onChange={(event) => update({ published: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-900">Published</span>
          <span className="block text-sm text-slate-500">Published modules are visible to learners.</span>
        </span>
      </label>
    </div>
  );
}
