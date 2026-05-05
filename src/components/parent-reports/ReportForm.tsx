"use client";

import type { ParentReportInput } from "@/lib/ai/generateParentReport";

export type ParentReportStudentOption = {
  id: string;
  display_name: string;
  email: string | null;
};

type ReportFormProps = {
  students: ParentReportStudentOption[];
  value: ParentReportInput;
  onChange: (value: ParentReportInput) => void;
};

export function ReportForm({ students, value, onChange }: ReportFormProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Parent Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Monthly Parent Report Generator</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a student and month. The report uses active curriculum context, progress, analytics, mentor interactions, and project data.
        </p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Student</span>
          <select
            value={value.student_id}
            onChange={(event) => onChange({ ...value, student_id: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.display_name}
                {student.email ? ` (${student.email})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Month</span>
          <input
            type="month"
            value={value.month}
            onChange={(event) => onChange({ ...value, month: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </section>
  );
}
