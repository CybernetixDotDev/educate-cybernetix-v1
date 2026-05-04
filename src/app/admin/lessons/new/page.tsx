import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ModuleRow = {
  module_key: string;
  module_title: string;
};

async function createLesson(formData: FormData) {
  "use server";

  const moduleId = String(formData.get("module_id") ?? "");
  const lessonId = String(formData.get("lesson_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("context").eq("module_key", moduleId).maybeSingle();
  const context = data?.context && typeof data.context === "object" && !Array.isArray(data.context)
    ? (data.context as Record<string, unknown>)
    : {};
  const lessons = context.lessons && typeof context.lessons === "object" && !Array.isArray(context.lessons)
    ? (context.lessons as Record<string, unknown>)
    : {};

  lessons[lessonId] = {
    title,
    description,
    body: "",
    codeExamples: [],
    images: [],
    quiz: { questions: [] },
    metadata: {
      module_id: moduleId,
      lesson_id: lessonId,
      order_index: orderIndex,
      estimated_time: 20,
      prerequisites: [],
      next_lessons: [],
    },
    status: "draft",
    published_at: null,
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("ai_module_context")
    .update({ context: { ...context, lessons }, updated_at: new Date().toISOString() })
    .eq("module_key", moduleId);

  redirect(`/admin/lessons/${moduleId}__${lessonId}/edit`);
}

export default async function NewLessonPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("module_key,module_title").order("module_key");
  const modules = (data ?? []) as ModuleRow[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <FormSection title="Create Lesson" description="Create the lesson shell, then continue into the full authoring editor.">
          <form action={createLesson} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Module</span>
              <select name="module_id" required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select module</option>
                {modules.map((module) => (
                  <option key={module.module_key} value={module.module_key}>
                    {module.module_title}
                  </option>
                ))}
              </select>
            </label>
            <Field label="lesson_id" name="lesson_id" required />
            <Field label="Title" name="title" required />
            <Field label="Description" name="description" />
            <Field label="order_index" name="order_index" type="number" defaultValue={0} />
            <SubmitButton>Create Lesson</SubmitButton>
          </form>
        </FormSection>
      </div>
    </main>
  );
}
