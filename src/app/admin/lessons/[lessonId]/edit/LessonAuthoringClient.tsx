"use client";

import { LessonEditor } from "@/components/lesson-editor/LessonEditor";
import { LessonPreview } from "@/components/lesson-editor/LessonPreview";
import { MetadataEditor } from "@/components/lesson-editor/MetadataEditor";
import { QuizEditor } from "@/components/lesson-editor/QuizEditor";
import { saveLesson, type LessonAuthoringSchema } from "@/lib/lessons/saveLesson";
import Link from "next/link";
import { useCallback, useState } from "react";

type LessonAuthoringClientProps = {
  initialLesson: LessonAuthoringSchema;
  moduleTitle: string;
  exists: boolean;
};

type Tab = "content" | "quiz" | "metadata" | "preview";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "content", label: "Content" },
  { key: "quiz", label: "Quiz" },
  { key: "metadata", label: "Metadata" },
  { key: "preview", label: "Preview" },
];

export function LessonAuthoringClient({ initialLesson, moduleTitle, exists }: LessonAuthoringClientProps) {
  const [lesson, setLesson] = useState(initialLesson);
  const [tab, setTab] = useState<Tab>("content");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(exists ? "Loaded existing lesson" : "New lesson draft");
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(
    async (publish = false) => {
      setSaving(true);
      setError(null);

      try {
        const result = await saveLesson(lesson, { publish });

        if (!result.ok || !result.lesson) {
          setError(result.error ?? "Unable to save lesson");
          return;
        }

        setLesson(result.lesson);
        setStatus(publish ? "Published" : "Saved draft");
      } finally {
        setSaving(false);
      }
    },
    [lesson],
  );

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Link href={`/admin/modules/${lesson.metadata.module_id}`} className="text-sm font-semibold text-cyan-700">
            Back to {moduleTitle}
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Lesson Authoring</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">{lesson.title || "Untitled lesson"}</h1>
              <p className="mt-1 font-mono text-sm text-slate-500">
                {lesson.metadata.module_id} / {lesson.metadata.lesson_id}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => void handleSave(true)}
                disabled={saving}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Publish
              </button>
            </div>
          </div>
          {(status || error) && (
            <p className={`mt-3 text-sm ${error ? "text-rose-600" : "text-emerald-700"}`}>{error ?? status}</p>
          )}
        </header>

        <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                tab === item.key ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {tab === "content" && <LessonEditor lesson={lesson} onChange={setLesson} onAutoSave={() => handleSave(false)} />}
          {tab === "quiz" && <QuizEditor lesson={lesson} onChange={setLesson} />}
          {tab === "metadata" && <MetadataEditor lesson={lesson} onChange={setLesson} />}
          {tab === "preview" && <LessonPreview lesson={lesson} />}
        </section>
      </div>
    </main>
  );
}
