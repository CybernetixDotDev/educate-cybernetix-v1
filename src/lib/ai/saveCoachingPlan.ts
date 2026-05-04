"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { CoachingPlanJSON } from "./generateCoachingPlan";

export type SaveCoachingPlanResult = { ok: boolean; error: string | null };

function validate(plan: CoachingPlanJSON) {
  const errors: string[] = [];
  if (!plan.student_id) errors.push("student_id is required");
  if (!Number.isFinite(plan.week_number)) errors.push("week_number must be numeric");
  if (plan.weekly_plan.length === 0) errors.push("weekly_plan must include at least one item");
  return errors;
}

export async function saveCoachingPlan(plan: CoachingPlanJSON): Promise<SaveCoachingPlanResult> {
  const errors = validate(plan);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("student_coaching_plans").upsert(
    {
      student_id: plan.student_id,
      week_number: plan.week_number,
      coaching_plan: plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,week_number" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coaching");
  return { ok: true, error: null };
}
