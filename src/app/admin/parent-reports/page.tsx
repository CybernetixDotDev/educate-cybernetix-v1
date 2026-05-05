import { ParentReportsClient } from "./ParentReportsClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

type StudentRow = {
  id: string;
  display_name: string;
  email: string | null;
};

async function ParentReportsContent() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("students").select("id,display_name,email").order("display_name");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <ParentReportsClient students={(data ?? []) as StudentRow[]} />
      </div>
    </main>
  );
}

function Fallback() {
  return <div className="p-8 text-sm text-slate-500">Loading parent report generator...</div>;
}

export default function AdminParentReportsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ParentReportsContent />
    </Suspense>
  );
}
