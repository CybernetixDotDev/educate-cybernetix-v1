import { SignOutButton } from "@/components/auth/SignOutButton";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/modules", label: "Modules" },
  { href: "/admin/curriculum", label: "Curriculum" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/ai-config", label: "AI Config" },
  { href: "/admin/ai-context", label: "AI Context" },
  { href: "/admin/ai-lesson-generator", label: "AI Lesson Generator" },
  { href: "/admin/ai-quiz-generator", label: "AI Quiz Generator" },
  { href: "/admin/weekly-summary", label: "Weekly Summary AI" },
  { href: "/admin/parent-reports", label: "Parent Reports" },
  { href: "/admin/growth-timeline", label: "Growth Timeline" },
  { href: "/admin/coaching", label: "Coaching AI" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/summaries", label: "Weekly Summaries" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-teal-100 bg-white/95 p-4 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 lg:block">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Educate Cybernetix</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Admin Studio</h1>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-teal-700 lg:hidden">
          Dashboard
        </Link>
      </div>
      <nav className="mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/admin" className="mt-8 hidden text-sm font-semibold text-slate-500 hover:text-teal-700 lg:block">
        Return to Dashboard
      </Link>
      <div className="mt-4 hidden border-t border-slate-200 pt-4 lg:block">
        <SignOutButton className="w-full rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60" />
      </div>
      <div className="mt-4 lg:hidden">
        <SignOutButton className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60" />
      </div>
    </aside>
  );
}
