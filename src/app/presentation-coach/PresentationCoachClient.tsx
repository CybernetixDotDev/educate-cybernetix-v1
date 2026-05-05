"use client";

import { DeliveryCoachPanel } from "@/components/presentation-coach/DeliveryCoachPanel";
import { PresentationActions } from "@/components/presentation-coach/PresentationActions";
import { PresentationOverview } from "@/components/presentation-coach/PresentationOverview";
import { QAPrepPanel } from "@/components/presentation-coach/QAPrepPanel";
import { ScriptPanel } from "@/components/presentation-coach/ScriptPanel";
import { SlideOutline } from "@/components/presentation-coach/SlideOutline";
import { useProjectProgress } from "@/hooks/useProjectProgress";
import { useStudent } from "@/hooks/useStudent";
import { generateDemoWalkthrough } from "@/lib/ai/generateDemoWalkthrough";
import { generatePresentation, type PresentationInput, type PresentationPlan } from "@/lib/ai/generatePresentation";
import { generatePresentationScript } from "@/lib/ai/generatePresentationScript";
import { generateQAPrep } from "@/lib/ai/generateQAPrep";
import { generateSlideOutline } from "@/lib/ai/generateSlideOutline";
import { savePresentationPlan } from "@/lib/ai/savePresentationPlan";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function emptyPlan(input: PresentationInput): PresentationPlan {
  return {
    student_id: input.student_id,
    project_id: input.project_id,
    slide_outline: [],
    script: [],
    demo_walkthrough: [],
    storytelling: { hook: "", problem: "", solution: "", impact: "" },
    delivery_coaching: { confidence: [], voice: [], pacing: [], body_language: [], timing: [] },
    qa_prep: { questions: [], answers: [], fallback_strategies: [] },
  };
}

export function PresentationCoachClient() {
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project_id") ?? searchParams.get("projectId");
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { project, loading: projectLoading, error: projectError } = useProjectProgress({
    studentId: student?.id ?? null,
    projectId: selectedProjectId,
  });
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = student?.id && project?.id ? { student_id: student.id, project_id: project.id } : null;
  const loading = studentLoading || projectLoading || Boolean(loadingAction);

  async function run(action: string, callback: () => Promise<void>) {
    setLoadingAction(action);
    setError(null);
    setStatus(null);

    try {
      await callback();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Presentation action failed");
    } finally {
      setLoadingAction(null);
    }
  }

  function mergePartial(next: PresentationPlan, section: "outline" | "script" | "demo" | "qa") {
    setPlan((current) => {
      const base = current ?? (input ? emptyPlan(input) : next);
      if (section === "outline") return { ...base, slide_outline: next.slide_outline };
      if (section === "script") return { ...base, script: next.script, storytelling: next.storytelling };
      if (section === "demo") return { ...base, demo_walkthrough: next.demo_walkthrough };
      return { ...base, qa_prep: next.qa_prep };
    });
  }

  async function handleGenerate() {
    if (!input) {
      setError("Sign in and select a project before generating a presentation.");
      return;
    }

    await run("generate", async () => {
      const result = await generatePresentation(input);
      if (!result.ok || !result.plan) throw new Error(result.error ?? "Unable to generate presentation");
      setPlan(result.plan);
      setStatus("Presentation generated. Review and edit before saving.");
    });
  }

  async function handleSection(section: "outline" | "script" | "demo" | "qa") {
    if (!input) {
      setError("Sign in and select a project before regenerating sections.");
      return;
    }

    await run(section, async () => {
      const result =
        section === "outline"
          ? await generateSlideOutline(input)
          : section === "script"
            ? await generatePresentationScript(input)
            : section === "demo"
              ? await generateDemoWalkthrough(input)
              : await generateQAPrep(input);

      if (!result.ok || !result.plan) throw new Error(result.error ?? `Unable to regenerate ${section}`);
      mergePartial(result.plan, section);
      setStatus(`${section} regenerated.`);
    });
  }

  async function handleSave() {
    if (!plan) return;

    await run("save", async () => {
      const result = await savePresentationPlan(plan);
      if (!result.ok) throw new Error(result.error ?? "Unable to save presentation");
      setStatus("Presentation plan saved.");
    });
  }

  const currentPlan = plan ?? (input ? emptyPlan(input) : null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-violet-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-cyan-700 hover:text-cyan-900">
              Dashboard
            </Link>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-violet-700">
              {student ? `${student.display_name}'s presentation coach` : "Presentation coach"}
            </p>
          </div>
          <Link
            href={project?.id ? `/project-mentor?project_id=${project.id}` : "/project-mentor"}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm"
          >
            Project Mentor
          </Link>
        </header>

        {(studentError || projectError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {studentError ?? projectError ?? error}
          </div>
        )}
        {status && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{status}</div>}

        <PresentationOverview project={project} loading={studentLoading || projectLoading} />

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {currentPlan && (
              <>
                <SlideOutline
                  slides={currentPlan.slide_outline}
                  onChange={(slide_outline) => setPlan({ ...currentPlan, slide_outline })}
                />
                <ScriptPanel
                  script={currentPlan.script}
                  demo={currentPlan.demo_walkthrough}
                  storytelling={currentPlan.storytelling}
                  onScriptChange={(script) => setPlan({ ...currentPlan, script })}
                  onDemoChange={(demo_walkthrough) => setPlan({ ...currentPlan, demo_walkthrough })}
                  onStorytellingChange={(storytelling) => setPlan({ ...currentPlan, storytelling })}
                />
                <DeliveryCoachPanel
                  coaching={currentPlan.delivery_coaching}
                  onChange={(delivery_coaching) => setPlan({ ...currentPlan, delivery_coaching })}
                />
                <QAPrepPanel
                  qa={currentPlan.qa_prep}
                  onChange={(qa_prep) => setPlan({ ...currentPlan, qa_prep })}
                />
              </>
            )}
            {!currentPlan && (
              <section className="rounded-2xl border border-dashed border-cyan-300 bg-white/90 p-8 text-center shadow-sm">
                <p className="text-sm font-black text-cyan-900">No project available yet</p>
                <p className="mt-2 text-sm text-slate-600">Create or select a project before generating a presentation.</p>
              </section>
            )}
          </div>
          <PresentationActions
            loading={loading}
            disabled={!input}
            hasPlan={Boolean(plan)}
            onGenerate={handleGenerate}
            onRegenerateOutline={() => handleSection("outline")}
            onRegenerateScript={() => handleSection("script")}
            onRegenerateDemo={() => handleSection("demo")}
            onRegenerateQA={() => handleSection("qa")}
            onSave={handleSave}
          />
        </div>
      </div>
    </main>
  );
}
