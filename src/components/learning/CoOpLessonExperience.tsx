"use client";

import { getCoOpProgress, submitFinalCoOp, submitTaskCheckpoint } from "@/lib/learning/coOpActions";
import type { CoOpFinalSubmission, CoOpSubmissionEvidence, CoOpTaskSubmission } from "@/lib/learning/coOpTypes";
import type { Lesson, LessonTask } from "@/lib/lessons/getLesson";
import { MENTOR_IDENTITY } from "@/lib/mentor/identity";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

type CoOpLessonExperienceProps = {
  lesson: Lesson;
  nextHref: string | null;
  nextLabel: string | null;
  initialTaskId?: string | null;
  taskPageBaseHref?: string;
};

type EvidenceDraft = CoOpSubmissionEvidence;

const EMPTY_EVIDENCE: EvidenceDraft = {
  screenshot_url: "",
  uploaded_file_url: "",
  link: "",
  text_explanation: "",
};

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function statusTone(status?: string) {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "needs_revision") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

function taskStepLabel(task: LessonTask) {
  const formats = task.checkpoint_types?.length ? task.checkpoint_types : [task.checkpoint_type];
  return `Submit proof using: ${formats.join(", ")}.`;
}

function taskFormats(task: LessonTask) {
  return task.checkpoint_types?.length ? task.checkpoint_types : [task.checkpoint_type];
}

function zyloTaskLine(task: LessonTask) {
  const title = task.title.toLowerCase();
  if (title.includes("diagram") || task.action.toLowerCase().includes("diagram")) return "Let's draw the journey map together.";
  if (title.includes("code") || task.action.toLowerCase().includes("code")) return "Let's make the code do one clear thing.";
  if (title.includes("style") || title.includes("css")) return "Let's make it look clean and intentional.";
  if (title.includes("explain") || task.checkpoint_type === "text") return "Tell me the idea in your own words.";
  if (task.checkpoint_type === "screenshot") return "Show me your best screenshot when it works.";
  if (task.checkpoint_type === "link") return "Send me the link so I can check the result.";
  return "Let's finish this mission one small move at a time.";
}

function ZyloMissionCard({ task }: { task: LessonTask }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teal-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MENTOR_IDENTITY.poses.pointing} alt="Zylo" className="h-full w-full object-contain p-1" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">Zylo mission</p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-800">{zyloTaskLine(task)}</p>
        </div>
      </div>
    </div>
  );
}

function ZyloVerificationCard({ submission }: { submission: CoOpTaskSubmission }) {
  const passed = submission.status === "pass";
  const feedback = submission.verification_json?.feedback ?? submission.verification_json?.reason;
  const nextStep = submission.verification_json?.next_step;
  const hint = submission.verification_json?.hint;

  return (
    <div className={`mt-4 rounded-2xl border p-4 text-sm ${statusTone(submission.status)}`}>
      <div className="flex gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-white/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={passed ? MENTOR_IDENTITY.poses.celebrating : MENTOR_IDENTITY.poses.thinking}
            alt={passed ? "Zylo celebrating" : "Zylo thinking"}
            className="h-full w-full object-contain p-1"
          />
        </div>
        <div>
          <p className="font-black">
            {passed ? "You did it! That's a solid checkpoint." : "This is close. Let's fix one small thing together."}
          </p>
          {feedback && <p className="mt-2">{feedback}</p>}
          {nextStep && <p className="mt-2">{nextStep}</p>}
          {hint && <p className="mt-2 text-xs opacity-80">Hint: {hint}</p>}
        </div>
      </div>
    </div>
  );
}

function TaskVideo({ url, title }: { url?: string; title: string }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        Short task video will appear here when the render is connected.
      </div>
    );
  }

  const embedUrl = youtubeEmbedUrl(url);

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full rounded-2xl border border-slate-200"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video src={url} controls className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-950" />
  );
}

export function CoOpLessonExperience({ lesson, nextHref, nextLabel, initialTaskId, taskPageBaseHref }: CoOpLessonExperienceProps) {
  const supabase = useMemo(() => createClient(), []);
  const [taskSubmissions, setTaskSubmissions] = useState<CoOpTaskSubmission[]>([]);
  const [finalSubmission, setFinalSubmission] = useState<CoOpFinalSubmission | null>(null);
  const [evidence, setEvidence] = useState<Record<string, EvidenceDraft>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [finalEvidence, setFinalEvidence] = useState<EvidenceDraft>(EMPTY_EVIDENCE);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [microSurvey, setMicroSurvey] = useState<Record<string, string>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialTaskId ?? lesson.tasks[0]?.task_id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    void getCoOpProgress(lesson.moduleId, lesson.lessonId).then((result) => {
      if (!active) return;
      if (result.ok && result.data) {
        setTaskSubmissions(result.data.taskSubmissions);
        setFinalSubmission(result.data.finalSubmission);
      } else {
        setError(result.error);
      }
    });

    return () => {
      active = false;
    };
  }, [lesson.lessonId, lesson.moduleId]);

  const submissionsByTask = useMemo(() => {
    return new Map(taskSubmissions.map((submission) => [submission.task_id, submission]));
  }, [taskSubmissions]);
  const passedCount = lesson.tasks.filter((task) => submissionsByTask.get(task.task_id)?.status === "pass").length;
  const totalTasks = lesson.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((passedCount / totalTasks) * 100) : 0;
  const allTasksPassed = totalTasks > 0 && passedCount === totalTasks;
  const finalPassed = finalSubmission?.status === "pass";
  const activeIndex = Math.max(0, lesson.tasks.findIndex((task) => task.task_id === activeTaskId));
  const activeTask = lesson.tasks[activeIndex] ?? lesson.tasks[0];
  const activeSubmission = activeTask ? submissionsByTask.get(activeTask.task_id) : undefined;
  const activeTaskEvidence = activeTask ? evidence[activeTask.task_id] ?? EMPTY_EVIDENCE : EMPTY_EVIDENCE;
  const nextStep = finalPassed
    ? "Unlocked: your next lesson is ready."
    : allTasksPassed
      ? "Final review: submit your project and reflection."
      : `Task ${activeIndex + 1}: ${lesson.tasks[activeIndex]?.title ?? "Start the first checkpoint"}`;

  function updateEvidence(taskId: string, patch: Partial<EvidenceDraft>) {
    setEvidence((current) => ({
      ...current,
      [taskId]: {
        ...EMPTY_EVIDENCE,
        ...(current[taskId] ?? {}),
        ...patch,
      },
    }));
  }

  async function uploadFile(file: File, taskId: string) {
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) throw new Error("Sign in is required before uploading files.");

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "upload";
    const path = `${userResult.user.id}/${lesson.moduleId}/${lesson.lessonId}/${taskId}-${Date.now()}.${sanitizeFileName(extension ?? "upload")}`;
    const { data, error: uploadError } = await supabase.storage.from("lesson-submissions").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) throw new Error(uploadError.message);
    return data.path;
  }

  function handleTaskSubmit(task: LessonTask) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const uploadedPath = files[task.task_id] ? await uploadFile(files[task.task_id] as File, task.task_id) : undefined;
        const draft = {
          ...EMPTY_EVIDENCE,
          ...(evidence[task.task_id] ?? {}),
          uploaded_file_url: uploadedPath ?? evidence[task.task_id]?.uploaded_file_url ?? "",
        };
        const result = await submitTaskCheckpoint({
          moduleKey: lesson.moduleId,
          lessonKey: lesson.lessonId,
          lessonTitle: lesson.title,
          task,
          evidence: draft,
        });

        if (!result.ok || !result.data) {
          setError(result.error);
          return;
        }

        setTaskSubmissions((current) => {
          const withoutCurrent = current.filter((item) => item.task_id !== task.task_id);
          return [...withoutCurrent, result.data as CoOpTaskSubmission];
        });
        setMessage(result.data.status === "pass" ? "Zylo says: You did it! That's a solid checkpoint." : "Zylo says: This is close. Let's fix one small thing together.");

        const nextTask = lesson.tasks.find((item) => !submissionsByTask.has(item.task_id) && item.task_id !== task.task_id);
        if (result.data.status === "pass" && nextTask && !taskPageBaseHref) setActiveTaskId(nextTask.task_id);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to submit checkpoint.");
      }
    });
  }

  function handleFinalSubmit() {
    const finalSubmissionConfig = lesson.finalSubmission;
    if (!finalSubmissionConfig) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const uploadedPath = finalFile ? await uploadFile(finalFile, "final-project") : undefined;
        const result = await submitFinalCoOp({
          moduleKey: lesson.moduleId,
          lessonKey: lesson.lessonId,
          lessonTitle: lesson.title,
          tasks: lesson.tasks,
          finalSubmission: finalSubmissionConfig,
          projectSubmission: {
            ...finalEvidence,
            uploaded_file_url: uploadedPath ?? finalEvidence.uploaded_file_url ?? "",
          },
          microSurvey,
        });

        if (!result.ok || !result.data) {
          setError(result.error);
          return;
        }

        setFinalSubmission(result.data);
        setMessage(result.data.status === "pass" ? "Zylo says: You did it! Your next step is unlocked." : "Zylo says: This is close. Let's fix one small thing together.");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to submit final review.");
      }
    });
  }

  if (lesson.tasks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">You are here - Guided build</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-950">Build it one small step at a time</h2>
            <p className="mt-2 text-base leading-7 text-slate-600">{nextStep}</p>
            {lesson.objectives.length > 0 && (
              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-teal-800">By the end, you will be able to</p>
                <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-teal-950">
                  {lesson.objectives.map((objective, index) => (
                    <li key={`${objective}-${index}`}>- {objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="min-w-48 rounded-2xl bg-[#f7faf9] p-4">
            <p className="text-sm font-bold text-slate-600">{passedCount} of {totalTasks} checkpoints passed</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            {passedCount > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MENTOR_IDENTITY.poses.celebrating} alt="Zylo cheering" className="h-full w-full object-contain p-1" />
                </div>
                <p className="text-sm font-black leading-5 text-emerald-900">
                  {allTasksPassed ? "You cleared every checkpoint. Final review time!" : "Nice checkpoint. Zylo is cheering you on!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold ${error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          {error ?? message}
        </div>
      )}

      {activeTask && (
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-teal-700">Current task</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Task {activeIndex + 1} of {totalTasks}
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200 sm:w-72">
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${((activeIndex + 1) / totalTasks) * 100}%` }} />
              </div>
            </div>
          </div>

          <article className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-teal-700">Task {activeIndex + 1}</p>
                <h3 className="mt-1 text-3xl font-black text-slate-950">{activeTask.title}</h3>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{activeTask.instruction}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusTone(activeSubmission?.status)}`}>
                {activeSubmission?.status === "pass" ? "Passed" : activeSubmission?.status === "needs_revision" ? "Revise" : "To do"}
              </span>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="space-y-4">
                <ZyloMissionCard task={activeTask} />
                <TaskVideo url={activeTask.video_url} title={activeTask.title} />
                <div className="rounded-2xl bg-[#f7faf9] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Action</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{activeTask.action}</p>
                </div>
                {activeTask.ai_verification_criteria.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Zylo checks for</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {activeTask.ai_verification_criteria.map((criterion) => (
                        <li key={criterion}>- {criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-950">Checkpoint submission</p>
                <p className="mt-1 text-sm text-slate-500">{taskStepLabel(activeTask)}</p>
                <div className="mt-4 space-y-3">
                  {(taskFormats(activeTask).includes("screenshot") || taskFormats(activeTask).includes("file")) && (
                    <input
                      type="file"
                      accept={taskFormats(activeTask).includes("screenshot") && !taskFormats(activeTask).includes("file") ? "image/*" : undefined}
                      onChange={(event) => setFiles((current) => ({ ...current, [activeTask.task_id]: event.target.files?.[0] ?? null }))}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  )}
                  {taskFormats(activeTask).includes("screenshot") && (
                    <input
                      value={activeTaskEvidence.screenshot_url ?? ""}
                      onChange={(event) => updateEvidence(activeTask.task_id, { screenshot_url: event.target.value })}
                      placeholder="Optional screenshot URL"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  )}
                  {(taskFormats(activeTask).includes("link") || taskFormats(activeTask).includes("file")) && (
                    <input
                      value={activeTaskEvidence.link ?? ""}
                      onChange={(event) => updateEvidence(activeTask.task_id, { link: event.target.value })}
                      placeholder={taskFormats(activeTask).includes("file") ? "Optional file/project link" : "Paste your link"}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  )}
                  {taskFormats(activeTask).includes("text") && (
                    <textarea
                      value={activeTaskEvidence.text_explanation ?? ""}
                      onChange={(event) => updateEvidence(activeTask.task_id, { text_explanation: event.target.value })}
                      placeholder="Tell Zylo what you made or changed."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleTaskSubmit(activeTask)}
                    disabled={isPending}
                    className="w-full rounded-full bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPending ? "Checking..." : "Verify Checkpoint"}
                  </button>
                </div>

                {activeSubmission?.verification_json && <ZyloVerificationCard submission={activeSubmission} />}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {taskPageBaseHref && activeIndex > 0 ? (
                <Link
                  href={`${taskPageBaseHref}/${lesson.tasks[activeIndex - 1]?.task_id}`}
                  className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-800"
                >
                  Previous Task
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTaskId(lesson.tasks[Math.max(0, activeIndex - 1)]?.task_id ?? activeTask.task_id)}
                  disabled={activeIndex === 0}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous Task
                </button>
              )}
              {taskPageBaseHref && activeIndex < totalTasks - 1 ? (
                activeSubmission?.status === "pass" ? (
                  <Link
                    href={`${taskPageBaseHref}/${lesson.tasks[activeIndex + 1]?.task_id}`}
                    className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Next Task
                  </Link>
                ) : (
                  <span className="rounded-full bg-slate-300 px-5 py-3 text-center text-sm font-black text-white">
                    Pass checkpoint to continue
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTaskId(lesson.tasks[Math.min(totalTasks - 1, activeIndex + 1)]?.task_id ?? activeTask.task_id)}
                  disabled={activeIndex >= totalTasks - 1 || activeSubmission?.status !== "pass"}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {activeIndex >= totalTasks - 1 ? "Final Task" : activeSubmission?.status === "pass" ? "Next Task" : "Pass checkpoint to continue"}
                </button>
              )}
            </div>
          </article>
        </section>
      )}

      {lesson.finalSubmission && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Final submission</p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">Ask Zylo for your final review</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{lesson.finalSubmission.final_project_upload.prompt}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(finalSubmission?.status)}`}>
              {finalPassed ? "Complete" : finalSubmission?.status === "needs_revision" ? "Revision needed" : "Locked until tasks pass"}
            </span>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <input
                type="file"
                onChange={(event) => setFinalFile(event.target.files?.[0] ?? null)}
                disabled={!allTasksPassed}
                className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
              />
              <input
                value={finalEvidence.link ?? ""}
                onChange={(event) => setFinalEvidence((current) => ({ ...current, link: event.target.value }))}
                placeholder="Paste final project link"
                disabled={!allTasksPassed}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 disabled:bg-slate-100"
              />
              <textarea
                value={finalEvidence.text_explanation ?? ""}
                onChange={(event) => setFinalEvidence((current) => ({ ...current, text_explanation: event.target.value }))}
                placeholder="What did you finish? What should Zylo notice?"
                rows={4}
                disabled={!allTasksPassed}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 disabled:bg-slate-100"
              />
            </div>

            <div className="space-y-3">
              {lesson.finalSubmission.micro_survey.map((question) => (
                <label key={question.question_id} className="block">
                  <span className="text-sm font-bold text-slate-700">{question.question}</span>
                  {question.type === "yes_no" ? (
                    <select
                      value={microSurvey[question.question_id] ?? ""}
                      onChange={(event) => setMicroSurvey((current) => ({ ...current, [question.question_id]: event.target.value }))}
                      disabled={!allTasksPassed}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                    >
                      <option value="">Choose one</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <textarea
                      value={microSurvey[question.question_id] ?? ""}
                      onChange={(event) => setMicroSurvey((current) => ({ ...current, [question.question_id]: event.target.value }))}
                      rows={3}
                      disabled={!allTasksPassed}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!allTasksPassed || isPending}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? "Reviewing..." : "Submit Final Review"}
            </button>
            {finalPassed && nextHref ? (
              <Link href={nextHref} className="rounded-full bg-teal-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-teal-700">
                {nextLabel ?? "Go to Next Lesson"}
              </Link>
            ) : (
              <span className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-bold text-slate-500">
                Next lesson unlocks after final review
              </span>
            )}
          </div>

          {finalSubmission?.mentor_review_json && (
            <div className={`mt-5 rounded-2xl border p-4 text-sm ${statusTone(finalSubmission.status)}`}>
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-white/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finalSubmission.status === "pass" ? MENTOR_IDENTITY.poses.celebrating : MENTOR_IDENTITY.poses.thinking}
                    alt="Zylo final review"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div>
                  <p className="font-black">Zylo final review</p>
                  <p className="mt-2">{finalSubmission.mentor_review_json.feedback}</p>
                  {finalSubmission.mentor_review_json.next_step && <p className="mt-2">{finalSubmission.mentor_review_json.next_step}</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
