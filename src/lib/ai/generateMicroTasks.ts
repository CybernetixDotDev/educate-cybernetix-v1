"use server";

import { generateCoachingSection, type CoachingInput, type CoachingResult } from "./generateCoachingPlan";

export async function generateMicroTasks(input: CoachingInput): Promise<CoachingResult> {
  try {
    const plan = await generateCoachingSection(input, "micro_tasks");
    return { ok: true, plan, error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate micro-tasks" };
  }
}
