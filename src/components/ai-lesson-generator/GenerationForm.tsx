"use client";

import type { LessonGenerationInput } from "@/lib/ai/generateLesson";

export type ModuleOption = {
  module_id: string;
  title: string;
};

type GenerationFormProps = {
  modules: ModuleOption[];
  value: LessonGenerationInput;
  onChange: (value: LessonGenerationInput) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function GenerationForm({ modules, value, onChange }: GenerationFormProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Generation Inputs</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-slate-800">module_id</span>
          <select
            value={value.module_id}
            onChange={(event) => onChange({ ...value, module_id: event.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select module</option>
            {modules.map((module) => (
              <option key={module.module_id} value={module.module_id}>
                {module.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-800">difficulty_level</span>
          <select
            value={value.difficulty_level}
            onChange={(event) =>
              onChange({
                ...value,
                difficulty_level: event.target.value as LessonGenerationInput["difficulty_level"],
              })
            }
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-slate-800">lesson_title</span>
          <input
            value={value.lesson_title}
            onChange={(event) => onChange({ ...value, lesson_title: event.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Build your first responsive hero"
          />
        </label>
        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-slate-800">learning_objectives[]</span>
          <textarea
            value={value.learning_objectives.join(", ")}
            onChange={(event) => onChange({ ...value, learning_objectives: csv(event.target.value) })}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
            placeholder="Explain responsive breakpoints, Build a hero section, Test mobile layout"
          />
        </label>
      </div>
    </section>
  );
}
