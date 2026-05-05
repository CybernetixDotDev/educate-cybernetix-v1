"use client";

type StepProjectPreferenceProps = {
  value: string;
  onChange: (value: string) => void;
};

const PROJECTS = [
  "3D product viewer",
  "AI study buddy",
  "E-commerce micro-store",
  "Portfolio site",
  "Game prototype",
  "Community app",
  "Dashboard",
];

export function StepProjectPreference({ value, onChange }: StepProjectPreferenceProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">Which project sounds most exciting?</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      >
        <option value="">Select project</option>
        {PROJECTS.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
    </label>
  );
}

