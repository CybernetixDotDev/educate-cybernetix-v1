"use client";

import Link from "next/link";

const PRIMARY_ACTIONS = [
  {
    href: "/learn",
    eyebrow: "Learn",
    title: "Continue Learning",
    description: "Pick up the next lesson, then take the checkpoint when you are ready.",
    cta: "Open lessons",
  },
  {
    href: "/project-mentor",
    eyebrow: "Build",
    title: "Continue Project",
    description: "Work through your current MVP task list and keep your project moving.",
    cta: "Open project",
  },
  {
    href: "/mentor",
    eyebrow: "Ask",
    title: "Ask Cyber Mentor",
    description: "Explain a lesson, fix an error, review code, plan a feature, or prepare a demo from one chat.",
    cta: "Ask for help",
  },
] as const;

const SECONDARY_ACTIONS = [
  { href: "/certificates", label: "Certificates" },
  { href: "/growth-timeline", label: "Growth Timeline" },
  { href: "/mentor?intent=debug", label: "Debug with Mentor" },
  { href: "/mentor?intent=review", label: "Review code with Mentor" },
] as const;

export function QuickToolsGrid() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Today&apos;s Workflow</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Learn, build, ask when stuck</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Cyber Mentor automatically switches between teacher, project builder, debugger, code reviewer, quiz coach, and presentation coach.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {PRIMARY_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-sm"
          >
            <span className="text-xs font-black uppercase tracking-wide text-cyan-700">{action.eyebrow}</span>
            <h3 className="mt-2 text-lg font-black text-slate-950">{action.title}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{action.description}</p>
            <span className="mt-4 inline-flex text-sm font-black text-cyan-700 group-hover:text-cyan-900">{action.cta}</span>
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
