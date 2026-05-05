"use server";

import { generateGrowthTimelineSection, type GrowthTimelineInput, type GrowthTimelineResult } from "./generateGrowthTimeline";

export async function generateMilestones(input: GrowthTimelineInput): Promise<GrowthTimelineResult> {
  try {
    const timeline = await generateGrowthTimelineSection(input, "milestones");
    return { ok: true, timeline, error: null };
  } catch (error) {
    return { ok: false, timeline: null, error: error instanceof Error ? error.message : "Unable to generate milestones" };
  }
}
