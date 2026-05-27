"use client";

import { getPublishedLessonStatus } from "@/lib/lesson-studio/reviewPublish";
import type { PublishTarget } from "@/lib/lesson-studio/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PublishStatus = {
  lessonUrl: string;
  lessonVersionNumber: number;
  quizVersionNumber: number;
  lessonVersionId: string;
  quizVersionId: string;
  moduleId: string;
  lessonId: string;
  lessonCurrentVersionId: string;
  lessonUpdatedAt: string | null;
  quizCurrentVersionId: string;
  quizUpdatedAt: string | null;
  publishedAt: string;
  moduleKey: string;
  lessonKey: string;
};

type PublishStatusPanelProps = {
  publishStatus: PublishStatus | null;
  target: PublishTarget | null;
  onStatusLoaded?: (status: PublishStatus | null) => void;
};

export type { PublishStatus };

function toPublishStatus(result: NonNullable<Awaited<ReturnType<typeof getPublishedLessonStatus>>["data"]>): PublishStatus {
  return {
    lessonUrl: result.lesson_url,
    lessonVersionNumber: result.lesson_version_number,
    quizVersionNumber: result.quiz_version_number,
    lessonVersionId: result.lesson_version_id,
    quizVersionId: result.quiz_version_id,
    moduleId: result.module_id,
    lessonId: result.lesson_id,
    lessonCurrentVersionId: result.lesson_current_version_id,
    lessonUpdatedAt: result.lesson_updated_at,
    quizCurrentVersionId: result.quiz_current_version_id,
    quizUpdatedAt: result.quiz_updated_at,
    moduleKey: result.module_key,
    lessonKey: result.lesson_key,
    publishedAt: result.lesson_updated_at ? new Date(result.lesson_updated_at).toLocaleString() : "Unknown",
  };
}

export function PublishStatusPanel({ publishStatus, target, onStatusLoaded }: PublishStatusPanelProps) {
  const [fetchedStatus, setFetchedStatus] = useState<PublishStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentStatus = publishStatus ?? fetchedStatus;
  const lastFetchedTarget = useRef<string | null>(null);
  const targetKey = useMemo(() => {
    if (!target?.module_key || !target.lesson_key) return "";
    return `${target.module_key}/${target.lesson_key}`;
  }, [target?.lesson_key, target?.module_key]);

  const refresh = useCallback(async () => {
    if (!target?.module_key || !target.lesson_key) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getPublishedLessonStatus(target);
      if (!result.ok) {
        setError(result.error ?? "Could not load publish status.");
        return;
      }

      const nextStatus = result.data ? toPublishStatus(result.data) : null;
      setFetchedStatus(nextStatus);
      onStatusLoaded?.(nextStatus);
    } finally {
      setLoading(false);
    }
  }, [onStatusLoaded, target]);

  useEffect(() => {
    if (!targetKey || lastFetchedTarget.current === targetKey) return;
    lastFetchedTarget.current = targetKey;

    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refresh, targetKey]);

  if (!currentStatus) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Student Publish Status</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Not published yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {target?.module_key && target.lesson_key
            ? `No current student version was found for ${target.module_key}/${target.lesson_key}.`
            : "After you click Publish to Student Lessons, this block will confirm the current student lesson version, quiz version, and live lesson URL."}
        </p>
        {error && <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-rose-700">{error}</p>}
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || !target?.module_key || !target.lesson_key}
          className="mt-5 rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh Publish Status"}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Student Publish Status</p>
          <h2 className="mt-2 text-3xl font-black text-emerald-950">Published</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">
            This lesson was published to the student lesson system at {currentStatus.publishedAt}. Version history should now
            show lesson version {currentStatus.lessonVersionNumber} for {currentStatus.moduleKey}/{currentStatus.lessonKey}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <a
            href={currentStatus.lessonUrl}
            className="rounded-full bg-emerald-700 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-800"
          >
            Open Published Lesson
          </a>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking..." : "Refresh Status"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatusFact label="Route" value={currentStatus.lessonUrl} />
        <StatusFact label="Target" value={`${currentStatus.moduleKey}/${currentStatus.lessonKey}`} />
        <StatusFact label="Lesson Version" value={`v${currentStatus.lessonVersionNumber}`} />
        <StatusFact label="Quiz Version" value={`v${currentStatus.quizVersionNumber}`} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatusFact label="Lesson Version ID" value={currentStatus.lessonVersionId} mono />
        <StatusFact label="Quiz Version ID" value={currentStatus.quizVersionId || "No quiz version"} mono />
        <StatusFact label="Lesson Current Version" value={currentStatus.lessonCurrentVersionId} mono />
        <StatusFact label="Lesson Updated At" value={currentStatus.lessonUpdatedAt ?? "Unknown"} />
      </div>
      {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
    </section>
  );
}

function StatusFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{label}</p>
      <p className={`mt-2 break-words text-sm font-bold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
