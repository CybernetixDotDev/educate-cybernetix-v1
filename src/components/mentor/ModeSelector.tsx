"use client";

import type { MentorMode } from "@/hooks/useMentor";

type ModeSelectorProps = {
  mode: MentorMode;
  onChange: (mode: MentorMode) => void;
};

const MODES: Array<{ value: MentorMode; label: string; description: string }> = [
  { value: "teacher", label: "Teacher", description: "Explain and guide" },
  { value: "quizmaster", label: "Quizmaster", description: "Practice recall" },
  { value: "builder", label: "Builder", description: "Ship the project" },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
      {MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          title={item.description}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === item.value
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
