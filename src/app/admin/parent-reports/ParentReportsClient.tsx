"use client";

import { ReportActions } from "@/components/parent-reports/ReportActions";
import { ReportForm, type ParentReportStudentOption } from "@/components/parent-reports/ReportForm";
import { ReportPreview } from "@/components/parent-reports/ReportPreview";
import { generateEngagementSection } from "@/lib/ai/generateEngagementSection";
import { generateParentReport, type ParentReportInput, type ParentReportJSON } from "@/lib/ai/generateParentReport";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";
import { generateSkillGrowthSection } from "@/lib/ai/generateSkillGrowthSection";
import { saveParentReport } from "@/lib/ai/saveParentReport";
import { useState } from "react";

type ParentReportsClientProps = {
  students: ParentReportStudentOption[];
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const DEFAULT_INPUT: ParentReportInput = {
  student_id: "",
  month: currentMonth(),
};

export function ParentReportsClient({ students }: ParentReportsClientProps) {
  const [input, setInput] = useState<ParentReportInput>({
    ...DEFAULT_INPUT,
    student_id: students[0]?.id ?? "",
  });
  const [report, setReport] = useState<ParentReportJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateInput() {
    if (!input.student_id || !/^\d{4}-\d{2}$/.test(input.month)) {
      setError("student_id and month are required");
      return false;
    }
    return true;
  }

  async function run(
    task: () => Promise<{ ok: boolean; report: ParentReportJSON | null; error: string | null }>,
    success: string,
  ) {
    if (!validateInput()) return null;
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await task();
      if (!result.ok || !result.report) {
        setError(result.error ?? "Generation failed");
        return null;
      }
      setStatus(success);
      return result.report;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const next = await run(() => generateParentReport(input), "Parent report generated");
    if (next) setReport(next);
  }

  async function handleEngagement() {
    if (!report) return;
    const next = await run(() => generateEngagementSection(input), "Engagement regenerated");
    if (next) {
      setReport({
        ...report,
        engagement_summary: next.engagement_summary,
        attendance: next.attendance,
      });
    }
  }

  async function handleSkills() {
    if (!report) return;
    const next = await run(() => generateSkillGrowthSection(input), "Skill growth regenerated");
    if (next) {
      setReport({
        ...report,
        skill_growth: next.skill_growth,
        quiz_performance: next.quiz_performance,
      });
    }
  }

  async function handleRecommendations() {
    if (!report) return;
    const next = await run(() => generateRecommendations(input), "Recommendations regenerated");
    if (next) {
      setReport({
        ...report,
        recommendations: next.recommendations,
        next_steps: next.next_steps,
      });
    }
  }

  async function handleSave() {
    if (!report) return;
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await saveParentReport(report);
      if (!result.ok) {
        setError(result.error ?? "Unable to save report");
        return;
      }
      setStatus("Parent report saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ReportForm students={students} value={input} onChange={setInput} />
      <ReportActions
        loading={loading}
        hasReport={Boolean(report)}
        onGenerate={handleGenerate}
        onRegenerateEngagement={handleEngagement}
        onRegenerateSkills={handleSkills}
        onRegenerateRecommendations={handleRecommendations}
        onSave={handleSave}
      />
      {loading && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">Generating...</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}
      <ReportPreview report={report} onChange={setReport} />
    </div>
  );
}
