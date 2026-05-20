"use client";

import Link from "next/link";

const PRIMARY_ACTIONS = [
  {
    href: "/learn",
    eyebrow: "Step 1",
    title: "Learn the concept",
    description: "Open the next short lesson and understand the idea before building.",
    cta: "Continue course",
  },
  {
    href: "/project-mentor",
    eyebrow: "Step 2",
    title: "Build the mission",
    description: "Apply the lesson to your project and finish one practical task.",
    cta: "Open project",
  },
  {
    href: "/mentor",
    eyebrow: "Any time",
    title: "Ask Cyber Mentor",
    description: "Get help with the lesson, project, debugging, code review, quiz prep, or presentation practice.",
    cta: "Ask for help",
  },
] as const;

const SECONDARY_ACTIONS = [
  { href: "/growth-timeline", label: "View progress" },
  { href: "/certificates", label: "Certificates" },
] as const;

export function QuickToolsGrid() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">How today works</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Learn, build, ask when stuck</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Cyber Mentor is one assistant behind the scenes. You do not need to choose a separate debugging, review, or presentation tool.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {PRIMARY_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:shadow-sm"
          >
            <span className="text-xs font-black uppercase tracking-wide text-teal-700">{action.eyebrow}</span>
            <h3 className="mt-2 text-lg font-black text-slate-950">{action.title}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{action.description}</p>
            <span className="mt-4 inline-flex text-sm font-black text-teal-700 group-hover:text-teal-900">{action.cta}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {SECONDARY_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
