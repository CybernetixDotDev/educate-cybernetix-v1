"use client";

import { STUDENT_NAV_ITEMS } from "@/components/layout/StudentSidebar";
import Link from "next/link";

const FEATURED_TOOLS = [
  "/mentor",
  "/project-mentor",
  "/debugger",
  "/code-review",
  "/presentation-coach",
  "/certificates",
  "/growth-timeline",
];

const TOOL_COPY: Record<string, { title: string; description: string; cta: string }> = {
  "/mentor": {
    title: "AI Mentor",
    description: "Ask for teaching, quiz help, or builder guidance.",
    cta: "Chat now",
  },
  "/project-mentor": {
    title: "Project Mentor",
    description: "Plan features, tasks, architecture, and next build steps.",
    cta: "Plan project",
  },
  "/debugger": {
    title: "Debugger",
    description: "Paste errors and get clear root-cause fixes.",
    cta: "Analyze error",
  },
  "/code-review": {
    title: "Code Review",
    description: "Improve quality, accessibility, security, and clarity.",
    cta: "Review code",
  },
  "/presentation-coach": {
    title: "Presentation Coach",
    description: "Prepare your slides, demo script, and Q&A answers.",
    cta: "Practice",
  },
  "/certificates": {
    title: "Certificates",
    description: "View your completion certificate and skill map.",
    cta: "View proof",
  },
  "/growth-timeline": {
    title: "Growth Timeline",
    description: "See milestones, achievements, and skill growth.",
    cta: "See timeline",
  },
};

export function QuickToolsGrid() {
  const tools = FEATURED_TOOLS.map((href) => {
    const navItem = STUDENT_NAV_ITEMS.find((item) => item.href === href);
    return navItem ? { ...navItem, ...TOOL_COPY[href] } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Quick Access</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Learning Tools</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex min-h-44 flex-col rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 ring-1 ring-slate-200">
              {tool.icon}
            </span>
            <span className="mt-4 block text-base font-black text-slate-950">{tool.title}</span>
            <span className="mt-2 block flex-1 text-sm leading-6 text-slate-600">{tool.description}</span>
            <span className="mt-4 text-sm font-black text-cyan-700 group-hover:text-cyan-900">{tool.cta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
