"use client";

import { StepDisplayName } from "@/components/onboarding/StepDisplayName";
import { StepGradeLevel } from "@/components/onboarding/StepGradeLevel";
import { StepLearningGoals } from "@/components/onboarding/StepLearningGoals";
import { StepParentEmail } from "@/components/onboarding/StepParentEmail";
import { StepProjectPreference } from "@/components/onboarding/StepProjectPreference";
import { saveOnboardingData } from "@/lib/onboarding/saveOnboardingData";
import type { OnboardingData } from "@/lib/onboarding/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type OnboardingClientProps = {
  initialData: OnboardingData;
};

const STEPS = [
  { title: "Your name", description: "Set up how your dashboard and mentor will greet you." },
  { title: "Grade level", description: "This helps us keep lessons pitched at the right level." },
  { title: "Learning goals", description: "Pick the skills you care about most right now." },
  { title: "Parent link", description: "Optional, but useful for parent progress updates." },
  { title: "Project path", description: "Choose a project direction to personalize builder guidance." },
];

export function OnboardingClient({ initialData }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function validateCurrentStep() {
    if (step === 0 && data.display_name.trim().length < 2) return "Add a display name with at least 2 characters.";
    if (step === 1 && !data.grade_level) return "Select your grade level.";
    if (step === 2 && data.learning_goals.length === 0) return "Choose at least one learning goal.";
    if (step === 3 && data.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parent_email)) {
      return "Enter a valid parent email or leave it blank.";
    }
    if (step === 4 && !data.project_preference) return "Select a project preference.";
    return null;
  }

  function next() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function finish() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const result = await saveOnboardingData(data);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess("Profile saved. Opening your dashboard...");
      router.replace(result.dashboard_path ?? "/dashboard");
      router.refresh();
    });
  }

  const current = STEPS[step];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <section className="space-y-6">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-300">Educate Cybernetix</p>
              <h1 className="mt-3 text-4xl font-black tracking-normal text-white sm:text-5xl">Build your learning profile.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Five quick choices help the mentor, dashboard, and projects feel like they were built for you.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="flex items-center justify-between text-sm font-bold text-slate-200">
                <span>Step {step + 1} of {STEPS.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/80 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <div className="min-h-[360px]">
              <p className="text-sm font-black uppercase tracking-wide text-cyan-600">{current.title}</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">{current.description}</h2>

              <div className="mt-8">
                {step === 0 && <StepDisplayName value={data.display_name} onChange={(value) => update("display_name", value)} />}
                {step === 1 && <StepGradeLevel value={data.grade_level} onChange={(value) => update("grade_level", value)} />}
                {step === 2 && (
                  <StepLearningGoals value={data.learning_goals} onChange={(value) => update("learning_goals", value)} />
                )}
                {step === 3 && <StepParentEmail value={data.parent_email} onChange={(value) => update("parent_email", value)} />}
                {step === 4 && (
                  <StepProjectPreference
                    value={data.project_preference}
                    onChange={(value) => update("project_preference", value)}
                  />
                )}
              </div>
            </div>

            {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
            {success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</div>}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))}
                disabled={step === 0 || isPending}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={isPending}
                  className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  disabled={isPending}
                  className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Finish"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

