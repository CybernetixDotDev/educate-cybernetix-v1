import { Field, FormSection, SubmitButton } from "@/components/admin/Form";
import { JSONEditor } from "@/components/admin/JSONEditor";
import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type Achievement = {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  category: string;
  badge_url: string | null;
  points: number;
  requirements: unknown;
  tags: string[];
};

function csv(value: FormDataEntryValue | null) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function json(value: FormDataEntryValue | null) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return {};
  }
}

async function saveAchievement(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  const id = String(formData.get("id") ?? "");
  const payload = {
    achievement_key: String(formData.get("achievement_key") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    badge_url: String(formData.get("badge_url") ?? "") || null,
    points: Number(formData.get("points") ?? 0),
    requirements: json(formData.get("requirements")),
    tags: csv(formData.get("tags")),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await supabase.from("achievements").update(payload).eq("id", id);
  } else {
    await supabase.from("achievements").insert(payload);
  }
  revalidatePath("/admin/achievements");
}

async function deleteAchievement(formData: FormData) {
  "use server";

  const supabase = createClient(await cookies());
  await supabase.from("achievements").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/achievements");
}

export default async function AdminAchievementsPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("achievements").select("*").order("achievement_key");
  const achievements = (data ?? []) as Achievement[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Achievements</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Manage Achievements</h1>
        </header>

        <FormSection title="Create achievement">
          <form action={saveAchievement} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Key" name="achievement_key" required />
              <Field label="Title" name="title" required />
              <Field label="Description" name="description" required />
              <Field label="Category" name="category" required />
              <Field label="Badge URL" name="badge_url" />
              <Field label="Points" name="points" type="number" defaultValue={0} />
            </div>
            <Field label="Tags" name="tags" />
            <JSONEditor name="requirements" value={{}} rows={8} />
            <SubmitButton>Create Achievement</SubmitButton>
          </form>
        </FormSection>

        <Table columns={["Key", "Title", "Category", "Points", "Edit", "Delete"]} empty={achievements.length === 0}>
          {achievements.map((achievement) => (
            <tr key={achievement.id} className="align-top">
              <td className="px-4 py-3 font-mono text-xs">{achievement.achievement_key}</td>
              <td className="px-4 py-3 font-semibold">{achievement.title}</td>
              <td className="px-4 py-3">{achievement.category}</td>
              <td className="px-4 py-3">{achievement.points}</td>
              <td className="px-4 py-3">
                <form action={saveAchievement} className="min-w-[28rem] space-y-3">
                  <input type="hidden" name="id" value={achievement.id} />
                  <input type="hidden" name="achievement_key" value={achievement.achievement_key} />
                  <Field label="Title" name="title" defaultValue={achievement.title} />
                  <Field label="Description" name="description" defaultValue={achievement.description} />
                  <Field label="Category" name="category" defaultValue={achievement.category} />
                  <Field label="Badge URL" name="badge_url" defaultValue={achievement.badge_url} />
                  <Field label="Points" name="points" type="number" defaultValue={achievement.points} />
                  <Field label="Tags" name="tags" defaultValue={achievement.tags.join(", ")} />
                  <JSONEditor name="requirements" value={achievement.requirements} rows={6} />
                  <SubmitButton>Save</SubmitButton>
                </form>
              </td>
              <td className="px-4 py-3">
                <form action={deleteAchievement}>
                  <input type="hidden" name="id" value={achievement.id} />
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
