"use server";

import { generatePresentationSection, type PresentationInput, type PresentationResult } from "./generatePresentation";

export async function generatePresentationScript(input: PresentationInput): Promise<PresentationResult> {
  try {
    const plan = await generatePresentationSection(input, "script");
    return { ok: true, plan, error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate presentation script" };
  }
}
