"use client";

import { publishReviewedLesson, saveReviewEdits, setLessonReviewStatus } from "@/lib/lesson-studio/reviewPublish";
import type { LessonGeneratorOutput, LessonRender, LessonReviewStatus, LessonStoryboard, PublishTarget } from "@/lib/lesson-studio/types";
import { useMemo, useState } from "react";

type ReviewPublishPanelProps = {
  lesson: LessonGeneratorOutput | null;
  storyboard: LessonStoryboard | null;
  render: LessonRender | null;
  onLessonChange: (lesson: LessonGeneratorOutput) => void;
  onStoryboardChange: (storyboard: LessonStoryboard | null) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function ReviewPublishPanel({
  lesson,
  storyboard,
  render,
  onLessonChange,
  onStoryboardChange,
  onStatus,
  onError,
}: ReviewPublishPanelProps) {
  const [lessonText, setLessonText] = useState(() => JSON.stringify(lesson, null, 2));
  const [storyboardText, setStoryboardText] = useState(() => JSON.stringify(storyboard, null, 2));
  const [quizText, setQuizText] = useState(() => JSON.stringify(lesson?.quiz ?? { questions: [] }, null, 2));
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<PublishTarget>({
    module_key: "ai-generated-lessons",
    module_title: "AI Generated Lessons",
    module_description: "Lessons generated and reviewed in the AI Lesson Studio.",
    lesson_key: lesson ? slug(lesson.build_task.title ?? lesson.hook) : "",
    lesson_order_index: 1,
  });

  const canReview = Boolean(lesson);
  const parsedLesson = useMemo(() => {
    if (!lesson) return null;
    try {
      const parsed = JSON.parse(lessonText) as LessonGeneratorOutput;
      return { ...parsed, quiz: JSON.parse(quizText) as LessonGeneratorOutput["quiz"] };
    } catch {
      return null;
    }
  }, [lesson, lessonText, quizText]);

  function syncEditors() {
    setLessonText(JSON.stringify(lesson, null, 2));
    setStoryboardText(JSON.stringify(storyboard, null, 2));
    setQuizText(JSON.stringify(lesson?.quiz ?? { questions: [] }, null, 2));
  }

  async function saveEdits() {
    if (!parsedLesson) {
      onError("Lesson or quiz JSON is invalid.");
      return;
    }

    let parsedStoryboard: LessonStoryboard | null = null;
    try {
      parsedStoryboard = storyboardText.trim() === "null" || !storyboardText.trim() ? null : JSON.parse(storyboardText) as LessonStoryboard;
    } catch {
      onError("Storyboard JSON is invalid.");
      return;
    }

    setBusy(true);
    try {
      const result = await saveReviewEdits(parsedLesson, parsedStoryboard);
      if (!result.ok || !result.data) {
        onError(result.error ?? "Could not save review edits.");
        return;
      }
      onLessonChange(result.data.lesson);
      onStoryboardChange(result.data.storyboard);
      onStatus("Review edits saved.");
    } finally {
      setBusy(false);
    }
  }

  async function transition(status: LessonReviewStatus, note: string) {
    if (!lesson) return;
    setBusy(true);
    try {
      const result = await setLessonReviewStatus(lesson, storyboard, status, note);
      if (!result.ok) {
        onError(result.error ?? "Could not update review status.");
        return;
      }
      onStatus(`Status updated to ${status}.`);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!parsedLesson) {
      onError("Lesson or quiz JSON is invalid.");
      return;
    }
    setBusy(true);
    try {
      const result = await publishReviewedLesson(parsedLesson, storyboard, target, render);
      if (!result.ok || !result.data) {
        onError(result.error ?? "Could not publish lesson.");
        return;
      }
      onLessonChange(parsedLesson);
      onStatus(`Published to ${result.data.lesson_url}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Review + Publish</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Approve and ship the lesson</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Edit the generated lesson, quiz, and storyboard before moving it through review and publishing it to the student lesson system.
          </p>
        </div>
        <button type="button" onClick={syncEditors} disabled={!canReview || busy} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
          Sync editors
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Editor label="Lesson JSON" value={lessonText} onChange={setLessonText} disabled={!canReview || busy} />
        <Editor label="Quiz JSON" value={quizText} onChange={setQuizText} disabled={!canReview || busy} />
        <Editor label="Storyboard JSON" value={storyboardText} onChange={setStoryboardText} disabled={!canReview || busy} />
      </div>

      <div className="grid gap-4 rounded-3xl bg-[#f7faf9] p-5 lg:grid-cols-2">
        {render?.mp4_url && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 lg:col-span-2">
            This publish will attach the rendered MP4 to the student lesson.
          </div>
        )}
        <Input label="Module key" value={target.module_key} onChange={(module_key) => setTarget({ ...target, module_key })} />
        <Input label="Lesson key" value={target.lesson_key} onChange={(lesson_key) => setTarget({ ...target, lesson_key })} />
        <Input label="Module title" value={target.module_title} onChange={(module_title) => setTarget({ ...target, module_title })} />
        <label className="text-sm font-medium text-slate-700">
          Lesson order
          <input
            type="number"
            min={1}
            value={target.lesson_order_index}
            onChange={(event) => setTarget({ ...target, lesson_order_index: Number(event.target.value) })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Module description
          <textarea
            value={target.module_description}
            onChange={(event) => setTarget({ ...target, module_description: event.target.value })}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveEdits} disabled={!canReview || busy} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50">
          Save Edits
        </button>
        <button type="button" onClick={() => void transition("in_review", "Submitted for review")} disabled={!canReview || busy} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50">
          Send to Review
        </button>
        <button type="button" onClick={() => void transition("approved", "Approved by admin")} disabled={!canReview || busy} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          Approve
        </button>
        <button type="button" onClick={() => void transition("generated", "Rejected for revision")} disabled={!canReview || busy} className="rounded-full bg-rose-100 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50">
          Reject
        </button>
        <button type="button" onClick={() => void transition("archived", "Archived by admin")} disabled={!canReview || busy} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          Archive
        </button>
        <button type="button" onClick={() => void publish()} disabled={!canReview || busy} className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
          Publish to Student Lessons
        </button>
      </div>
    </section>
  );
}

function Editor({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 min-h-80 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none focus:border-teal-500 disabled:opacity-50"
      />
    </label>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500" />
    </label>
  );
}
