"use server";

import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function assertAdmin() {
  const role = await requireRole(["admin"]);
  if (!role) throw new Error("Admin access required.");
}

export async function createModule(formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);

  if (!title) throw new Error("Module title is required.");

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("modules").insert({
    title,
    description: description || null,
    order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function deleteModule(moduleId: string) {
  await assertAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function createLesson(formData: FormData) {
  await assertAdmin();
  const moduleId = String(formData.get("module_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);

  if (!moduleId || !title) throw new Error("Module and lesson title are required.");

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title,
    order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function deleteLesson(lessonId: string) {
  await assertAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function setCurrentLessonVersion(lessonId: string, versionId: string) {
  await assertAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("lessons")
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", lessonId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/curriculum");
  return { ok: true };
}

export async function setCurrentQuizVersion(quizId: string, versionId: string) {
  await assertAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("quizzes")
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", quizId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/curriculum");
  return { ok: true };
}

