import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
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
  is_active: boolean;
  updated_at: string;
};

function arrayFromText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function createModule(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase.from("ai_module_context").insert({
    module_key: String(formData.get("module_key") ?? ""),
    module_title: String(formData.get("module_title") ?? ""),
    module_description: String(formData.get("module_description") ?? ""),
    grade_levels: arrayFromText(formData.get("grade_levels")),
    learning_objectives: arrayFromText(formData.get("learning_objectives")),
    context: {
      module_id: String(formData.get("module_key") ?? ""),
      teacher_focus: "",
      quiz_focus: "",
      builder_focus: "",
      lessons: {},
    },
    prompt_overrides: {},
    is_active: true,
  });
  revalidatePath("/admin/modules");
}

async function updateModule(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase
    .from("ai_module_context")
    .update({
      module_title: String(formData.get("module_title") ?? ""),
      module_description: String(formData.get("module_description") ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/modules");
}

async function deleteModule(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase.from("ai_module_context").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/modules");
}

export default async function AdminModulesPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("ai_module_context")
    .select("id,module_key,module_title,module_description,is_active,updated_at")
    .order("module_key");
  const modules = (data ?? []) as ModuleRow[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Modules</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Manage Modules</h1>
        </header>

        <FormSection title="Create module" description="Modules are stored as AI module context packs.">
          <form action={createModule} className="grid gap-4 md:grid-cols-2">
            <Field label="Module Key" name="module_key" required />
            <Field label="Title" name="module_title" required />
            <Field label="Description" name="module_description" />
            <Field label="Grade levels (comma-separated)" name="grade_levels" />
            <div className="md:col-span-2">
              <Field label="Learning objectives (comma-separated)" name="learning_objectives" />
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Create Module</SubmitButton>
            </div>
          </form>
        </FormSection>

        <Table columns={["Key", "Title", "Status", "Edit", "Delete"]} empty={modules.length === 0}>
          {modules.map((module) => (
            <tr key={module.id}>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{module.module_key}</td>
              <td className="px-4 py-3">
                <form action={updateModule} className="grid gap-2 lg:grid-cols-[1fr_2fr_auto]">
                  <input type="hidden" name="id" value={module.id} />
                  <input
                    name="module_title"
                    defaultValue={module.module_title}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    name="module_description"
                    defaultValue={module.module_description ?? ""}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button className="rounded bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Save</button>
                </form>
              </td>
              <td className="px-4 py-3 text-slate-600">{module.is_active ? "Active" : "Inactive"}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/modules/${module.module_key}`} className="font-semibold text-cyan-700">
                  Details
                </Link>
              </td>
              <td className="px-4 py-3">
                <form action={deleteModule}>
                  <input type="hidden" name="id" value={module.id} />
                  <button className="font-semibold text-rose-600">Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </main>
  );
}
