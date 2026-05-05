import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { NextResponse } from "next/server";

const STUDENT_PROTECTED_PREFIXES = [
  "/dashboard",
  "/learn",
  "/mentor",
  "/project-mentor",
  "/debugger",
  "/code-review",
  "/presentation-coach",
  "/certificates",
  "/growth-timeline",
];

function isStudentProtectedPath(pathname: string) {
  return STUDENT_PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return response();
  }

  const pathname = request.nextUrl.pathname;
  const [{ data: roleRow }, { data: student }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle(),
    supabase.from("students").select("onboarding_complete").eq("user_id", data.user.id).maybeSingle(),
  ]);

  const role = roleRow?.role ?? "student";
  const onboardingComplete = student?.onboarding_complete === true;

  if (role === "student" && !onboardingComplete && isStudentProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (role === "student" && onboardingComplete && pathname === "/onboarding") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
