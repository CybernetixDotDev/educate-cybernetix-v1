"use server";

import { generatePresentationSection, type PresentationInput, type PresentationResult } from "./generatePresentation";

export async function generateQAPrep(input: PresentationInput): Promise<PresentationResult> {
  try {
    const plan = await generatePresentationSection(input, "qa");
    return { ok: true, plan, error: null };
  } catch (error) {
    return { ok: false, plan: null, error: error instanceof Error ? error.message : "Unable to generate Q&A prep" };
  }
}
