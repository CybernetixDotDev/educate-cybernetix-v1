"use server";

import { generateParentReportSection, type ParentReportInput, type ParentReportResult } from "./generateParentReport";

export async function generateRecommendations(input: ParentReportInput): Promise<ParentReportResult> {
  try {
    const report = await generateParentReportSection(input, "recommendations");
    return { ok: true, report, error: null };
  } catch (error) {
    return { ok: false, report: null, error: error instanceof Error ? error.message : "Unable to generate recommendations" };
  }
}
