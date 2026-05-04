"use client";

import type { WeeklySummaryInput } from "@/lib/ai/generateWeeklySummary";

export type SummaryStudentOption = {
  student_id: string;
  name: string;
};

type SummaryGenerationFormProps = {
  students: SummaryStudentOption[];
  value: WeeklySummaryInput;
  onChange: (value: WeeklySummaryInput) => void;
};

export function SummaryGenerationForm({ students, value, onChange }: SummaryGenerationFormProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Summary Inputs</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-slate-800">student_id</span>
          <select
            value={value.student_id}
            onChange={(event) => onChange({ ...value, student_id: event.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold text-slate-800">week_number</span>
          <input
            type="number"
            min={1}
            max={52}
            value={value.week_number}
            onChange={(event) => onChange({ ...value, week_number: Number(event.target.value) })}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </section>
  );
}
