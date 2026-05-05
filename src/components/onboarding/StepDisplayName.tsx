"use client";

type StepDisplayNameProps = {
  value: string;
  onChange: (value: string) => void;
};

export function StepDisplayName({ value, onChange }: StepDisplayNameProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">What should we call you?</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="name"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        placeholder="Alex"
      />
    </label>
  );
}

