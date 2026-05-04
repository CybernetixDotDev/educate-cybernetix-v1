import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type AppRole = "student" | "parent" | "admin";

export function dashboardPathForRole(role: AppRole | null) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parent/dashboard";
  return "/dashboard";
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = createClient(await cookies());
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  return data?.role === "admin" || data?.role === "parent" || data?.role === "student" ? data.role : "student";
}

export async function requireRole(allowedRoles: AppRole[]) {
  const role = await getCurrentUserRole();
  return role && allowedRoles.includes(role) ? role : null;
}
