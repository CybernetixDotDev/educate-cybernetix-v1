import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function csv(value: FormDataEntryValue | null) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

async function createModule(formData: FormData) {
  "use server";

  const moduleId = String(formData.get("module_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const weekNumber = Number(formData.get("week_number") ?? 1);
  const prerequisites = csv(formData.get("prerequisites"));
  const outcomes = csv(formData.get("outcomes"));
  const moduleAuthoring = {
    module_id: moduleId,
    title,
    description,
    week_number: weekNumber,
    prerequisites,
    outcomes,
    lessons: [],
    published: false,
  };
  const supabase = createClient(await cookies());

  await supabase.from("ai_module_context").upsert(
    {
      module_key: moduleId,
      module_title: title,
      module_description: description,
      grade_levels: [],
      learning_objectives: outcomes,
      context: {
        module_id: moduleId,
        module_authoring: moduleAuthoring,
        lessons: {},
        teacher_focus: "",
        quiz_focus: "",
        builder_focus: "",
      },
      prompt_overrides: {},
      is_active: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_key" },
  );

  redirect(`/admin/modules/${moduleId}/edit`);
}

export default function NewModulePage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <FormSection title="Create Module" description="Create the module shell, then manage lessons and publish state in the editor.">
          <form action={createModule} className="space-y-4">
            <Field label="module_id" name="module_id" required />
            <Field label="Title" name="title" required />
            <Field label="Description" name="description" />
            <Field label="week_number" name="week_number" type="number" defaultValue={1} />
            <Field label="prerequisites[]" name="prerequisites" />
            <Field label="outcomes[]" name="outcomes" />
            <SubmitButton>Create Module</SubmitButton>
          </form>
        </FormSection>
      </div>
    </main>
  );
}
