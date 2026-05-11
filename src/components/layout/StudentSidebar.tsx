"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type StudentNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      {children}
    </svg>
  );
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Progress, streaks, next steps",
    icon: <Icon><path d="M4 13h6V4H4v9Z" /><path d="M14 20h6V4h-6v16Z" /><path d="M4 20h6v-3H4v3Z" /></Icon>,
  },
  {
    href: "/learn",
    label: "Learn",
    description: "Lessons and quizzes",
    icon: <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></Icon>,
  },
  {
    href: "/mentor",
    label: "Cyber Mentor",
    description: "One place for help when stuck",
    icon: <Icon><path d="M12 3v3" /><path d="M5 8h14v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8Z" /><path d="M9 13h.01" /><path d="M15 13h.01" /></Icon>,
  },
  {
    href: "/project-mentor",
    label: "Build Project",
    description: "Your MVP tasks and progress",
    icon: <Icon><path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="m3 13 9 5 9-5" /></Icon>,
  },
  {
    href: "/certificates",
    label: "Progress",
    description: "Certificates and skill proof",
    icon: <Icon><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M5 6H3v2a4 4 0 0 0 4 4" /><path d="M19 6h2v2a4 4 0 0 1-4 4" /></Icon>,
  },
  {
    href: "/growth-timeline",
    label: "Growth Timeline",
    description: "Milestones and progress",
    icon: <Icon><path d="M4 19V5" /><path d="M4 17h5l2-4 3 2 3-7h3" /></Icon>,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function StudentSidebar({ open = true, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:shadow-none`}
    >
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">Educate Cybernetix</p>
        <h2 className="mt-1 text-xl font-black">Student Tools</h2>
      </div>
      <nav className="mt-5 space-y-1">
        {STUDENT_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition ${
                active ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span className={`mt-0.5 ${active ? "text-cyan-700" : "text-slate-400"}`}>{item.icon}</span>
              <span>
                <span className="block text-sm font-black">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <SignOutButton className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60" />
      </div>
    </aside>
  );
}
