"use server";

import { requireRole } from "@/lib/auth/roles";
import { validateQuizJson } from "@/lib/curriculum/validateLessonJson";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function publishQuizVersion(lessonId: string, contentJson: unknown) {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, error: "Admin access required." };

  const validation = validateQuizJson(contentJson);
  if (!validation.valid || !validation.data) return { ok: false, error: validation.errors.join(" ") };

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .upsert({ lesson_id: lessonId, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" })
    .select("id")
    .single();

  if (quizError) return { ok: false, error: quizError.message };

  const { data: latest, error: latestError } = await supabase
    .from("quiz_versions")
    .select("version_number")
    .eq("quiz_id", quiz.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) return { ok: false, error: latestError.message };

  const versionNumber = Number(latest?.version_number ?? 0) + 1;
  const { data: version, error } = await supabase
    .from("quiz_versions")
    .insert({
      quiz_id: quiz.id,
      version_number: versionNumber,
      content_json: validation.data,
      created_by: userResult.user?.id ?? null,
    })
    .select("id, version_number")
    .single();

  if (error) return { ok: false, error: error.message };

  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ current_version_id: version.id, updated_at: new Date().toISOString() })
    .eq("id", quiz.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/admin/curriculum");
  return { ok: true, quiz_id: quiz.id as string, version_id: version.id as string, version_number: version.version_number as number };
}

