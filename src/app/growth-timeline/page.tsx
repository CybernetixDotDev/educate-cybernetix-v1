import { GrowthTimelineClient } from "./GrowthTimelineClient";
import { Suspense } from "react";

function GrowthTimelineFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

export default function GrowthTimelinePage() {
  return (
    <Suspense fallback={<GrowthTimelineFallback />}>
      <GrowthTimelineClient />
    </Suspense>
  );
}
