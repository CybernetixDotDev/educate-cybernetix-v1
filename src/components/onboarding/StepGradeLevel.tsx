"use client";

type StepGradeLevelProps = {
  value: string;
  onChange: (value: string) => void;
};

const GRADES = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export function StepGradeLevel({ value, onChange }: StepGradeLevelProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">Which grade are you in?</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      >
        <option value="">Select grade</option>
        {GRADES.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>
    </label>
  );
}

