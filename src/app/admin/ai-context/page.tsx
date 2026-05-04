import { SubmitButton } from "@/components/admin/Form";
import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type ContextRow = {
  id: string;
  module_key: string;
  module_title: string;
  context: Record<string, unknown>;
};

async function saveContext(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.from("ai_module_context").select("context").eq("id", id).maybeSingle();
  const context = ((data?.context as Record<string, unknown>) ?? {}) as Record<string, unknown>;

  await supabase
    .from("ai_module_context")
    .update({
      context: {
        ...context,
        teacher_focus: String(formData.get("teacher_focus") ?? ""),
        quiz_focus: String(formData.get("quiz_focus") ?? ""),
        builder_focus: String(formData.get("builder_focus") ?? ""),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/ai-context");
}

export default async function AdminAIContextPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("ai_module_context").select("id,module_key,module_title,context").order("module_key");
  const rows = (data ?? []) as ContextRow[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">AI Context</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Module Context Packs</h1>
        </header>
        <Table columns={["Module", "Teacher Focus", "Quiz Focus", "Builder Focus", "Save"]} empty={rows.length === 0}>
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{row.module_title}</p>
                <p className="font-mono text-xs text-slate-500">{row.module_key}</p>
              </td>
              <td colSpan={4} className="px-4 py-3">
                <form action={saveContext} className="grid gap-3 lg:grid-cols-4">
                  <input type="hidden" name="id" value={row.id} />
                  <textarea name="teacher_focus" defaultValue={String(row.context.teacher_focus ?? "")} rows={5} className="rounded border border-slate-300 p-2 text-sm" />
                  <textarea name="quiz_focus" defaultValue={String(row.context.quiz_focus ?? "")} rows={5} className="rounded border border-slate-300 p-2 text-sm" />
                  <textarea name="builder_focus" defaultValue={String(row.context.builder_focus ?? "")} rows={5} className="rounded border border-slate-300 p-2 text-sm" />
                  <div className="flex items-start">
                    <SubmitButton>Save</SubmitButton>
                  </div>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </main>
  );
}
