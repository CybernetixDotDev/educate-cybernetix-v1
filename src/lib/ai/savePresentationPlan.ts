"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { PresentationPlan } from "./generatePresentation";

export type SavePresentationPlanResult = {
  ok: boolean;
  error: string | null;
};

function validate(plan: PresentationPlan) {
  const errors: string[] = [];
  if (!plan.student_id) errors.push("student_id is required");
  if (!plan.project_id) errors.push("project_id is required");
  if (plan.slide_outline.length === 0) errors.push("slide_outline needs at least one slide");
  if (plan.script.length === 0) errors.push("script needs at least one slide note");
  return errors;
}

export async function savePresentationPlan(plan: PresentationPlan): Promise<SavePresentationPlanResult> {
  const errors = validate(plan);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("presentation_plans").upsert(
    {
      student_id: plan.student_id,
      project_id: plan.project_id,
      presentation_plan: plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,project_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/presentation-coach");
  return { ok: true, error: null };
}
