import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { JSONEditor } from "@/components/admin/JSONEditor";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type ModuleRow = {
  module_key: string;
  module_title: string;
  context: Record<string, unknown>;
};

function splitLessonParam(value: string) {
  const [moduleKey, lessonKey = "new"] = value.split("__");
  return { moduleKey, lessonKey };
}

function parseJson(value: FormDataEntryValue | null, fallback: unknown) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

async function saveLesson(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  const moduleKey = String(formData.get("module_key") ?? "");
  const lessonKey = String(formData.get("lesson_key") ?? "");
  const { data } = await supabase.from("ai_module_context").select("context").eq("module_key", moduleKey).maybeSingle();
  const context = ((data?.context as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  const lessons =
    context.lessons && typeof context.lessons === "object" ? (context.lessons as Record<string, unknown>) : {};

  lessons[lessonKey] = {
    title: String(formData.get("title") ?? ""),
    metadata: parseJson(formData.get("metadata"), {}),
    body: parseJson(formData.get("body"), []),
    codeExamples: parseJson(formData.get("code_examples"), []),
    images: parseJson(formData.get("images"), []),
    quiz: parseJson(formData.get("quiz"), {}),
  };

  await supabase
    .from("ai_module_context")
    .update({ context: { ...context, lessons }, updated_at: new Date().toISOString() })
    .eq("module_key", moduleKey);
  revalidatePath(`/admin/modules/${moduleKey}`);
  revalidatePath(`/admin/lessons/${moduleKey}__${lessonKey}`);
}

export default async function AdminLessonPage(props: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await props.params;
  const { moduleKey, lessonKey } = splitLessonParam(lessonId);
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("module_key,module_title,context").eq("module_key", moduleKey).maybeSingle();
  const moduleRecord = data as ModuleRow | null;
  const lessons = moduleRecord?.context?.lessons && typeof moduleRecord.context.lessons === "object"
    ? (moduleRecord.context.lessons as Record<string, unknown>)
    : {};
  const lesson = lessonKey === "new" ? {} : ((lessons[lessonKey] as Record<string, unknown>) ?? {});

  if (!moduleRecord) {
    return <main className="p-8 text-slate-600">Module not found for this lesson.</main>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <Link href={`/admin/modules/${moduleRecord.module_key}`} className="text-sm font-semibold text-cyan-700">
            Back to {moduleRecord.module_title}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Edit Lesson</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{moduleRecord.module_key}</p>
        </header>

        <FormSection title="Lesson content">
          <form action={saveLesson} className="space-y-4">
            <input type="hidden" name="module_key" value={moduleRecord.module_key} />
            <Field label="Lesson ID" name="lesson_key" defaultValue={lessonKey === "new" ? "" : lessonKey} required />
            <Field label="Title" name="title" defaultValue={typeof lesson.title === "string" ? lesson.title : ""} required />
            <JSONEditor name="metadata" label="Lesson metadata JSON" value={lesson.metadata ?? {}} rows={8} />
            <JSONEditor name="body" label="Lesson body JSON" value={lesson.body ?? []} />
            <JSONEditor name="code_examples" label="Code examples JSON" value={lesson.codeExamples ?? []} />
            <JSONEditor name="images" label="Images JSON" value={lesson.images ?? []} rows={8} />
            <JSONEditor name="quiz" label="Quiz metadata JSON" value={lesson.quiz ?? { questions: [] }} />
            <SubmitButton>Save Lesson</SubmitButton>
          </form>
        </FormSection>
      </div>
    </main>
  );
}
