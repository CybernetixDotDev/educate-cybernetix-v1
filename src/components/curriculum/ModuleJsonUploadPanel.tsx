"use client";

import { publishModuleJson } from "@/lib/curriculum/publishModuleJson";
import { validateModuleJson, type NormalizedModuleJson } from "@/lib/curriculum/validateModuleJson";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ModuleJsonUploadPanelProps = {
  courseId: string | null;
};

export function ModuleJsonUploadPanel({ courseId }: ModuleJsonUploadPanelProps) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [rawJson, setRawJson] = useState<unknown>(null);
  const [module, setModule] = useState<NormalizedModuleJson | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function validateText(text: string) {
    setRawText(text);
    setMessage(null);
    setRawJson(null);
    setModule(null);

    if (!text.trim()) {
      setErrors([]);
      return;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      const result = validateModuleJson(parsed);
      setRawJson(parsed);
      setModule(result.data);
      setErrors(result.errors);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Invalid JSON."]);
    }
  }

  async function readFile(file: File | null) {
    if (!file) return;
    validateText(await file.text());
  }

  function publish() {
    if (!rawJson || errors.length > 0 || !module) return;

    startTransition(async () => {
      const result = await publishModuleJson(courseId, rawJson);
      if (!result.ok) {
        setErrors([result.error ?? "Module publish failed."]);
        return;
      }

      setMessage(`Published ${result.lessons_published} lesson${result.lessons_published === 1 ? "" : "s"} for ${module.title}.`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Module Importer</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Upload full module JSON once</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Paste or upload the full Week JSON. The importer creates the module, lessons, lesson versions, quizzes, quiz versions, and mentor context.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="application/json,.json"
        onChange={(event) => void readFile(event.target.files?.[0] ?? null)}
        className="mt-5 block w-full rounded-lg border border-dashed border-slate-300 p-4 text-sm"
      />

      <textarea
        value={rawText}
        onChange={(event) => validateText(event.target.value)}
        placeholder="{ ...paste full module JSON here... }"
        className="mt-4 min-h-72 w-full rounded-lg border border-slate-300 bg-slate-50 p-4 font-mono text-xs text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
      />

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-bold">Validation errors</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}

      {module && errors.length === 0 && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Preview</p>
          <h3 className="mt-1 text-xl font-black text-emerald-950">{module.title}</h3>
          <p className="mt-2 text-sm leading-6 text-emerald-900">{module.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {module.lessons.map((lesson) => (
              <div key={lesson.lesson_key} className="rounded-lg bg-white/80 p-3">
                <p className="text-sm font-black text-slate-950">{lesson.order_index}. {lesson.lesson.title}</p>
                <p className="mt-1 text-xs text-slate-600">{lesson.lesson.content.length} blocks · {lesson.quiz.questions.length} quiz questions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!rawJson || errors.length > 0 || pending}
        onClick={publish}
        className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Publishing Module..." : "Publish Full Module"}
      </button>
    </section>
  );
}
