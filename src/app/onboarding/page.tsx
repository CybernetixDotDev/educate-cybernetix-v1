import { OnboardingClient } from "@/app/onboarding/OnboardingClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function displayNameFromUser(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "";
}

export default async function OnboardingPage() {
  const supabase = createClient(await cookies());
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    redirect("/auth?next=/onboarding");
  }

  const { data: student } = await supabase
    .from("students")
    .select("display_name, grade_level, learning_goals, parent_email, project_preference, onboarding_complete")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (student?.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <OnboardingClient
      initialData={{
        display_name: student?.display_name ?? displayNameFromUser(userResult.user),
        grade_level: student?.grade_level ?? "",
        learning_goals: Array.isArray(student?.learning_goals) ? student.learning_goals : [],
        parent_email: student?.parent_email ?? "",
        project_preference: student?.project_preference ?? "",
      }}
    />
  );
}

