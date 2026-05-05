"use client";

import { LessonPreview } from "@/components/curriculum/LessonPreview";
import { setCurrentLessonVersion, setCurrentQuizVersion } from "@/lib/curriculum/manageCurriculum";
import type { CurriculumLessonJson, CurriculumQuizJson } from "@/lib/curriculum/validateLessonJson";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type CurriculumVersion = {
  id: string;
  version_number: number;
  content_json: unknown;
  created_at: string;
  created_by: string | null;
};

type VersionHistoryProps = {
  title: string;
  kind: "lesson" | "quiz";
  ownerId: string | null;
  versions: CurriculumVersion[];
  currentVersionId: string | null;
};

export function VersionHistory({ title, kind, ownerId, versions, currentVersionId }: VersionHistoryProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<CurriculumVersion | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section id="versions" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Version History</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>

      <div className="mt-5 space-y-3">
        {versions.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No versions published yet.</p>}
        {versions.map((version) => (
          <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="font-semibold text-slate-950">
                v{version.version_number} {version.id === currentVersionId ? <span className="text-emerald-700">(current)</span> : null}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(version.created_at).toLocaleString()} · {version.created_by ?? "unknown"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPreview(version)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Preview Version</button>
              <button
                type="button"
                disabled={!ownerId || pending || version.id === currentVersionId}
                onClick={() => startTransition(async () => {
                  if (!ownerId) return;
                  const result = kind === "lesson"
                    ? await setCurrentLessonVersion(ownerId, version.id)
                    : await setCurrentQuizVersion(ownerId, version.id);
                  if (result.ok) router.refresh();
                })}
                className="rounded-md border border-cyan-200 px-3 py-1.5 text-xs font-bold text-cyan-700 disabled:opacity-50"
              >
                Set as Current Version
              </button>
              <button
                type="button"
                disabled={!ownerId || pending || version.id === currentVersionId}
                onClick={() => startTransition(async () => {
                  if (!ownerId) return;
                  const result = kind === "lesson"
                    ? await setCurrentLessonVersion(ownerId, version.id)
                    : await setCurrentQuizVersion(ownerId, version.id);
                  if (result.ok) router.refresh();
                })}
                className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50"
              >
                Rollback
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="mt-5">
          <LessonPreview
            lesson={kind === "lesson" ? preview.content_json as CurriculumLessonJson : null}
            quiz={kind === "quiz" ? preview.content_json as CurriculumQuizJson : null}
          />
        </div>
      )}
    </section>
  );
}

