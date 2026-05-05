"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ParentReportJSON } from "./generateParentReport";

export type SaveParentReportResult = {
  ok: boolean;
  error: string | null;
};

function validate(report: ParentReportJSON) {
  const errors: string[] = [];
  if (!report.student_id) errors.push("student_id is required");
  if (!/^\d{4}-\d{2}$/.test(report.month)) errors.push("month must use YYYY-MM format");
  if (!report.engagement_summary.consistency_notes.trim()) errors.push("engagement consistency notes are required");
  return errors;
}

export async function saveParentReport(report: ParentReportJSON): Promise<SaveParentReportResult> {
  const errors = validate(report);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("parent_monthly_reports").upsert(
    {
      student_id: report.student_id,
      month: report.month,
      report_json: report,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,month" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/parent-reports");
  return { ok: true, error: null };
}
