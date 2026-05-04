"use client";

import { SummaryActions } from "@/components/weekly-summary/SummaryActions";
import { SummaryGenerationForm, type SummaryStudentOption } from "@/components/weekly-summary/SummaryGenerationForm";
import { SummaryPreview } from "@/components/weekly-summary/SummaryPreview";
import { generateParentSummary } from "@/lib/ai/generateParentSummary";
import { generateStudentReflection } from "@/lib/ai/generateStudentReflection";
import { generateWeeklySummary, type WeeklySummaryInput, type WeeklySummaryJSON } from "@/lib/ai/generateWeeklySummary";
import { saveWeeklySummary } from "@/lib/ai/saveWeeklySummary";
import { useState } from "react";

type WeeklySummaryClientProps = {
  students: SummaryStudentOption[];
};

const DEFAULT_INPUT: WeeklySummaryInput = {
  student_id: "",
  week_number: 1,
};

export function WeeklySummaryClient({ students }: WeeklySummaryClientProps) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [summary, setSummary] = useState<WeeklySummaryJSON | null>(null);
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

  async function run(task: () => Promise<{ ok: boolean; summary: WeeklySummaryJSON | null; error: string | null }>, success: string) {
    if (!validateInput()) return null;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await task();
      if (!result.ok || !result.summary) {
        setError(result.error ?? "Generation failed");
        return null;
      }
      setStatus(success);
      return result.summary;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const next = await run(() => generateWeeklySummary(input), "Weekly summary generated");
    if (next) setSummary(next);
  }

  async function handleRegenerateParent() {
    if (!summary) return;
    const next = await run(() => generateParentSummary(input), "Parent summary regenerated");
    if (next) setSummary({ ...summary, parent_summary: next.parent_summary });
  }

  async function handleRegenerateStudent() {
    if (!summary) return;
    const next = await run(() => generateStudentReflection(input), "Student reflection regenerated");
    if (next) setSummary({ ...summary, student_reflection: next.student_reflection });
  }

  async function handleSave() {
    if (!summary) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await saveWeeklySummary(summary);
      if (!result.ok) {
        setError(result.error ?? "Unable to save summary");
        return;
      }
      setStatus("Weekly summary saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SummaryGenerationForm students={students} value={input} onChange={setInput} />
      <SummaryActions
        hasSummary={Boolean(summary)}
        loading={loading}
        onGenerate={() => void handleGenerate()}
        onRegenerateParent={() => void handleRegenerateParent()}
        onRegenerateStudent={() => void handleRegenerateStudent()}
        onSave={() => void handleSave()}
      />
      {loading && <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">Generating...</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}
      <SummaryPreview summary={summary} onChange={setSummary} />
    </div>
  );
}
