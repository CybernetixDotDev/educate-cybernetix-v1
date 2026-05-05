"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { GrowthTimelineJSON } from "./generateGrowthTimeline";

export type SaveGrowthTimelineResult = { ok: boolean; error: string | null };

function validate(timeline: GrowthTimelineJSON) {
  const errors: string[] = [];
  if (!timeline.student_id) errors.push("student_id is required");
  if (timeline.milestones.length === 0) errors.push("at least one milestone is required");
  return errors;
}

export async function saveGrowthTimeline(timeline: GrowthTimelineJSON): Promise<SaveGrowthTimelineResult> {
  const errors = validate(timeline);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("student_growth_timelines").upsert(
    {
      student_id: timeline.student_id,
      timeline_json: timeline,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/growth-timeline");
  revalidatePath("/admin/growth-timeline");
  return { ok: true, error: null };
}
