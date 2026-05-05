import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getCurrentLesson(lessonId: string) {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, order_index, current_version_id, lesson_versions!lessons_current_version_id_fkey(id, version_number, content_json, created_at)")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

