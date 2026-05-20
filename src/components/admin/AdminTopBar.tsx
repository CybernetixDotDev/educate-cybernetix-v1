"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTopBar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";

  return (
    <header className="sticky top-0 z-20 border-b border-teal-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Admin Studio</p>
          <p className="truncate text-sm font-medium text-slate-500">
            {isDashboard ? "Platform dashboard" : "Manage this screen, then return to the admin dashboard when done."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isDashboard && (
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
            >
              Return to Dashboard
            </Link>
          )}
          <SignOutButton className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60" />
        </div>
      </div>
    </header>
  );
}
