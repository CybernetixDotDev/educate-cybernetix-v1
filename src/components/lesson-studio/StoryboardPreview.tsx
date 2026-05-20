"use client";

import type { LessonStoryboard } from "@/lib/lesson-studio/types";

type StoryboardPreviewProps = {
  storyboard: LessonStoryboard | null;
};

export function StoryboardPreview({ storyboard }: StoryboardPreviewProps) {
  if (!storyboard) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Storyboard</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">No storyboard yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Generate a lesson first, then create a scene-by-scene storyboard for the future MP4 renderer.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Storyboard</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{storyboard.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{storyboard.style_notes}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
          {storyboard.scenes.length} scenes · {Math.round(storyboard.total_duration_seconds / 60)} min
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {storyboard.scenes.map((scene, index) => (
          <article key={scene.scene_id} className="rounded-3xl border border-slate-200 bg-[#f7faf9] p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{scene.visual_type}</p>
                <h3 className="mt-1 font-semibold text-slate-950">{scene.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{scene.duration_seconds}s · {scene.animation_style}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">On screen</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{scene.on_screen_text}</p>
            </div>

            <div className="mt-3 rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Narration</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{scene.narration_text}</p>
            </div>

            {scene.asset_references.length > 0 && (
              <div className="mt-3 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Assets</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {scene.asset_references.map((asset, assetIndex) => (
                    <li key={`${asset}-${assetIndex}`} className="break-all">{asset}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Caption notes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{storyboard.caption_notes}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Render notes</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{storyboard.render_notes}</p>
        </div>
      </div>
    </section>
  );
}
