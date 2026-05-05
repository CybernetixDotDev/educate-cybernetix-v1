import type { ReactNode } from "react";

export function ParentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </main>
  );
}

