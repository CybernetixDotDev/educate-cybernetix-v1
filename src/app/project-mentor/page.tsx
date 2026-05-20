import { ProjectMentorClient } from "./ProjectMentorClient";
import { Suspense } from "react";

function ProjectMentorFallback() {
  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
          <div className="space-y-6">
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
          <div className="h-[34rem] animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </main>
  );
}

export default function ProjectMentorPage() {
  return (
    <Suspense fallback={<ProjectMentorFallback />}>
      <ProjectMentorClient />
    </Suspense>
  );
}
