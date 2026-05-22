"use client";

import { publishReviewedLesson, saveReviewEdits, setLessonReviewStatus } from "@/lib/lesson-studio/reviewPublish";
import type { LessonBrief, LessonGeneratorOutput, LessonRender, LessonReviewStatus, LessonStoryboard, PublishTarget } from "@/lib/lesson-studio/types";
import { useMemo, useState } from "react";

type ReviewPublishPanelProps = {
  lesson: LessonGeneratorOutput | null;
  storyboard: LessonStoryboard | null;
  render: LessonRender | null;
  brief: LessonBrief;
  onLessonChange: (lesson: LessonGeneratorOutput) => void;
  onStoryboardChange: (storyboard: LessonStoryboard | null) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
};

type ActionConfirmation = {
  status: LessonReviewStatus | "saved";
  title: string;
  message: string;
  timestamp: string;
  lessonUrl?: string;
  lessonVersion?: number;
  quizVersion?: number;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function inferTechFoundationsTarget(lesson: LessonGeneratorOutput | null, brief: LessonBrief): PublishTarget {
  const lessonTitle = brief.lesson_title || lesson?.build_task.title || lesson?.hook || "";
  const normalizedTitle = lessonTitle.toLowerCase();
  const week1Matches = [
    { test: ["internet", "dns", "http", "request", "response"], lesson_key: "w1d1", lesson_title: "How the Internet Works", order: 1 },
    { test: ["html"], lesson_key: "w1d2", lesson_title: "HTML Structure", order: 2 },
    { test: ["css basics", "css"], lesson_key: "w1d3", lesson_title: "CSS Basics", order: 3 },
    { test: ["box model", "layout"], lesson_key: "w1d4", lesson_title: "Box Model & Layout", order: 4 },
    { test: ["responsive", "media quer"], lesson_key: "w1d5", lesson_title: "Responsive Design", order: 5 },
  ];
  const week1Match = week1Matches.find((item) => item.test.some((term) => normalizedTitle.includes(term)));

  if (week1Match) {
    return {
      course_key: "12-week-tech-foundations-accelerator",
      module_key: "week1-internet-html-css",
      module_title: "The Internet, HTML & CSS",
      module_description: "Learn how the web works and build your first webpage.",
      lesson_key: week1Match.lesson_key,
      lesson_title: week1Match.lesson_title,
      lesson_order_index: week1Match.order,
    };
  }

  const fallbackLessonKey = lessonTitle ? slug(lessonTitle) : "";

  return {
    course_key: "12-week-tech-foundations-accelerator",
    module_key: "ai-generated-lessons",
    module_title: "AI Generated Lessons",
    module_description: "Lessons generated and reviewed in the AI Lesson Studio.",
    lesson_key: fallbackLessonKey,
    lesson_title: lessonTitle,
    lesson_order_index: 1,
  };
}

export function ReviewPublishPanel({
  lesson,
  storyboard,
  render,
  brief,
  onLessonChange,
  onStoryboardChange,
  onStatus,
  onError,
}: ReviewPublishPanelProps) {
  const [lessonText, setLessonText] = useState(() => JSON.stringify(lesson, null, 2));
  const [storyboardText, setStoryboardText] = useState(() => JSON.stringify(storyboard, null, 2));
  const [quizText, setQuizText] = useState(() => JSON.stringify(lesson?.quiz ?? { questions: [] }, null, 2));
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<PublishTarget>(() => inferTechFoundationsTarget(lesson, brief));
  const [reviewStatus, setReviewStatus] = useState<LessonReviewStatus>("draft");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ActionConfirmation | null>(null);

  const canReview = Boolean(lesson);
  const renderHasSplitVideos = Boolean(
    render?.status === "completed" &&
      render.render_json?.intro_video_url &&
      render.render_json?.scene_video_urls?.some((scene) => scene.kind === "task" && scene.url),
  );
  const renderWarning = render && !renderHasSplitVideos
    ? "This render is not ready to publish. It must include a separate intro video and separate task videos."
    : null;
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
      setReviewStatus("in_review");
      setConfirmation({
        status: "saved",
        title: "Review edits saved",
        message: "Your edited lesson, quiz, and storyboard were saved and moved into review.",
        timestamp: new Date().toLocaleTimeString(),
      });
      onStatus("Review edits saved and sent for review.");
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
      setReviewStatus(status);
      const titleByStatus: Record<LessonReviewStatus, string> = {
        draft: "Moved back to draft",
        generated: "Sent back for revision",
        in_review: "Sent for review",
        approved: "Approved",
        published: "Published",
        archived: "Archived",
      };
      const messageByStatus: Record<LessonReviewStatus, string> = {
        draft: "This lesson is now marked as a draft.",
        generated: "This lesson has been sent back for revision before publishing.",
        in_review: "This lesson has been sent for review. You can approve it when it is ready.",
        approved: "This lesson is approved and ready to publish to student lessons.",
        published: "This lesson is marked as published.",
        archived: "This lesson has been archived.",
      };
      setConfirmation({
        status,
        title: titleByStatus[status],
        message: messageByStatus[status],
        timestamp: new Date().toLocaleTimeString(),
      });
      onStatus(`${titleByStatus[status]}.`);
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
      setReviewStatus("published");
      setPublishedUrl(result.data.lesson_url);
      setConfirmation({
        status: "published",
        title: "Published to student lessons",
        message: `Students can now open this lesson at ${result.data.lesson_url}. Lesson version ${result.data.lesson_version_number} and quiz version ${result.data.quiz_version_number} were created.`,
        timestamp: new Date().toLocaleTimeString(),
        lessonUrl: result.data.lesson_url,
        lessonVersion: result.data.lesson_version_number,
        quizVersion: result.data.quiz_version_number,
      });
      onStatus(`Published to student lessons: ${result.data.lesson_url}`);
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

      <div className="grid gap-3 rounded-3xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950 sm:grid-cols-3">
        <div>
          <p className="font-bold">Review status</p>
          <p className="mt-1 capitalize">{reviewStatus.replace("_", " ")}</p>
        </div>
        <div>
          <p className="font-bold">Publish destination</p>
          <p className="mt-1">
            /learn/{target.module_key || "module-key"}/{target.lesson_key || "lesson-key"}
          </p>
        </div>
        <div>
          <p className="font-bold">Student visibility</p>
          <p className="mt-1">{target.course_key ? `Attached to ${target.course_key}` : "Course key required"}</p>
        </div>
        {publishedUrl && (
          <a href={publishedUrl} className="font-bold text-teal-800 underline sm:col-span-3">
            Open published student lesson
          </a>
        )}
      </div>

      {confirmation && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Action confirmed</p>
              <h3 className="mt-1 text-xl font-black">{confirmation.title}</h3>
              <p className="mt-2 text-sm leading-6">{confirmation.message}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">Completed at {confirmation.timestamp}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-emerald-800 shadow-sm">
              {String(confirmation.status).replace("_", " ")}
            </span>
          </div>
          {confirmation.lessonUrl && (
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={confirmation.lessonUrl} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800">
                Open Published Lesson
              </a>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-800">
                Lesson v{confirmation.lessonVersion} · Quiz v{confirmation.quizVersion}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
        <StatusStep label="1. Review" active={reviewStatus === "in_review"} complete={["in_review", "approved", "published"].includes(reviewStatus)} />
        <StatusStep label="2. Approve" active={reviewStatus === "approved"} complete={["approved", "published"].includes(reviewStatus)} />
        <StatusStep label="3. Publish" active={reviewStatus === "published"} complete={reviewStatus === "published"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Editor label="Lesson JSON" value={lessonText} onChange={setLessonText} disabled={!canReview || busy} />
        <Editor label="Quiz JSON" value={quizText} onChange={setQuizText} disabled={!canReview || busy} />
        <Editor label="Storyboard JSON" value={storyboardText} onChange={setStoryboardText} disabled={!canReview || busy} />
      </div>

      <div className="grid gap-4 rounded-3xl bg-[#f7faf9] p-5 lg:grid-cols-2">
        {render?.mp4_url && (
          <div className={`rounded-2xl border p-4 text-sm font-semibold lg:col-span-2 ${renderWarning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {renderWarning ?? "This publish will attach the separate intro, lesson walkthrough, and task MP4s to the student lesson."}
          </div>
        )}
        <Input label="Course key" value={target.course_key ?? ""} onChange={(course_key) => setTarget({ ...target, course_key })} />
        <Input label="Module key" value={target.module_key} onChange={(module_key) => setTarget({ ...target, module_key })} />
        <Input label="Lesson key" value={target.lesson_key} onChange={(lesson_key) => setTarget({ ...target, lesson_key })} />
        <Input label="Lesson title" value={target.lesson_title ?? ""} onChange={(lesson_title) => setTarget({ ...target, lesson_title })} />
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
          {busy ? "Working..." : "Save Edits"}
        </button>
        <button type="button" onClick={() => void transition("in_review", "Submitted for review")} disabled={!canReview || busy} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50">
          {busy ? "Sending..." : "Send to Review"}
        </button>
        <button type="button" onClick={() => void transition("approved", "Approved by admin")} disabled={!canReview || busy} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Approving..." : "Approve"}
        </button>
        <button type="button" onClick={() => void transition("generated", "Rejected for revision")} disabled={!canReview || busy} className="rounded-full bg-rose-100 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50">
          Reject
        </button>
        <button type="button" onClick={() => void transition("archived", "Archived by admin")} disabled={!canReview || busy} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          Archive
        </button>
        <button type="button" onClick={() => void publish()} disabled={!canReview || busy || Boolean(renderWarning)} className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
          {busy ? "Publishing..." : "Publish to Student Lessons"}
        </button>
      </div>
    </section>
  );
}

function StatusStep({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : active ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
      <p className="font-black">{label}</p>
      <p className="mt-1 text-xs font-semibold">{complete ? "Done" : active ? "Current" : "Waiting"}</p>
    </div>
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
