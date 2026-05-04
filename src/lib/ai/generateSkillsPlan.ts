"use server";

import { generateCoachingSection, type CoachingInput, type CoachingResult } from "./generateCoachingPlan";

export async function generateSkillsPlan(input: CoachingInput): Promise<CoachingResult> {
  try {
    const plan = await generateCoachingSection(input, "skills");
    return { ok: true, plan, error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate skills plan" };
  }
}
