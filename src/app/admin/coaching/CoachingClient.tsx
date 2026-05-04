"use client";

import { CoachingActions } from "@/components/coaching/CoachingActions";
import { CoachingForm, type CoachingStudentOption } from "@/components/coaching/CoachingForm";
import { CoachingPreview } from "@/components/coaching/CoachingPreview";
import { generateCoachingPlan, type CoachingInput, type CoachingPlanJSON } from "@/lib/ai/generateCoachingPlan";
import { generateMicroTasks } from "@/lib/ai/generateMicroTasks";
import { generateMotivation } from "@/lib/ai/generateMotivation";
import { generateSkillsPlan } from "@/lib/ai/generateSkillsPlan";
import { saveCoachingPlan } from "@/lib/ai/saveCoachingPlan";
import { useState } from "react";

type CoachingClientProps = { students: CoachingStudentOption[] };

const DEFAULT_INPUT: CoachingInput = { student_id: "", week_number: 1 };

export function CoachingClient({ students }: CoachingClientProps) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [plan, setPlan] = useState<CoachingPlanJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateInput() {
    if (!input.student_id || !Number.isFinite(input.week_number)) {
      setError("student_id and week_number are required");
      return false;
    }
    return true;
  }

  async function run(task: () => Promise<{ ok: boolean; plan: CoachingPlanJSON | null; error: string | null }>, success: string) {
    if (!validateInput()) return null;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await task();
      if (!result.ok || !result.plan) {
        setError(result.error ?? "Generation failed");
        return null;
      }
      setStatus(success);
      return result.plan;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const next = await run(() => generateCoachingPlan(input), "Coaching plan generated");
    if (next) setPlan(next);
  }

  async function handleSkills() {
    if (!plan) return;
    const next = await run(() => generateSkillsPlan(input), "Skills plan regenerated");
    if (next) setPlan({ ...plan, skill_improvement: next.skill_improvement, growth_insights: next.growth_insights });
  }

  async function handleMicroTasks() {
    if (!plan) return;
    const next = await run(() => generateMicroTasks(input), "Micro-tasks regenerated");
    if (next) setPlan({ ...plan, daily_micro_tasks: next.daily_micro_tasks, weekly_plan: next.weekly_plan });
  }

  async function handleMotivation() {
    if (!plan) return;
    const next = await run(() => generateMotivation(input), "Motivation regenerated");
    if (next) setPlan({ ...plan, motivation: next.motivation });
  }

  async function handleSave() {
    if (!plan) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await saveCoachingPlan(plan);
      if (!result.ok) {
        setError(result.error ?? "Unable to save coaching plan");
        return;
      }
      setStatus("Coaching plan saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <CoachingForm students={students} value={input} onChange={setInput} />
      <CoachingActions
        hasPlan={Boolean(plan)}
        loading={loading}
        onGenerate={() => void handleGenerate()}
        onRegenerateSkills={() => void handleSkills()}
        onRegenerateMicroTasks={() => void handleMicroTasks()}
        onRegenerateMotivation={() => void handleMotivation()}
        onSave={() => void handleSave()}
      />
      {loading && <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">Generating...</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}
      <CoachingPreview plan={plan} onChange={setPlan} />
    </div>
  );
}
