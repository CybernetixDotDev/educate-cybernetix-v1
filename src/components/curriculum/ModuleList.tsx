"use client";

import { createModule, deleteModule } from "@/lib/curriculum/manageCurriculum";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type CurriculumModule = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
};

type ModuleListProps = {
  modules: CurriculumModule[];
  selectedModuleId: string | null;
};

export function ModuleList({ modules, selectedModuleId }: ModuleListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Modules</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Curriculum modules</h2>
      </div>

      <form action={createModule} className="mt-5 grid gap-3">
        <input name="title" required placeholder="Module title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <textarea name="description" placeholder="Description" className="min-h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="order_index" type="number" placeholder="Order" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Module</button>
      </form>

      <div className="mt-6 space-y-3">
        {modules.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No modules yet.</p>}
        {modules.map((module) => (
          <div key={module.id} className={`rounded-lg border p-3 ${module.id === selectedModuleId ? "border-cyan-300 bg-cyan-50" : "border-slate-200"}`}>
            <button type="button" onClick={() => router.push(`/admin/curriculum?moduleId=${module.id}`)} className="block w-full text-left">
              <p className="font-semibold text-slate-950">{module.order_index}. {module.title}</p>
              <p className="mt-1 text-sm text-slate-500">{module.description ?? "No description"}</p>
            </button>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => router.push(`/admin/curriculum?moduleId=${module.id}`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Edit Module</button>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await deleteModule(module.id);
                  router.refresh();
                })}
                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                Delete Module
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

