"use client";

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
};

export type { PublishStatus };

export function PublishStatusPanel({ publishStatus }: PublishStatusPanelProps) {
  if (!publishStatus) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Student Publish Status</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Not published yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          After you click Publish to Student Lessons, this block will confirm the current student lesson version, quiz version,
          and live lesson URL.
        </p>
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
            This lesson was published to the student lesson system at {publishStatus.publishedAt}. Version history should now
            show lesson version {publishStatus.lessonVersionNumber} for {publishStatus.moduleKey}/{publishStatus.lessonKey}.
          </p>
        </div>
        <a
          href={publishStatus.lessonUrl}
          className="rounded-full bg-emerald-700 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Open Published Lesson
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatusFact label="Route" value={publishStatus.lessonUrl} />
        <StatusFact label="Target" value={`${publishStatus.moduleKey}/${publishStatus.lessonKey}`} />
        <StatusFact label="Lesson Version" value={`v${publishStatus.lessonVersionNumber}`} />
        <StatusFact label="Quiz Version" value={`v${publishStatus.quizVersionNumber}`} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatusFact label="Lesson Version ID" value={publishStatus.lessonVersionId} mono />
        <StatusFact label="Quiz Version ID" value={publishStatus.quizVersionId} mono />
        <StatusFact label="Lesson Current Version" value={publishStatus.lessonCurrentVersionId} mono />
        <StatusFact label="Lesson Updated At" value={publishStatus.lessonUpdatedAt ?? "Unknown"} />
      </div>
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
