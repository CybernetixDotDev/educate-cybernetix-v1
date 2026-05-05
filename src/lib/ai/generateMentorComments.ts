"use server";

import { generateCertificateSection, type CertificateInput, type CertificateResult } from "./generateCertificate";

export async function generateMentorComments(input: CertificateInput): Promise<CertificateResult> {
  try {
    const certificate = await generateCertificateSection(input, "mentor_comments");
    return { ok: true, certificate, error: null };
  } catch (error) {
    return { ok: false, certificate: null, error: error instanceof Error ? error.message : "Unable to generate mentor comments" };
  }
}
