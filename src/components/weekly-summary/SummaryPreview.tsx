"use client";

import type { WeeklySummaryJSON } from "@/lib/ai/generateWeeklySummary";

type SummaryPreviewProps = {
  summary: WeeklySummaryJSON | null;
  onChange: (summary: WeeklySummaryJSON) => void;
};

function csv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function SummaryPreview({ summary, onChange }: SummaryPreviewProps) {
  if (!summary) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Generated weekly summary preview will appear here.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Parent Summary</h2>
          <textarea
            value={summary.parent_summary}
            onChange={(event) => onChange({ ...summary, parent_summary: event.target.value })}
            rows={8}
            className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6"
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Student Reflection</h2>
          <textarea
            value={summary.student_reflection}
            onChange={(event) => onChange({ ...summary, student_reflection: event.target.value })}
            rows={8}
            className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Engagement Analytics</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Metric label="Minutes" value={summary.engagement.minutes} />
            <Metric label="Streak" value={summary.engagement.streak} />
            <Metric label="Days" value={summary.engagement.days_active} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Skill Mastery Insights</h2>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">Strengths</span>
            <input value={summary.skill_insights.strengths.join(", ")} onChange={(event) => onChange({ ...summary, skill_insights: { ...summary.skill_insights, strengths: csv(event.target.value) } })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-semibold text-slate-800">Weaknesses</span>
            <input value={summary.skill_insights.weaknesses.join(", ")} onChange={(event) => onChange({ ...summary, skill_insights: { ...summary.skill_insights, weaknesses: csv(event.target.value) } })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Project Progress</h2>
          <input value={summary.project_update.title} onChange={(event) => onChange({ ...summary, project_update: { ...summary.project_update, title: event.target.value } })} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input type="number" value={summary.project_update.completed_tasks} onChange={(event) => onChange({ ...summary, project_update: { ...summary.project_update, completed_tasks: Number(event.target.value) } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" value={summary.project_update.total_tasks} onChange={(event) => onChange({ ...summary, project_update: { ...summary.project_update, total_tasks: Number(event.target.value) } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <textarea value={summary.project_update.notes} onChange={(event) => onChange({ ...summary, project_update: { ...summary.project_update, notes: event.target.value } })} rows={4} className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm" />
        </div>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Preview</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Week {summary.week_number} Summary</h2>
        <p className="mt-4 leading-7 text-slate-600">{summary.parent_summary}</p>
        <div className="mt-5 rounded-lg bg-violet-50 p-4 text-violet-900">{summary.student_reflection}</div>
      </article>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
