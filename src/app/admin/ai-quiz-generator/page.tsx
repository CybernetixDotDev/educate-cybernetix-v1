import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AIQuizGeneratorClient } from "./AIQuizGeneratorClient";

type ModuleRow = {
  module_key: string;
  module_title: string;
  context: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function AIQuizGeneratorContent() {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("ai_module_context")
    .select("module_key,module_title,context")
    .order("module_key");
  const modules = ((data ?? []) as ModuleRow[]).map((module) => {
    const context = isRecord(module.context) ? module.context : {};
    const lessons = isRecord(context.lessons) ? context.lessons : {};

    return {
      module_id: module.module_key,
      title: module.module_title,
      lessons: Object.entries(lessons).map(([lessonId, lesson]) => ({
        lesson_id: lessonId,
        title: isRecord(lesson) && typeof lesson.title === "string" ? lesson.title : lessonId,
      })),
    };
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">AI Authoring</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">AI-Assisted Quiz Generator</h1>
          <p className="mt-2 text-slate-600">
            Generate lesson, module, remediation, and challenge quizzes using mentor and module context.
          </p>
        </header>
        <AIQuizGeneratorClient modules={modules} />
      </div>
    </main>
  );
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading AI quiz generator...</main>;
}

export default function AIQuizGeneratorPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AIQuizGeneratorContent />
    </Suspense>
  );
}
