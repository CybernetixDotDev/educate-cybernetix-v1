import type { ReactNode } from "react";

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </main>
  );
}

