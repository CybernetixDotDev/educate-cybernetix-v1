"use server";

import { generateCertificateSection, type CertificateInput, type CertificateResult } from "./generateCertificate";

export async function generateSkillMap(input: CertificateInput): Promise<CertificateResult> {
  try {
    const certificate = await generateCertificateSection(input, "skill_map");
    return { ok: true, certificate, error: null };
  } catch (error) {
    return { ok: false, certificate: null, error: error instanceof Error ? error.message : "Unable to generate skill map" };
  }
}
