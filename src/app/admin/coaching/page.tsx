import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { CoachingClient } from "./CoachingClient";

type StudentRow = { id: string; display_name: string; email: string | null };

async function CoachingContent() {
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
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">AI Coaching</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Student Coaching Engine</h1>
          <p className="mt-2 text-slate-600">Generate weekly plans, daily micro-tasks, skill focus, motivation, and growth insights.</p>
        </header>
        <CoachingClient students={students} />
      </div>
    </main>
  );
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading coaching engine...</main>;
}

export default function CoachingPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CoachingContent />
    </Suspense>
  );
}
