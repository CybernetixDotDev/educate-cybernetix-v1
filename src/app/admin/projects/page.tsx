import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { JSONEditor } from "@/components/admin/JSONEditor";
import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type ProjectTemplate = {
  id: string;
  template_key: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  estimated_duration_minutes: number | null;
  technologies: string[];
  learning_objectives: string[];
  task_blueprint: unknown;
  starter_files: unknown;
  is_active: boolean;
};

function csv(value: FormDataEntryValue | null) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function json(value: FormDataEntryValue | null, fallback: unknown) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

async function saveTemplate(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  const id = String(formData.get("id") ?? "");
  const payload = {
    template_key: String(formData.get("template_key") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    difficulty_level: String(formData.get("difficulty_level") ?? ""),
    estimated_duration_minutes: Number(formData.get("estimated_duration_minutes") ?? 0) || null,
    technologies: csv(formData.get("technologies")),
    learning_objectives: csv(formData.get("learning_objectives")),
    task_blueprint: json(formData.get("task_blueprint"), []),
    starter_files: json(formData.get("starter_files"), {}),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await supabase.from("project_templates").update(payload).eq("id", id);
  } else {
    await supabase.from("project_templates").insert(payload);
  }
  revalidatePath("/admin/projects");
}

async function deleteTemplate(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase.from("project_templates").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/projects");
}

export default async function AdminProjectsPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("project_templates").select("*").order("template_key");
  const templates = (data ?? []) as ProjectTemplate[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Projects</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Project Templates</h1>
        </header>

        <FormSection title="Create new template">
          <form action={saveTemplate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Template key" name="template_key" required />
              <Field label="Title" name="title" required />
              <Field label="Description" name="description" />
              <Field label="Difficulty" name="difficulty_level" />
              <Field label="Estimated duration minutes" name="estimated_duration_minutes" type="number" />
              <Field label="Technologies" name="technologies" />
            </div>
            <Field label="Learning objectives" name="learning_objectives" />
            <JSONEditor name="task_blueprint" label="Task blueprint JSON" value={[]} />
            <JSONEditor name="starter_files" label="Starter files JSON" value={{}} rows={8} />
            <SubmitButton>Create Template</SubmitButton>
          </form>
        </FormSection>

        <Table columns={["Key", "Title", "Difficulty", "JSON", "Delete"]} empty={templates.length === 0}>
          {templates.map((template) => (
            <tr key={template.id} className="align-top">
              <td className="px-4 py-3 font-mono text-xs">{template.template_key}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{template.title}</td>
              <td className="px-4 py-3 text-slate-600">{template.difficulty_level}</td>
              <td className="px-4 py-3">
                <form action={saveTemplate} className="min-w-[32rem] space-y-3">
                  <input type="hidden" name="id" value={template.id} />
                  <input type="hidden" name="template_key" value={template.template_key} />
                  <Field label="Title" name="title" defaultValue={template.title} required />
                  <Field label="Description" name="description" defaultValue={template.description} />
                  <Field label="Difficulty" name="difficulty_level" defaultValue={template.difficulty_level} />
                  <Field label="Estimated minutes" name="estimated_duration_minutes" defaultValue={template.estimated_duration_minutes} type="number" />
                  <Field label="Technologies" name="technologies" defaultValue={template.technologies.join(", ")} />
                  <Field label="Learning objectives" name="learning_objectives" defaultValue={template.learning_objectives.join(", ")} />
                  <JSONEditor name="task_blueprint" value={template.task_blueprint} rows={8} />
                  <JSONEditor name="starter_files" value={template.starter_files} rows={8} />
                  <SubmitButton>Save</SubmitButton>
                </form>
              </td>
              <td className="px-4 py-3">
                <form action={deleteTemplate}>
                  <input type="hidden" name="id" value={template.id} />
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
