"use client";

import { CodeReviewActions } from "@/components/code-review/CodeReviewActions";
import { CodeReviewInput } from "@/components/code-review/CodeReviewInput";
import { CodeReviewOutput } from "@/components/code-review/CodeReviewOutput";
import { useMentor } from "@/hooks/useMentor";
import { useStudent } from "@/hooks/useStudent";
import { generateCodeFixes, type CodeReviewFix } from "@/lib/ai/generateCodeFixes";
import { generateCodePatch } from "@/lib/ai/generateCodePatch";
import { reviewCode, type CodeReview, type CodeReviewInput as ReviewInput } from "@/lib/ai/reviewCode";
import { buildCodeReviewSession, saveCodeReview } from "@/lib/ai/saveCodeReview";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function createInput(studentId: string, projectId: string | null, moduleId: string, code: string): ReviewInput {
  return {
    student_id: studentId,
    project_id: projectId,
    module_id: moduleId.trim() || null,
    code,
  };
}

export function CodeReviewClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") ?? searchParams.get("projectId");
  const initialModuleId = searchParams.get("module_id") ?? searchParams.get("moduleId") ?? "";
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { sendMessage } = useMentor();
  const [code, setCode] = useState("");
  const [moduleId, setModuleId] = useState(initialModuleId);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [fix, setFix] = useState<CodeReviewFix | null>(null);
  const [improvedCode, setImprovedCode] = useState("");
  const [patchDiff, setPatchDiff] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRun = Boolean(student?.id && code.trim());
  const loading = Boolean(loadingAction) || studentLoading;
  const reviewInput = student?.id ? createInput(student.id, projectId, moduleId, code) : null;

  async function run(action: string, callback: () => Promise<void>) {
    setLoadingAction(action);
    setError(null);
    setStatus(null);

    try {
      await callback();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Code review action failed");
    } finally {
      setLoadingAction(null);
    }
  }

  async function persistSession(nextReview: CodeReview, nextFix: CodeReviewFix, nextPatchDiff: string) {
    if (!reviewInput) return;
    const session = await buildCodeReviewSession(reviewInput, nextReview, nextFix, nextPatchDiff);
    const result = await saveCodeReview(session);
    if (!result.ok) throw new Error(result.error ?? "Unable to save code review");
  }

  async function handleReview() {
    if (!reviewInput) {
      setError("Sign in and provide code to review.");
      return;
    }

    await run("review", async () => {
      const result = await reviewCode(reviewInput);
      if (!result.ok || !result.review) throw new Error(result.error ?? "Unable to review code");
      setReview(result.review);
      setImprovedCode(result.review.corrected_code);
      setStatus("Code review generated. Review the comments, then generate fixes.");
    });
  }

  async function handleGenerateFixes() {
    if (!reviewInput) {
      setError("Sign in and provide code to review.");
      return;
    }

    await run("fixes", async () => {
      let nextReview = review;

      if (!nextReview) {
        const reviewResult = await reviewCode(reviewInput);
        if (!reviewResult.ok || !reviewResult.review) throw new Error(reviewResult.error ?? "Unable to review code");
        nextReview = reviewResult.review;
        setReview(nextReview);
      }

      const fixResult = await generateCodeFixes(reviewInput, nextReview);
      if (!fixResult.ok || !fixResult.fix) throw new Error(fixResult.error ?? "Unable to generate fixes");

      const diffResult = await generateCodePatch(reviewInput.code, fixResult.fix.corrected_code);
      if (!diffResult.ok || !diffResult.patch_diff) throw new Error(diffResult.error ?? "Unable to generate patch diff");

      setFix(fixResult.fix);
      setImprovedCode(fixResult.fix.corrected_code);
      setPatchDiff(diffResult.patch_diff);
      await persistSession(nextReview, fixResult.fix, diffResult.patch_diff);
      setStatus("Fixes generated and code review saved.");
    });
  }

  async function handleShowPatchDiff() {
    if (!reviewInput || !improvedCode.trim()) {
      setError("Generate or edit improved code before creating a patch diff.");
      return;
    }

    await run("diff", async () => {
      const result = await generateCodePatch(reviewInput.code, improvedCode);
      if (!result.ok || !result.patch_diff) throw new Error(result.error ?? "Unable to generate patch diff");
      setPatchDiff(result.patch_diff);

      if (review && fix) {
        await persistSession(review, { ...fix, corrected_code: improvedCode }, result.patch_diff);
      }

      setStatus("Patch diff generated.");
    });
  }

  async function handleSendToMentor() {
    if (!reviewInput || !review) {
      setError("Run a code review before sending it to the mentor.");
      return;
    }

    await run("mentor", async () => {
      const result = await sendMessage({
        student_id: reviewInput.student_id,
        project_id: reviewInput.project_id,
        module_id: reviewInput.module_id ?? "code-review",
        mode: "builder",
        student_message: [
          "Help me improve this code review result.",
          `Best practices: ${review.best_practices.join("; ") || "none"}`,
          `Performance: ${review.performance.join("; ") || "none"}`,
          `Security: ${review.security.join("; ") || "none"}`,
          `Accessibility: ${review.accessibility.join("; ") || "none"}`,
        ].join("\n\n"),
        code_snippet: reviewInput.code,
      });

      if (!result) throw new Error("Unable to send code review context to mentor");
      setStatus("Code review context sent to Builder Mentor.");
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-violet-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-cyan-700 hover:text-cyan-900">
              Dashboard
            </Link>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-violet-700">
              {student ? `${student.display_name}'s code review lab` : "Code review lab"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={projectId ? `/debugger?project_id=${projectId}` : "/debugger"} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm">
              Debugger
            </Link>
            <Link href={projectId ? `/project-mentor?project_id=${projectId}` : "/project-mentor"} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm">
              Project Mentor
            </Link>
          </div>
        </header>

        {(studentError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{studentError ?? error}</div>
        )}
        {status && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{status}</div>}

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <CodeReviewInput
              code={code}
              moduleId={moduleId}
              loading={loading}
              onCodeChange={setCode}
              onModuleIdChange={setModuleId}
              onReview={handleReview}
            />
            <CodeReviewOutput
              review={review}
              fix={fix}
              improvedCode={improvedCode}
              patchDiff={patchDiff}
              onImprovedCodeChange={setImprovedCode}
            />
          </div>
          <CodeReviewActions
            loading={loading}
            canRun={canRun}
            hasReview={Boolean(review)}
            hasFix={Boolean(fix)}
            hasPatchDiff={Boolean(patchDiff)}
            onReview={handleReview}
            onGenerateFixes={handleGenerateFixes}
            onShowPatchDiff={handleShowPatchDiff}
            onSendToMentor={handleSendToMentor}
          />
        </div>
      </div>
    </main>
  );
}
