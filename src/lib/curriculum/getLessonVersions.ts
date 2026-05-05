import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getLessonVersions(lessonId: string) {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("lesson_versions")
    .select("id, lesson_id, version_number, content_json, created_at, created_by")
    .eq("lesson_id", lessonId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

