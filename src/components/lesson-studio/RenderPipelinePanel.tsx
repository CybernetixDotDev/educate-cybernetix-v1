"use client";

import type { LessonRender } from "@/lib/lesson-studio/types";

type RenderPipelinePanelProps = {
  render: LessonRender | null;
  onRefresh?: () => void;
  refreshing?: boolean;
};

const labels: Record<LessonRender["status"], string> = {
  queued: "Queued",
  assets_ready: "Assets ready",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export function RenderPipelinePanel({ render, onRefresh, refreshing = false }: RenderPipelinePanelProps) {
  if (!render) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">MP4 Render</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">No render assets yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Generate a storyboard, then prepare captions, transcript, thumbnail, manifest, and MP4 render handoff.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">MP4 Render Pipeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{labels[render.status]}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Render ID: <span className="font-mono">{render.render_id}</span>
          </p>
          {render.status === "queued" && (
            <p className="mt-2 text-sm text-slate-600">
              A background worker will pick this job up automatically.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            render.status === "failed"
              ? "bg-rose-50 text-rose-700"
              : render.status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-teal-50 text-teal-900"
          }`}>
            {labels[render.status]}
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>
          )}
        </div>
      </div>

      {render.error_message && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {render.error_message}
        </div>
      )}

      {render.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={render.thumbnail_url} alt="Lesson thumbnail" className="aspect-video w-full rounded-3xl border border-slate-200 object-cover" />
      )}

      {render.mp4_url && (
        <video
          src={render.mp4_url}
          controls
          poster={render.thumbnail_url ?? undefined}
          className="aspect-video w-full rounded-3xl border border-slate-200 bg-slate-950"
        />
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <AssetLink label="Manifest" url={render.manifest_url} />
        <AssetLink label="Captions VTT" url={render.captions_vtt_url} />
        <AssetLink label="Captions SRT" url={render.captions_srt_url} />
        <AssetLink label="Transcript" url={render.transcript_url} />
        <AssetLink label="Thumbnail" url={render.thumbnail_url} />
        <AssetLink label="Full lesson MP4" url={render.mp4_url} />
        <AssetLink label="Intro MP4" url={render.render_json.intro_video_url} />
        <AssetLink label="Intro + lesson MP4" url={render.render_json.intro_lesson_video_url} />
        <AssetLink label="Lesson walkthrough MP4" url={render.render_json.lesson_video_url} />
      </div>

      {Boolean(render.render_json.scene_video_urls?.length) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-950">Separate scene videos</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {render.render_json.scene_video_urls?.map((scene) => (
              <AssetLink
                key={scene.scene_id}
                label={`${scene.kind === "task" ? `Task ${(scene.task_index ?? 0) + 1}` : scene.kind}: ${scene.title}`}
                url={scene.url}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-950">Pipeline coverage</h3>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          <StatusItem done label="TTS narration manifest" />
          <StatusItem done label="Slide/scene render manifest" />
          <StatusItem done label="Captions VTT/SRT" />
          <StatusItem done label="Thumbnail asset" />
          <StatusItem done={Boolean(render.mp4_url)} label="MP4 export" />
          <StatusItem done={Boolean(render.manifest_url)} label="Storage upload" />
          <StatusItem done={Boolean(render.render_json.tts_audio_urls?.length)} label="TTS audio files" />
          <StatusItem done={Boolean(render.render_json.slide_asset_urls?.length)} label="Rendered slide assets" />
          <StatusItem done={Boolean(render.render_json.intro_video_url)} label="Separate intro video" />
          <StatusItem done={Boolean(render.render_json.intro_lesson_video_url)} label="Combined intro + lesson video" />
          <StatusItem done={Boolean(render.render_json.lesson_video_url)} label="Separate lesson walkthrough" />
          <StatusItem done={Boolean(render.render_json.scene_video_urls?.some((scene) => scene.kind === "task"))} label="Separate task videos" />
        </div>
      </div>
    </section>
  );
}

function AssetLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f7faf9] p-4">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs font-semibold text-teal-700 hover:text-teal-900">
          Open asset
        </a>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Pending renderer output</p>
      )}
    </div>
  );
}

function StatusItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-3">
      <span className={`size-2 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`} />
      <span>{label}</span>
    </div>
  );
}
