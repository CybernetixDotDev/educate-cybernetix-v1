"use server";

import { generateCoachingSection, type CoachingInput, type CoachingResult } from "./generateCoachingPlan";

export async function generateMotivation(input: CoachingInput): Promise<CoachingResult> {
  try {
    const plan = await generateCoachingSection(input, "motivation");
    return { ok: true, plan, error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate motivation" };
  }
}
