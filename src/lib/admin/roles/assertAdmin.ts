import "server-only";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function assertAdmin() {
  const supabase = createClient(await cookies());
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    throw new Error("You must be signed in to manage roles.");
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (roleError || roleRow?.role !== "admin") {
    throw new Error("Only admins can manage roles.");
  }

  return userResult.user;
}

