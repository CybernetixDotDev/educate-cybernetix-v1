import { requireRole } from "@/lib/auth/roles";
import { runLocalLessonRenderer } from "@/lib/lesson-studio/localLessonRenderer";
import type { LessonRender } from "@/lib/lesson-studio/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RenderBody = {
  render_id?: string;
};

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

async function authorizedSupabase(request: Request) {
  const secret = process.env.LESSON_RENDERER_SECRET;
  const token = bearerToken(request);

  if (secret && token === secret) {
    return createAdminClient();
  }

  const role = await requireRole(["admin"]);
  if (!role) return null;

  return createClient(await cookies());
}

export async function POST(request: Request) {
  try {
    const supabase = await authorizedSupabase(request);
    if (!supabase) {
      return NextResponse.json({ error: "Admin or renderer secret access is required." }, { status: 403 });
    }

    const body = await request.json() as RenderBody;
    if (!body.render_id) {
      return NextResponse.json({ error: "render_id is required." }, { status: 400 });
    }

    const { data: renderRow, error } = await supabase
      .from("lesson_renders")
      .select("*")
      .eq("id", body.render_id)
      .single();

    if (error || !renderRow) {
      return NextResponse.json({ error: error?.message ?? "Render was not found." }, { status: 404 });
    }

    const render = await runLocalLessonRenderer(
      supabase,
      body.render_id,
      renderRow.render_json as LessonRender["render_json"],
    );

    return NextResponse.json({ render });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lesson renderer failed." },
      { status: 500 },
    );
  }
}
