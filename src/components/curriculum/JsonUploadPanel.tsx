"use client";

import { LessonPreview } from "@/components/curriculum/LessonPreview";
import { publishLessonVersion } from "@/lib/curriculum/publishLessonVersion";
import { publishQuizVersion } from "@/lib/curriculum/publishQuizVersion";
import {
  validateLessonJson,
  validateQuizJson,
  type CurriculumLessonJson,
  type CurriculumQuizJson,
} from "@/lib/curriculum/validateLessonJson";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type UploadMode = "lesson" | "quiz";

export function JsonUploadPanel({ lessonId }: { lessonId: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("lesson");
  const [errors, setErrors] = useState<string[]>([]);
  const [lesson, setLesson] = useState<CurriculumLessonJson | null>(null);
  const [quiz, setQuiz] = useState<CurriculumQuizJson | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function readFile(file: File | null) {
    setMessage(null);
    setErrors([]);
    setLesson(null);
    setQuiz(null);
    setRaw(null);
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = mode === "lesson" ? validateLessonJson(parsed) : validateQuizJson(parsed);
      setErrors(result.errors);
      setRaw(parsed);
      if (mode === "lesson") setLesson(result.data as CurriculumLessonJson | null);
      if (mode === "quiz") setQuiz(result.data as CurriculumQuizJson | null);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Invalid JSON file."]);
    }
  }

  function publish() {
    if (!lessonId || !raw || errors.length > 0) return;
    startTransition(async () => {
      const result = mode === "lesson" ? await publishLessonVersion(lessonId, raw) : await publishQuizVersion(lessonId, raw);
      if (!result.ok) {
        setErrors([result.error ?? "Publish failed."]);
        return;
      }
      setMessage(`Published ${mode} version ${result.version_number}.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">JSON Pipeline</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Upload, validate, preview, publish</h2>
        </div>
        <select value={mode} onChange={(event) => setMode(event.target.value as UploadMode)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="lesson">Lesson JSON</option>
          <option value="quiz">Quiz JSON</option>
        </select>
      </div>

      <input
        type="file"
        accept="application/json,.json"
        disabled={!lessonId}
        onChange={(event) => void readFile(event.target.files?.[0] ?? null)}
        className="mt-5 block w-full rounded-lg border border-dashed border-slate-300 p-4 text-sm disabled:bg-slate-100"
      />

      {!lessonId && <p className="mt-3 text-sm text-amber-700">Select or create a lesson before uploading JSON.</p>}
      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-bold">Validation errors</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}

      <div className="mt-5">
        <LessonPreview lesson={lesson} quiz={quiz} />
      </div>

      <button
        type="button"
        disabled={!lessonId || !raw || errors.length > 0 || pending}
        onClick={publish}
        className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Publishing..." : "Publish Version"}
      </button>
    </section>
  );
}

