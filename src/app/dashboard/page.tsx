import { DashboardContent } from "@/components/dashboard/ProjectCard";
import { Suspense } from "react";

function DashboardFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
