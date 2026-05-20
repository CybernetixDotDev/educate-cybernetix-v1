import { SignOutButton } from "@/components/auth/SignOutButton";
import type { ReactNode } from "react";

export function ParentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex justify-end">
          <SignOutButton className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60" />
        </div>
        {children}
      </div>
    </main>
  );
}
