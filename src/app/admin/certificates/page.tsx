import { CertificateAdminClient } from "./CertificateAdminClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

type StudentRow = {
  id: string;
  display_name: string;
  email: string | null;
};

type ProjectRow = {
  id: string;
  student_id: string;
  title: string;
};

async function AdminCertificatesContent() {
  const supabase = createClient(await cookies());
  const [{ data: students }, { data: projects }] = await Promise.all([
    supabase.from("students").select("id,display_name,email").order("display_name"),
    supabase.from("student_projects").select("id,student_id,title").order("updated_at", { ascending: false }),
  ]);

  return (
    <CertificateAdminClient
      students={(students ?? []) as StudentRow[]}
      projects={(projects ?? []) as ProjectRow[]}
    />
  );
}

function Fallback() {
  return <div className="p-8 text-sm text-slate-500">Loading certificate generator...</div>;
}

export default function AdminCertificatesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminCertificatesContent />
    </Suspense>
  );
}
