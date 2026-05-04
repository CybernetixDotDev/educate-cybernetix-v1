"use client";

import type { CoachingPlanJSON } from "@/lib/ai/generateCoachingPlan";

type CoachingPreviewProps = {
  plan: CoachingPlanJSON | null;
  onChange: (plan: CoachingPlanJSON) => void;
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

function csv(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function join(value: string[]) {
  return value.join("\n");
}

export function CoachingPreview({ plan, onChange }: CoachingPreviewProps) {
  if (!plan) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Generated coaching plan preview will appear here.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Weekly Coaching Plan</h2>
        <textarea
          value={join(plan.weekly_plan)}
          onChange={(event) => onChange({ ...plan, weekly_plan: csv(event.target.value) })}
          rows={6}
          className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {DAYS.map((day) => (
          <div key={day} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="capitalize font-semibold text-slate-950">{day}</h3>
            <textarea
              value={join(plan.daily_micro_tasks[day])}
              onChange={(event) =>
                onChange({
                  ...plan,
                  daily_micro_tasks: { ...plan.daily_micro_tasks, [day]: csv(event.target.value) },
                })
              }
              rows={6}
              className="mt-3 w-full rounded-lg border border-slate-300 p-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Skill Improvement</h2>
          <Field label="Strengths" value={plan.skill_improvement.strengths} onChange={(value) => onChange({ ...plan, skill_improvement: { ...plan.skill_improvement, strengths: value } })} />
          <Field label="Weaknesses" value={plan.skill_improvement.weaknesses} onChange={(value) => onChange({ ...plan, skill_improvement: { ...plan.skill_improvement, weaknesses: value } })} />
          <Field label="Recommended Focus" value={plan.skill_improvement.recommended_focus} onChange={(value) => onChange({ ...plan, skill_improvement: { ...plan.skill_improvement, recommended_focus: value } })} />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Motivation</h2>
          <textarea
            value={plan.motivation.message}
            onChange={(event) => onChange({ ...plan, motivation: { ...plan.motivation, message: event.target.value } })}
            rows={5}
            className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
          <Field label="Affirmations" value={plan.motivation.affirmations} onChange={(value) => onChange({ ...plan, motivation: { ...plan.motivation, affirmations: value } })} />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Growth Insights</h2>
          {(["engagement", "mastery", "project_progress"] as const).map((key) => (
            <label key={key} className="mt-4 block">
              <span className="text-sm font-semibold capitalize text-slate-800">{key.replace("_", " ")}</span>
              <textarea
                value={plan.growth_insights[key]}
                onChange={(event) => onChange({ ...plan, growth_insights: { ...plan.growth_insights, [key]: event.target.value } })}
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </label>
          ))}
        </section>
      </div>

      <article className="rounded-lg bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Student Preview</p>
        <h2 className="mt-2 text-3xl font-bold">Week {plan.week_number} Coaching Plan</h2>
        <p className="mt-4 text-slate-300">{plan.motivation.message}</p>
      </article>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <textarea
        value={join(value)}
        onChange={(event) => onChange(csv(event.target.value))}
        rows={4}
        className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
      />
    </label>
  );
}
