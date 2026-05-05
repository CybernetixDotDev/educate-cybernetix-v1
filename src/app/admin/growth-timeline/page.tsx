import { GrowthTimelineAdminClient } from "./GrowthTimelineAdminClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

type StudentRow = { id: string; display_name: string; email: string | null };

async function AdminGrowthTimelineContent() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from("students").select("id,display_name,email").order("display_name");

  return <GrowthTimelineAdminClient students={(data ?? []) as StudentRow[]} />;
}

function Fallback() {
  return <div className="p-8 text-sm text-slate-500">Loading growth timeline generator...</div>;
}

export default function AdminGrowthTimelinePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminGrowthTimelineContent />
    </Suspense>
  );
}
