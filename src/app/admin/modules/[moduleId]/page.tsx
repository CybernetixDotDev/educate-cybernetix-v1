import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { JSONEditor } from "@/components/admin/JSONEditor";
import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type ModuleRow = {
  id: string;
  module_key: string;
  module_title: string;
  module_description: string | null;
  grade_levels: string[];
  learning_objectives: string[];
  context: Record<string, unknown>;
  prompt_overrides: Record<string, unknown>;
};

function parseJson(value: FormDataEntryValue | null, fallback: unknown) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

function arrayFromText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function saveModule(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  const moduleKey = String(formData.get("module_key") ?? "");
  await supabase
    .from("ai_module_context")
    .update({
      module_title: String(formData.get("module_title") ?? ""),
      module_description: String(formData.get("module_description") ?? ""),
      grade_levels: arrayFromText(formData.get("grade_levels")),
      learning_objectives: arrayFromText(formData.get("learning_objectives")),
      context: parseJson(formData.get("context"), {}),
      prompt_overrides: parseJson(formData.get("prompt_overrides"), {}),
      updated_at: new Date().toISOString(),
    })
    .eq("module_key", moduleKey);
  revalidatePath(`/admin/modules/${moduleKey}`);
}

export default async function AdminModuleDetailPage(props: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await props.params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("*").eq("module_key", moduleId).maybeSingle();
  const moduleRecord = data as ModuleRow | null;
  const lessons = moduleRecord?.context?.lessons && typeof moduleRecord.context.lessons === "object"
    ? Object.entries(moduleRecord.context.lessons as Record<string, unknown>)
    : [];

  if (!moduleRecord) {
    return <main className="p-8 text-slate-600">Module not found.</main>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <Link href="/admin/modules" className="text-sm font-semibold text-cyan-700">
            Back to modules
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{moduleRecord.module_title}</h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{moduleRecord.module_key}</p>
        </header>

        <FormSection title="Module metadata">
          <form action={saveModule} className="space-y-4">
            <input type="hidden" name="module_key" value={moduleRecord.module_key} />
            <Field label="Title" name="module_title" defaultValue={moduleRecord.module_title} required />
            <Field label="Description" name="module_description" defaultValue={moduleRecord.module_description} />
            <Field label="Grade levels" name="grade_levels" defaultValue={moduleRecord.grade_levels.join(", ")} />
            <Field
              label="Learning objectives"
              name="learning_objectives"
              defaultValue={moduleRecord.learning_objectives.join(", ")}
            />
            <JSONEditor name="context" label="Context JSON" value={moduleRecord.context} />
            <JSONEditor name="prompt_overrides" label="Prompt overrides JSON" value={moduleRecord.prompt_overrides} rows={8} />
            <SubmitButton>Save Module</SubmitButton>
          </form>
        </FormSection>

        <FormSection title="Lessons in module" description="Lesson records are stored under context.lessons.">
          <Table columns={["Lesson ID", "Title", "Edit"]} empty={lessons.length === 0}>
            {lessons.map(([lessonId, lesson]) => (
              <tr key={lessonId}>
                <td className="px-4 py-3 font-mono text-xs">{lessonId}</td>
                <td className="px-4 py-3 text-slate-700">
                  {typeof lesson === "object" && lesson && "title" in lesson ? String(lesson.title) : lessonId}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/lessons/${moduleRecord.module_key}__${lessonId}`} className="font-semibold text-cyan-700">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          <Link href={`/admin/lessons/${moduleRecord.module_key}__new`} className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Create Lesson
          </Link>
        </FormSection>
      </div>
    </main>
  );
}
