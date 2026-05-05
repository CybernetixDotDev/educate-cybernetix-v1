"use client";

import { CodeInputPanel } from "@/components/debugger/CodeInputPanel";
import { DebuggingActions } from "@/components/debugger/DebuggingActions";
import { DebuggingOutputPanel } from "@/components/debugger/DebuggingOutputPanel";
import { useMentor } from "@/hooks/useMentor";
import { useStudent } from "@/hooks/useStudent";
import { analyzeError, type DebugAnalysis, type DebuggerInput } from "@/lib/ai/analyzeError";
import { generateFix, type DebugFix } from "@/lib/ai/generateFix";
import { generatePatchDiff } from "@/lib/ai/generatePatchDiff";
import { buildDebugSession, saveDebugSession } from "@/lib/ai/saveDebugSession";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function createInput(
  studentId: string,
  projectId: string | null,
  moduleId: string,
  code: string,
  errorMessage: string,
): DebuggerInput {
  return {
    student_id: studentId,
    project_id: projectId,
    module_id: moduleId.trim() || null,
    code,
    error_message: errorMessage,
  };
}

export function DebuggerClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") ?? searchParams.get("projectId");
  const initialModuleId = searchParams.get("module_id") ?? searchParams.get("moduleId") ?? "";
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { sendMessage } = useMentor();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [moduleId, setModuleId] = useState(initialModuleId);
  const [analysis, setAnalysis] = useState<DebugAnalysis | null>(null);
  const [fix, setFix] = useState<DebugFix | null>(null);
  const [correctedCode, setCorrectedCode] = useState("");
  const [patchDiff, setPatchDiff] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRun = Boolean(student?.id && code.trim() && errorMessage.trim());
  const loading = Boolean(loadingAction) || studentLoading;

  const debugInput = student?.id ? createInput(student.id, projectId, moduleId, code, errorMessage) : null;

  async function run(action: string, callback: () => Promise<void>) {
    setLoadingAction(action);
    setError(null);
    setStatus(null);

    try {
      await callback();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Debugging action failed");
    } finally {
      setLoadingAction(null);
    }
  }

  async function persistSession(nextAnalysis: DebugAnalysis, nextFix: DebugFix, nextPatchDiff: string) {
    if (!debugInput) return;
    const session = await buildDebugSession(debugInput, nextAnalysis, nextFix, nextPatchDiff);
    const result = await saveDebugSession(session);
    if (!result.ok) throw new Error(result.error ?? "Unable to save debug session");
  }

  async function handleAnalyze() {
    if (!debugInput) {
      setError("Sign in and provide code plus an error message.");
      return;
    }

    await run("analyze", async () => {
      const result = await analyzeError(debugInput);
      if (!result.ok || !result.analysis) throw new Error(result.error ?? "Unable to analyze error");
      setAnalysis(result.analysis);
      setStatus("Error analyzed. Generate a fix when you are ready.");
    });
  }

  async function handleGenerateFix() {
    if (!debugInput) {
      setError("Sign in and provide code plus an error message.");
      return;
    }

    await run("fix", async () => {
      let nextAnalysis = analysis;

      if (!nextAnalysis) {
        const analysisResult = await analyzeError(debugInput);
        if (!analysisResult.ok || !analysisResult.analysis) throw new Error(analysisResult.error ?? "Unable to analyze error");
        nextAnalysis = analysisResult.analysis;
        setAnalysis(nextAnalysis);
      }

      const fixResult = await generateFix(debugInput, nextAnalysis);
      if (!fixResult.ok || !fixResult.fix) throw new Error(fixResult.error ?? "Unable to generate fix");

      const diffResult = await generatePatchDiff(debugInput.code, fixResult.fix.corrected_code);
      if (!diffResult.ok || !diffResult.patch_diff) throw new Error(diffResult.error ?? "Unable to generate patch diff");

      setFix(fixResult.fix);
      setCorrectedCode(fixResult.fix.corrected_code);
      setPatchDiff(diffResult.patch_diff);
      await persistSession(nextAnalysis, fixResult.fix, diffResult.patch_diff);
      setStatus("Fix generated and debug session saved.");
    });
  }

  async function handleExplainRootCause() {
    await handleAnalyze();
  }

  async function handleShowPatchDiff() {
    if (!debugInput || !correctedCode.trim()) {
      setError("Generate or edit corrected code before creating a patch diff.");
      return;
    }

    await run("diff", async () => {
      const result = await generatePatchDiff(debugInput.code, correctedCode);
      if (!result.ok || !result.patch_diff) throw new Error(result.error ?? "Unable to generate patch diff");
      setPatchDiff(result.patch_diff);

      if (analysis && fix) {
        await persistSession(analysis, { ...fix, corrected_code: correctedCode }, result.patch_diff);
      }

      setStatus("Patch diff generated.");
    });
  }

  async function handleSendToMentor() {
    if (!debugInput || !analysis) {
      setError("Analyze the error before sending it to the mentor.");
      return;
    }

    await run("mentor", async () => {
      const result = await sendMessage({
        student_id: debugInput.student_id,
        project_id: debugInput.project_id,
        module_id: debugInput.module_id ?? "debugger",
        mode: "builder",
        student_message: [
          "Help me debug this issue.",
          `Root cause analysis: ${analysis.root_cause}`,
          `Error category: ${analysis.error_category}`,
          `Error message: ${debugInput.error_message}`,
        ].join("\n\n"),
        code_snippet: debugInput.code,
      });

      if (!result) throw new Error("Unable to send debugging context to mentor");
      setStatus("Debugging context sent to Builder Mentor.");
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
              {student ? `${student.display_name}'s debugging lab` : "Debugging lab"}
            </p>
          </div>
          <Link
            href={projectId ? `/project-mentor?project_id=${projectId}` : "/project-mentor"}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm"
          >
            Project Mentor
          </Link>
        </header>

        {(studentError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{studentError ?? error}</div>
        )}
        {status && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{status}</div>}

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <CodeInputPanel
              code={code}
              errorMessage={errorMessage}
              moduleId={moduleId}
              loading={loading}
              onCodeChange={setCode}
              onErrorMessageChange={setErrorMessage}
              onModuleIdChange={setModuleId}
              onAnalyze={handleAnalyze}
            />
            <DebuggingOutputPanel
              analysis={analysis}
              fix={fix}
              patchDiff={patchDiff}
              correctedCode={correctedCode}
              onCorrectedCodeChange={setCorrectedCode}
            />
          </div>
          <DebuggingActions
            loading={loading}
            hasAnalysis={Boolean(analysis)}
            hasFix={Boolean(fix)}
            hasPatchDiff={Boolean(patchDiff)}
            canRun={canRun}
            onAnalyze={handleAnalyze}
            onGenerateFix={handleGenerateFix}
            onExplainRootCause={handleExplainRootCause}
            onShowPatchDiff={handleShowPatchDiff}
            onSendToMentor={handleSendToMentor}
          />
        </div>
      </div>
    </main>
  );
}
