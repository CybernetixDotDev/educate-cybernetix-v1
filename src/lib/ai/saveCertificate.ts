"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { CertificateJSON } from "./generateCertificate";

export type SaveCertificateResult = {
  ok: boolean;
  error: string | null;
};

function validate(certificate: CertificateJSON) {
  const errors: string[] = [];
  if (!certificate.student_id) errors.push("student_id is required");
  if (!certificate.project_id) errors.push("project_id is required");
  if (!certificate.certificate_text.title.trim()) errors.push("certificate title is required");
  if (!certificate.project_summary.title.trim()) errors.push("project title is required");
  return errors;
}

export async function saveCertificate(certificate: CertificateJSON): Promise<SaveCertificateResult> {
  const errors = validate(certificate);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("student_certificates").upsert(
    {
      student_id: certificate.student_id,
      project_id: certificate.project_id,
      certificate_json: certificate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,project_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/certificates");
  revalidatePath("/admin/certificates");
  return { ok: true, error: null };
}
