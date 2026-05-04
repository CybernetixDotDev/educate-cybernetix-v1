import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { WeeklySummaryClient } from "./WeeklySummaryClient";

type StudentRow = {
  id: string;
  display_name: string;
  email: string | null;
};

async function WeeklySummaryContent() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("students").select("id,display_name,email").order("display_name");
  const students = ((data ?? []) as StudentRow[]).map((student) => ({
    student_id: student.id,
    name: student.email ? `${student.display_name} (${student.email})` : student.display_name,
  }));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">AI Reporting</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Weekly Summary Generator</h1>
          <p className="mt-2 text-slate-600">
            Generate parent summaries and student reflections from progress, engagement, quiz, and project data.
          </p>
        </header>
        <WeeklySummaryClient students={students} />
      </div>
    </main>
  );
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading weekly summary generator...</main>;
}

export default function WeeklySummaryPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <WeeklySummaryContent />
    </Suspense>
  );
}
