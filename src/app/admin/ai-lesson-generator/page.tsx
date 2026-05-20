import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AILessonGeneratorClient } from "./AILessonGeneratorClient";
import type { LessonBlueprintSummary, LessonBrief } from "@/lib/lesson-studio/types";

type BlueprintRow = {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  brief_json: LessonBrief;
};

async function AILessonGeneratorContent() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("lesson_blueprints")
    .select("id,title,status,updated_at,brief_json")
    .order("updated_at", { ascending: false })
    .limit(20);

  const blueprints: LessonBlueprintSummary[] = error
    ? []
    : ((data ?? []) as BlueprintRow[]).map((blueprint) => ({
        id: blueprint.id,
        title: blueprint.title,
        status: blueprint.status,
        updated_at: blueprint.updated_at,
        brief: blueprint.brief_json,
      }));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">AI Lesson Studio</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Turn a clear brief into a complete teaching package.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Create reusable lesson blueprints for the curriculum team, then generate consistent StarterSchool-style lessons with
            a hook, teaching steps, video script, quiz, project checklist, and transcript.
          </p>
        </header>
        <AILessonGeneratorClient blueprints={blueprints} />
      </div>
    </main>
  );
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading AI lesson generator...</main>;
}

export default function AILessonGeneratorPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AILessonGeneratorContent />
    </Suspense>
  );
}
