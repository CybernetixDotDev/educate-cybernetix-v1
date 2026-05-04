import { LessonAuthoringClient } from "./LessonAuthoringClient";
import { loadLesson } from "@/lib/lessons/loadLesson";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

function splitLessonParam(value: string) {
  const [moduleId, lessonId = "new"] = value.split("__");
  return { moduleId, lessonId };
}

async function LessonEditorContent({ lessonParam }: { lessonParam: string }) {
  const { moduleId, lessonId } = splitLessonParam(lessonParam);
  const supabase = createClient(await cookies());
  const { lesson, moduleTitle, exists } = await loadLesson(supabase, moduleId, lessonId);

  return <LessonAuthoringClient initialLesson={lesson} moduleTitle={moduleTitle} exists={exists} />;
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading lesson editor...</main>;
}

export default async function LessonEditPage(props: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await props.params;

  return (
    <Suspense fallback={<Fallback />}>
      <LessonEditorContent lessonParam={lessonId} />
    </Suspense>
  );
}
