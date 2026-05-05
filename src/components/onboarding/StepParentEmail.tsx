"use client";

type StepParentEmailProps = {
  value: string;
  onChange: (value: string) => void;
};

export function StepParentEmail({ value, onChange }: StepParentEmailProps) {
  const invalid = value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">Parent email</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="email"
        autoComplete="email"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        placeholder="parent@example.com"
      />
      <span className={`mt-2 block text-sm ${invalid ? "text-rose-600" : "text-slate-500"}`}>
        Optional. If your parent already has an account, we will link them to your progress.
      </span>
    </label>
  );
}

