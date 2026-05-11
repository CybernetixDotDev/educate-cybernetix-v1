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
  const courseId = String(formData.get("course_id") ?? "").trim();
  const moduleKey = String(formData.get("module_key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const weekNumber = Number(formData.get("week_number") ?? orderIndex);

  if (!title) throw new Error("Module title is required.");

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("modules").insert({
    course_id: courseId || null,
    module_key: moduleKey || null,
    title,
    description: description || null,
    order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
    week_number: Number.isFinite(weekNumber) ? weekNumber : null,
    is_published: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function createCourse(formData: FormData) {
  await assertAdmin();
  const courseKey = String(formData.get("course_key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "programming").trim();
  const durationWeeks = Number(formData.get("duration_weeks") ?? 0);
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const published = formData.get("is_published") === "on";

  if (!courseKey) throw new Error("Course key is required.");
  if (!title) throw new Error("Course title is required.");

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("courses").insert({
    course_key: courseKey,
    title,
    description: description || null,
    category: category || "general",
    target_audience: "teens",
    duration_weeks: Number.isFinite(durationWeeks) && durationWeeks > 0 ? durationWeeks : null,
    difficulty_level: "beginner",
    is_published: published,
    order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

export async function deleteCourse(courseId: string) {
  await assertAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
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
