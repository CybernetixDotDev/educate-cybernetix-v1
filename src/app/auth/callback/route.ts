import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("error", "Missing auth callback code");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const now = new Date().toISOString();
    await supabase.from("students").upsert(
      {
        user_id: data.user.id,
        display_name: displayNameFromUser(data.user),
        email: data.user.email ?? null,
        last_active_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

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

    if (next === "/dashboard") {
      redirectUrl.pathname =
        (roleRow?.role ?? "student") === "student" && !studentRow?.onboarding_complete
          ? "/onboarding"
          : dashboardPathForRole(roleRow?.role);
      redirectUrl.search = "";
    }
  }

  return NextResponse.redirect(redirectUrl);
}
