"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { WeeklySummaryJSON } from "./generateWeeklySummary";

export type SaveWeeklySummaryResult = {
  ok: boolean;
  error: string | null;
};

function weekDateRange(weekNumber: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  start.setUTCDate(start.getUTCDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function validate(summary: WeeklySummaryJSON) {
  const errors: string[] = [];
  if (!summary.student_id) errors.push("student_id is required");
  if (!Number.isFinite(summary.week_number)) errors.push("week_number must be numeric");
  if (!summary.parent_summary.trim()) errors.push("parent_summary is required");
  if (!summary.student_reflection.trim()) errors.push("student_reflection is required");
  return errors;
}

export async function saveWeeklySummary(summary: WeeklySummaryJSON): Promise<SaveWeeklySummaryResult> {
  const errors = validate(summary);
  if (errors.length > 0) {
    return { ok: false, error: errors.join("; ") };
  }

  const { start, end } = weekDateRange(summary.week_number);
  const supabase = createClient(await cookies());
  const { error } = await supabase.from("parent_weekly_summaries").upsert(
    {
      student_id: summary.student_id,
      week_start_date: start,
      week_end_date: end,
      lessons_completed: 0,
      quizzes_completed: 0,
      average_quiz_score: null,
      time_spent_seconds: summary.engagement.minutes * 60,
      achievements_awarded: [],
      highlights: summary.skill_insights.strengths,
      concerns: summary.skill_insights.weaknesses,
      summary,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,week_start_date" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/weekly-summary");
  revalidatePath("/admin/summaries");
  revalidatePath("/parent/dashboard");
  return { ok: true, error: null };
}
