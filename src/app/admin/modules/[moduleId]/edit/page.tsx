import { loadModule } from "@/lib/modules/loadModule";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ModuleAuthoringClient } from "./ModuleAuthoringClient";

async function ModuleEditorContent({ moduleId }: { moduleId: string }) {
  const supabase = createClient(await cookies());
  const { module, lessonOptions, exists } = await loadModule(supabase, moduleId);

  return <ModuleAuthoringClient initialModule={module} lessonOptions={lessonOptions} exists={exists} />;
}

function Fallback() {
  return <main className="p-8 text-sm text-slate-500">Loading module editor...</main>;
}

export default async function ModuleEditPage(props: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await props.params;

  return (
    <Suspense fallback={<Fallback />}>
      <ModuleEditorContent moduleId={moduleId} />
    </Suspense>
  );
}
