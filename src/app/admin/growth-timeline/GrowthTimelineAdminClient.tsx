"use client";

import { GrowthMoments } from "@/components/growth-timeline/GrowthMoments";
import { MilestoneList } from "@/components/growth-timeline/MilestoneList";
import { ProjectEvolution } from "@/components/growth-timeline/ProjectEvolution";
import { SkillProgressionChart } from "@/components/growth-timeline/SkillProgressionChart";
import { TimelineActions } from "@/components/growth-timeline/TimelineActions";
import { TimelineVisualization } from "@/components/growth-timeline/TimelineVisualization";
import { generateGrowthMoments } from "@/lib/ai/generateGrowthMoments";
import { generateGrowthTimeline, type GrowthTimelineInput, type GrowthTimelineJSON } from "@/lib/ai/generateGrowthTimeline";
import { generateMilestones } from "@/lib/ai/generateMilestones";
import { generateSkillProgression } from "@/lib/ai/generateSkillProgression";
import { saveGrowthTimeline } from "@/lib/ai/saveGrowthTimeline";
import { useState } from "react";

type StudentOption = { id: string; display_name: string; email: string | null };
type Props = { students: StudentOption[] };

export function GrowthTimelineAdminClient({ students }: Props) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [timeline, setTimeline] = useState<GrowthTimelineJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input: GrowthTimelineInput = { student_id: studentId };

  async function run(task: () => Promise<{ ok: boolean; timeline: GrowthTimelineJSON | null; error: string | null }>, success: string) {
    if (!studentId) {
      setError("Select a student first.");
      return null;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await task();
      if (!result.ok || !result.timeline) {
        setError(result.error ?? "Generation failed");
        return null;
      }
      setStatus(success);
      return result.timeline;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const next = await run(() => generateGrowthTimeline(input), "Growth timeline generated");
    if (next) setTimeline(next);
  }

  async function handleMilestones() {
    if (!timeline) return;
    const next = await run(() => generateMilestones(input), "Milestones regenerated");
    if (next) setTimeline({ ...timeline, milestones: next.milestones });
  }

  async function handleSkills() {
    if (!timeline) return;
    const next = await run(() => generateSkillProgression(input), "Skill progression regenerated");
    if (next) setTimeline({ ...timeline, skill_progression: next.skill_progression });
  }

  async function handleMoments() {
    if (!timeline) return;
    const next = await run(() => generateGrowthMoments(input), "Growth moments regenerated");
    if (next) setTimeline({ ...timeline, growth_moments: next.growth_moments });
  }

  async function handleSave() {
    if (!timeline) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await saveGrowthTimeline(timeline);
      if (!result.ok) {
        setError(result.error ?? "Unable to save timeline");
        return;
      }
      setStatus("Growth timeline saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Growth Timeline</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Student Growth Timeline Generator</h1>
          <label className="mt-5 block">
            <span className="text-sm font-bold text-slate-700">Student</span>
            <select value={studentId} onChange={(event) => { setStudentId(event.target.value); setTimeline(null); }} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.display_name}{student.email ? ` (${student.email})` : ""}</option>
              ))}
            </select>
          </label>
        </section>

        <TimelineActions
          loading={loading}
          hasTimeline={Boolean(timeline)}
          onGenerate={handleGenerate}
          onRegenerateMilestones={handleMilestones}
          onRegenerateSkillProgression={handleSkills}
          onRegenerateGrowthMoments={handleMoments}
          onSave={handleSave}
        />
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {status && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}

        <TimelineVisualization timeline={timeline} />
        {timeline && (
          <>
            <MilestoneList milestones={timeline.milestones} editable onChange={(milestones) => setTimeline({ ...timeline, milestones })} />
            <SkillProgressionChart skillProgression={timeline.skill_progression} editable onChange={(skill_progression) => setTimeline({ ...timeline, skill_progression })} />
            <ProjectEvolution projectEvolution={timeline.project_evolution} editable onChange={(project_evolution) => setTimeline({ ...timeline, project_evolution })} />
            <GrowthMoments moments={timeline.growth_moments} editable onChange={(growth_moments) => setTimeline({ ...timeline, growth_moments })} />
          </>
        )}
      </div>
    </main>
  );
}
