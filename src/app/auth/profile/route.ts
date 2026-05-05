import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

function displayNameFromUser(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "Cybernetix Student";
}

function dashboardPathForRole(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parent/dashboard";
  return "/dashboard";
}

export async function POST() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("students").upsert(
    {
      user_id: data.user.id,
      display_name: displayNameFromUser(data.user),
      email: data.user.email ?? null,
      last_active_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  await supabase.from("user_roles").insert({
    user_id: data.user.id,
    role: "student",
  });

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: studentRow } = await supabase
    .from("students")
    .select("onboarding_complete")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = roleRow?.role ?? "student";

  return Response.json({
    ok: true,
    role,
    dashboard_path: role === "student" && !studentRow?.onboarding_complete ? "/onboarding" : dashboardPathForRole(role),
  });
}
