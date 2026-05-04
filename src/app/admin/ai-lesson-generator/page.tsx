import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AILessonGeneratorClient } from "./AILessonGeneratorClient";

type ModuleRow = {
  module_key: string;
  module_title: string;
};

async function AILessonGeneratorContent() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("module_key,module_title").order("module_key");
  const modules = ((data ?? []) as ModuleRow[]).map((module) => ({
    module_id: module.module_key,
    title: module.module_title,
  }));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">AI Authoring</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">AI-Assisted Lesson Generator</h1>
          <p className="mt-2 text-slate-600">
            Generate lesson content, quizzes, metadata, skill tags, and difficulty using the platform mentor context.
          </p>
        </header>
        <AILessonGeneratorClient modules={modules} />
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
