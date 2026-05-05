import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getQuizVersions(quizId: string) {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("quiz_versions")
    .select("id, quiz_id, version_number, content_json, created_at, created_by")
    .eq("quiz_id", quizId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

