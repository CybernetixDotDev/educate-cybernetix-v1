"use server";

import { generateWeeklySummarySection, type WeeklySummaryInput, type WeeklySummaryResult } from "./generateWeeklySummary";

export async function generateStudentReflection(input: WeeklySummaryInput): Promise<WeeklySummaryResult> {
  try {
    const summary = await generateWeeklySummarySection(input, "student");
    return { ok: true, summary, error: null };
  } catch (error) {
    return { ok: false, summary: null, error: error instanceof Error ? error.message : "Unable to generate student reflection" };
  }
}
