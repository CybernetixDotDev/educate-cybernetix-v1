import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getCurrentQuiz(lessonId: string) {
  const supabase = createClient(await cookies());
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, lesson_id, current_version_id, quiz_versions!quizzes_current_version_id_fkey(id, version_number, content_json, created_at)")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return quiz;
}

