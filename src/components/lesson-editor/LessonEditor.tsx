"use client";

import { createClient } from "@/utils/supabase/client";
import type { LessonAuthoringSchema } from "@/lib/lessons/saveLesson";
import { ChangeEvent, useEffect, useState } from "react";

type LessonEditorProps = {
  lesson: LessonAuthoringSchema;
  onChange: (lesson: LessonAuthoringSchema) => void;
  onAutoSave?: () => Promise<void> | void;
};

export function LessonEditor({ lesson, onChange, onAutoSave }: LessonEditorProps) {
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!onAutoSave) {
      return;
    }

    const timer = window.setInterval(() => {
      void onAutoSave();
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [onAutoSave]);

  function update(patch: Partial<LessonAuthoringSchema>) {
    onChange({ ...lesson, ...patch });
  }

  function updateCodeExample(index: number, patch: Partial<{ language: string; code: string }>) {
    const next = lesson.codeExamples.map((example, itemIndex) =>
      itemIndex === index ? { ...example, ...patch } : example,
    );
    update({ codeExamples: next });
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const path = `${lesson.metadata.module_id}/${lesson.metadata.lesson_id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("lesson-assets").upload(path, file, { upsert: true });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from("lesson-assets").getPublicUrl(path);
      update({ images: [...lesson.images, data.publicUrl] });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Lesson title</span>
        <input
          value={lesson.title}
          onChange={(event) => update({ title: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <input
          value={lesson.description ?? ""}
          onChange={(event) => update({ description: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Rich lesson body (Markdown)</span>
        <textarea
          value={lesson.body}
          onChange={(event) => update({ body: event.target.value })}
          rows={16}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          placeholder="Use markdown for headings, paragraphs, lists, and emphasis."
        />
      </label>

      <section className="rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-950">Code Blocks</h3>
          <button
            type="button"
            onClick={() => update({ codeExamples: [...lesson.codeExamples, { language: "tsx", code: "" }] })}
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
          >
            Add Code Block
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {lesson.codeExamples.map((example, index) => (
            <div key={`${example.language}-${index}`} className="rounded-lg bg-slate-950 p-3">
              <div className="flex gap-2">
                <input
                  value={example.language}
                  onChange={(event) => updateCodeExample(index, { language: event.target.value })}
                  className="w-32 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-cyan-100"
                  placeholder="language"
                />
                <button
                  type="button"
                  onClick={() => update({ codeExamples: lesson.codeExamples.filter((_, itemIndex) => itemIndex !== index) })}
                  className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={example.code}
                onChange={(event) => updateCodeExample(index, { code: event.target.value })}
                rows={8}
                className="mt-3 w-full rounded border border-slate-700 bg-slate-900 p-3 font-mono text-sm text-cyan-100"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-950">Images</h3>
        <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="mt-3 text-sm" />
        {uploading && <p className="mt-2 text-sm text-slate-500">Uploading image...</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {lesson.images.map((image) => (
            <div key={image} className="rounded-lg border border-slate-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="aspect-video w-full rounded object-cover" />
              <button
                type="button"
                onClick={() => update({ images: lesson.images.filter((item) => item !== image) })}
                className="mt-2 text-sm font-semibold text-rose-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
