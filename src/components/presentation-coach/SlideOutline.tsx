"use client";

import type { SlideOutlineItem } from "@/lib/ai/generatePresentation";

type SlideOutlineProps = {
  slides: SlideOutlineItem[];
  onChange: (slides: SlideOutlineItem[]) => void;
};

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function SlideOutline({ slides, onChange }: SlideOutlineProps) {
  function update(index: number, patch: Partial<SlideOutlineItem>) {
    onChange(slides.map((slide, slideIndex) => (slideIndex === index ? { ...slide, ...patch } : slide)));
  }

  function addSlide() {
    onChange([...slides, { title: `Slide ${slides.length + 1}`, bullets: [], visual_suggestions: [] }]);
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Slide Outline</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Presentation structure</h2>
        </div>
        <button type="button" onClick={addSlide} className="rounded-xl border border-cyan-200 px-3 py-2 text-xs font-black text-cyan-800">
          Add Slide
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {slides.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-6 text-center text-sm font-bold text-cyan-900">
            Generate a presentation to create slide titles, bullets, and visuals.
          </div>
        )}
        {slides.map((slide, index) => (
          <article key={`${slide.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-black text-cyan-700">
                {index + 1}
              </span>
              <input
                value={slide.title}
                onChange={(event) => update(index, { title: event.target.value })}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black"
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <textarea
                value={slide.bullets.join("\n")}
                onChange={(event) => update(index, { bullets: lines(event.target.value) })}
                rows={4}
                placeholder="Bullet points, one per line"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={slide.visual_suggestions.join("\n")}
                onChange={(event) => update(index, { visual_suggestions: lines(event.target.value) })}
                rows={4}
                placeholder="Visual suggestions, one per line"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
