"use client";

import type { QuizGenerationInput, QuizType } from "@/lib/ai/generateQuiz";

export type QuizModuleOption = {
  module_id: string;
  title: string;
  lessons: Array<{ lesson_id: string; title: string }>;
};

type QuizGenerationFormProps = {
  modules: QuizModuleOption[];
  value: QuizGenerationInput;
  onChange: (value: QuizGenerationInput) => void;
};

const SKILLS = ["html", "css", "javascript", "nextjs", "apis", "supabase", "threejs", "project_management"];

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function QuizGenerationForm({ modules, value, onChange }: QuizGenerationFormProps) {
  const lessons = modules.find((module) => module.module_id === value.module_id)?.lessons ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Quiz Generation Inputs</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-slate-800">module_id</span>
          <select
            value={value.module_id}
            onChange={(event) => onChange({ ...value, module_id: event.target.value, lesson_id: null })}
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
          <span className="text-sm font-semibold text-slate-800">lesson_id optional</span>
          <select
            value={value.lesson_id ?? ""}
            onChange={(event) => onChange({ ...value, lesson_id: event.target.value || null })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">No lesson selected</option>
            {lessons.map((lesson) => (
              <option key={lesson.lesson_id} value={lesson.lesson_id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-800">quiz_type</span>
          <select
            value={value.quiz_type}
            onChange={(event) => onChange({ ...value, quiz_type: event.target.value as QuizType })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="lesson">Lesson</option>
            <option value="module">Module</option>
            <option value="remediation">Remediation</option>
            <option value="challenge">Challenge</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SkillSelector
          label="weak_skills[]"
          values={value.weak_skills}
          onToggle={(skill) => onChange({ ...value, weak_skills: toggle(value.weak_skills, skill) })}
        />
        <SkillSelector
          label="strong_skills[]"
          values={value.strong_skills}
          onToggle={(skill) => onChange({ ...value, strong_skills: toggle(value.strong_skills, skill) })}
        />
      </div>
    </section>
  );
}

function SkillSelector({ label, values, onToggle }: { label: string; values: string[]; onToggle: (skill: string) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SKILLS.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => onToggle(skill)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              values.includes(skill) ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}
