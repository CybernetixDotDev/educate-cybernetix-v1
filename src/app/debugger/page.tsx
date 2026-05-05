import { DebuggerClient } from "./DebuggerClient";
import { Suspense } from "react";

function DebuggerFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <div className="h-[34rem] animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}

export default function DebuggerPage() {
  return (
    <Suspense fallback={<DebuggerFallback />}>
      <DebuggerClient />
    </Suspense>
  );
}
