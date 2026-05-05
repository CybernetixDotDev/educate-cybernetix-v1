"use client";

import type { ParentReportJSON } from "@/lib/ai/generateParentReport";

type ReportPreviewProps = {
  report: ParentReportJSON | null;
  onChange: (report: ParentReportJSON) => void;
};

const SKILLS = ["html", "css", "javascript", "nextjs", "supabase", "threejs", "git", "apis"] as const;

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

export function ReportPreview({ report, onChange }: ReportPreviewProps) {
  if (!report) {
    return (
      <section className="rounded-2xl border border-dashed border-cyan-300 bg-white p-8 text-center text-sm text-slate-500">
        Generated parent report preview will appear here.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Monthly Report</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">{report.month}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Engagement Summary</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Minutes" value={report.engagement_summary.minutes} />
            <Metric label="Days Active" value={report.engagement_summary.days_active} />
            <Metric label="Streak" value={report.engagement_summary.streak} />
          </div>
          <textarea value={report.engagement_summary.consistency_notes} onChange={(event) => onChange({ ...report, engagement_summary: { ...report.engagement_summary, consistency_notes: event.target.value } })} rows={5} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Attendance</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <input type="number" value={report.attendance.sessions_attended} onChange={(event) => onChange({ ...report, attendance: { ...report.attendance, sessions_attended: Number(event.target.value) } })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input type="number" value={report.attendance.sessions_missed} onChange={(event) => onChange({ ...report, attendance: { ...report.attendance, sessions_missed: Number(event.target.value) } })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <textarea value={report.attendance.notes} onChange={(event) => onChange({ ...report, attendance: { ...report.attendance, notes: event.target.value } })} rows={5} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Skill Mastery Growth</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SKILLS.map((skill) => (
            <div key={skill}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase text-slate-700">{skill}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={report.skill_growth[skill]}
                  onChange={(event) => onChange({ ...report, skill_growth: { ...report.skill_growth, [skill]: Number(event.target.value) } })}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-bold"
                />
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" style={{ width: `${report.skill_growth[skill]}%` }} />
              </div>
            </div>
          ))}
        </div>
        <textarea value={report.skill_growth.growth_notes} onChange={(event) => onChange({ ...report, skill_growth: { ...report.skill_growth, growth_notes: event.target.value } })} rows={4} className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Quiz Performance</h3>
          <input type="number" value={report.quiz_performance.average_score} onChange={(event) => onChange({ ...report, quiz_performance: { ...report.quiz_performance, average_score: Number(event.target.value) } })} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={report.quiz_performance.strengths.join("\n")} onChange={(event) => onChange({ ...report, quiz_performance: { ...report.quiz_performance, strengths: lines(event.target.value) } })} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={report.quiz_performance.weaknesses.join("\n")} onChange={(event) => onChange({ ...report, quiz_performance: { ...report.quiz_performance, weaknesses: lines(event.target.value) } })} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Project Progress</h3>
          <input value={report.project_progress.title} onChange={(event) => onChange({ ...report, project_progress: { ...report.project_progress, title: event.target.value } })} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input type="number" value={report.project_progress.completed_tasks} onChange={(event) => onChange({ ...report, project_progress: { ...report.project_progress, completed_tasks: Number(event.target.value) } })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input type="number" value={report.project_progress.total_tasks} onChange={(event) => onChange({ ...report, project_progress: { ...report.project_progress, total_tasks: Number(event.target.value) } })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <textarea value={report.project_progress.notes} onChange={(event) => onChange({ ...report, project_progress: { ...report.project_progress, notes: event.target.value } })} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">AI Mentor Interactions</h3>
        <input type="number" value={report.mentor_interactions.messages_sent} onChange={(event) => onChange({ ...report, mentor_interactions: { ...report.mentor_interactions, messages_sent: Number(event.target.value) } })} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <textarea value={report.mentor_interactions.topics_discussed.join("\n")} onChange={(event) => onChange({ ...report, mentor_interactions: { ...report.mentor_interactions, topics_discussed: lines(event.target.value) } })} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <textarea value={report.mentor_interactions.engagement_notes} onChange={(event) => onChange({ ...report, mentor_interactions: { ...report.mentor_interactions, engagement_notes: event.target.value } })} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Recommendations</h3>
          <textarea value={report.recommendations.join("\n")} onChange={(event) => onChange({ ...report, recommendations: lines(event.target.value) })} rows={8} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">What to Focus on Next</h3>
          <textarea value={report.next_steps.join("\n")} onChange={(event) => onChange({ ...report, next_steps: lines(event.target.value) })} rows={8} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </article>
      </div>
    </section>
  );
}
