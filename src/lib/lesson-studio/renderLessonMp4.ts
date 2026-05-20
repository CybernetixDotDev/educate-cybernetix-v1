"use server";

import { requireRole } from "@/lib/auth/roles";
import { runLocalLessonRenderer } from "@/lib/lesson-studio/localLessonRenderer";
import type { LessonGeneratorOutput, LessonRender, LessonStoryboard, LessonStudioActionResult } from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const BUCKET = "lesson-renders";

function pad(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

function srtTime(seconds: number) {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

function vttTime(seconds: number) {
  return srtTime(seconds).replace(",", ".");
}

function sceneRanges(storyboard: LessonStoryboard) {
  let current = 0;
  return storyboard.scenes.map((scene) => {
    const start = current;
    const end = current + scene.duration_seconds;
    current = end;
    return { scene, start, end };
  });
}

function buildVtt(storyboard: LessonStoryboard) {
  const lines = ["WEBVTT", ""];
  sceneRanges(storyboard).forEach(({ scene, start, end }) => {
    lines.push(`${vttTime(start)} --> ${vttTime(end)}`);
    lines.push(scene.narration_text);
    lines.push("");
  });
  return lines.join("\n");
}

function buildSrt(storyboard: LessonStoryboard) {
  const lines: string[] = [];
  sceneRanges(storyboard).forEach(({ scene, start, end }, index) => {
    lines.push(String(index + 1));
    lines.push(`${srtTime(start)} --> ${srtTime(end)}`);
    lines.push(scene.narration_text);
    lines.push("");
  });
  return lines.join("\n");
}

function buildTranscript(storyboard: LessonStoryboard) {
  return storyboard.scenes
    .map((scene, index) => [`Scene ${index + 1}: ${scene.title}`, scene.narration_text].join("\n"))
    .join("\n\n");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function buildThumbnailSvg(storyboard: LessonStoryboard, lesson: LessonGeneratorOutput) {
  const title = escapeXml(storyboard.title || "Lesson");
  const subtitle = escapeXml(lesson.objective[0] ?? "A guided Cyber Mentor lesson");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#f7faf9"/>
  <rect x="72" y="72" width="1136" height="576" rx="40" fill="#ffffff" stroke="#dbe7e4" stroke-width="2"/>
  <circle cx="164" cy="160" r="44" fill="#0f766e"/>
  <text x="164" y="174" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">C</text>
  <text x="240" y="154" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f766e">Cyber Mentor Lesson</text>
  <text x="120" y="330" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${title}</text>
  <text x="120" y="405" font-family="Arial, sans-serif" font-size="28" fill="#475569">${subtitle}</text>
  <rect x="120" y="520" width="310" height="64" rx="32" fill="#0f766e"/>
  <text x="275" y="562" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">Start Learning</text>
</svg>`;
}

function renderManifest(storyboard: LessonStoryboard, lesson: LessonGeneratorOutput, basePath: string) {
  return {
    bucket: BUCKET,
    base_path: basePath,
    title: storyboard.title,
    total_duration_seconds: storyboard.total_duration_seconds,
    mp4_output_path: `${basePath}/lesson.mp4`,
    thumbnail_path: `${basePath}/thumbnail.svg`,
    captions_vtt_path: `${basePath}/captions.vtt`,
    captions_srt_path: `${basePath}/captions.srt`,
    transcript_path: `${basePath}/transcript.txt`,
    tts_narration: storyboard.scenes.map((scene) => ({
      scene_id: scene.scene_id,
      text: scene.narration_text,
      duration_seconds: scene.duration_seconds,
    })),
    slide_manifest: storyboard.scenes.map((scene) => ({
      scene_id: scene.scene_id,
      title: scene.title,
      visual_type: scene.visual_type,
      duration_seconds: scene.duration_seconds,
      on_screen_text: scene.on_screen_text,
      animation_style: scene.animation_style,
      asset_references: scene.asset_references,
    })),
    quiz_prompts: lesson.quiz.questions.map((question) => question.question),
    renderer_webhook_called: false,
  };
}

async function enqueueRenderJob(supabase: ReturnType<typeof createClient>, renderId: string) {
  const { error } = await supabase
    .from("lesson_render_queue")
    .insert({
      render_id: renderId,
      status: "pending",
      run_after: new Date().toISOString(),
      logs: [
        {
          event: "queued",
          message: "Render job queued from Admin Lesson Studio.",
          timestamp: new Date().toISOString(),
        },
      ],
    });

  if (error) throw new Error(error.message);
}

function toLessonRender(row: Record<string, unknown>): LessonRender {
  return {
    render_id: String(row.id),
    storyboard_id: typeof row.storyboard_id === "string" ? row.storyboard_id : null,
    generated_lesson_id: typeof row.generated_lesson_id === "string" ? row.generated_lesson_id : null,
    status: row.status as LessonRender["status"],
    mp4_url: typeof row.mp4_url === "string" ? row.mp4_url : null,
    thumbnail_url: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    captions_vtt_url: typeof row.captions_vtt_url === "string" ? row.captions_vtt_url : null,
    captions_srt_url: typeof row.captions_srt_url === "string" ? row.captions_srt_url : null,
    transcript_url: typeof row.transcript_url === "string" ? row.transcript_url : null,
    manifest_url: typeof row.manifest_url === "string" ? row.manifest_url : null,
    error_message: typeof row.error_message === "string" ? row.error_message : null,
    render_json: row.render_json as LessonRender["render_json"],
  };
}

async function uploadText(
  supabase: ReturnType<typeof createClient>,
  path: string,
  body: string,
  contentType: string,
) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob([body], { type: contentType }), {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function callRendererWebhook(payload: Record<string, unknown>) {
  const url = process.env.LESSON_RENDERER_WEBHOOK_URL;
  if (!url) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LESSON_RENDERER_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.LESSON_RENDERER_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Renderer webhook failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }

  return await response.json() as {
    mp4_url?: string;
    status?: LessonRender["status"];
    error_message?: string;
  };
}

export async function renderLessonMp4(
  storyboard: LessonStoryboard,
  lesson: LessonGeneratorOutput,
): Promise<LessonStudioActionResult<LessonRender>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  if (!storyboard.scenes.length) {
    return { ok: false, data: null, error: "Generate a storyboard before rendering MP4 assets." };
  }

  try {
    const supabase = createClient(await cookies());
    const { data: userResult } = await supabase.auth.getUser();
    const renderId = crypto.randomUUID();
    const basePath = `${lesson.generated_lesson_id ?? "unlinked"}/${renderId}`;
    const manifest = renderManifest(storyboard, lesson, basePath);

    const [captionsVttUrl, captionsSrtUrl, transcriptUrl, thumbnailUrl, manifestUrl] = await Promise.all([
      uploadText(supabase, `${basePath}/captions.vtt`, buildVtt(storyboard), "text/vtt"),
      uploadText(supabase, `${basePath}/captions.srt`, buildSrt(storyboard), "text/plain"),
      uploadText(supabase, `${basePath}/transcript.txt`, buildTranscript(storyboard), "text/plain"),
      uploadText(supabase, `${basePath}/thumbnail.svg`, buildThumbnailSvg(storyboard, lesson), "image/svg+xml"),
      uploadText(supabase, `${basePath}/manifest.json`, JSON.stringify(manifest, null, 2), "application/json"),
    ]);

    const { error: insertError } = await supabase
      .from("lesson_renders")
      .insert({
        id: renderId,
        storyboard_id: storyboard.storyboard_id ?? null,
        generated_lesson_id: lesson.generated_lesson_id ?? null,
        status: "assets_ready",
        render_json: manifest,
        thumbnail_url: thumbnailUrl,
        captions_vtt_url: captionsVttUrl,
        captions_srt_url: captionsSrtUrl,
        transcript_url: transcriptUrl,
        manifest_url: manifestUrl,
        created_by: userResult.user?.id ?? null,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    const rendererMode = process.env.LESSON_RENDERER_MODE ?? "queue";
    if (rendererMode === "queue") {
      await enqueueRenderJob(supabase, renderId);
      revalidatePath("/admin/ai-lesson-generator");
      return { ok: true, data: toLessonRender({
        id: renderId,
        storyboard_id: storyboard.storyboard_id ?? null,
        generated_lesson_id: lesson.generated_lesson_id ?? null,
        status: "queued",
        mp4_url: null,
        thumbnail_url: thumbnailUrl,
        captions_vtt_url: captionsVttUrl,
        captions_srt_url: captionsSrtUrl,
        transcript_url: transcriptUrl,
        manifest_url: manifestUrl,
        error_message: null,
        render_json: manifest,
      }), error: null };
    }

    if (rendererMode === "local") {
      const render = await runLocalLessonRenderer(supabase, renderId, manifest);
      revalidatePath("/admin/ai-lesson-generator");
      return { ok: true, data: render, error: null };
    }

    let finalStatus: LessonRender["status"] = "assets_ready";
    let mp4Url: string | null = null;
    let errorMessage: string | null = null;
    let rendererWebhookCalled = false;
    try {
      const rendererResult = await callRendererWebhook({
        render_id: renderId,
        storyboard_id: storyboard.storyboard_id ?? null,
        generated_lesson_id: lesson.generated_lesson_id ?? null,
        manifest_url: manifestUrl,
        manifest,
      });

      if (rendererResult) {
        rendererWebhookCalled = true;
        finalStatus = rendererResult.status ?? (rendererResult.mp4_url ? "completed" : "processing");
        mp4Url = rendererResult.mp4_url ?? null;
        errorMessage = rendererResult.error_message ?? null;
      }
    } catch (error) {
      rendererWebhookCalled = true;
      finalStatus = "failed";
      errorMessage = error instanceof Error ? error.message : "Renderer webhook failed.";
    }

    const renderJson = { ...manifest, renderer_webhook_called: rendererWebhookCalled };
    const { data: updatedRow, error: updateError } = await supabase
      .from("lesson_renders")
      .update({
        status: finalStatus,
        render_json: renderJson,
        mp4_url: mp4Url,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", renderId)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/admin/ai-lesson-generator");

    return { ok: true, data: toLessonRender(updatedRow as Record<string, unknown>), error: null };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "MP4 render pipeline failed.",
    };
  }
}
