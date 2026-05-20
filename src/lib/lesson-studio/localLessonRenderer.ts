import "server-only";

import type { LessonRender } from "@/lib/lesson-studio/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BUCKET = "lesson-renders";

type SupabaseLike = SupabaseClient;

type RenderManifest = LessonRender["render_json"] & {
  mp4_output_path?: string;
  thumbnail_path?: string;
  captions_vtt_path?: string;
  captions_srt_path?: string;
  transcript_path?: string;
  slide_asset_urls?: string[];
  tts_audio_urls?: string[];
  local_renderer_completed?: boolean;
  local_renderer_error?: string | null;
};

function ffmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function wrapText(value: string, maxLength: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 7);
}

function sceneSvg(scene: RenderManifest["slide_manifest"][number], index: number) {
  const title = escapeXml(scene.title || `Scene ${index + 1}`);
  const eyebrow = escapeXml(scene.visual_type.replaceAll("_", " "));
  const lines = wrapText(scene.on_screen_text || scene.title, 44);
  const accent = scene.visual_type === "quiz_prompt_slide" ? "#7c3aed" : scene.visual_type === "recap_slide" ? "#0f766e" : "#2563eb";
  const lineMarkup = lines
    .map((line, lineIndex) => `<text x="104" y="${310 + lineIndex * 56}" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#0f172a">${escapeXml(line)}</text>`)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#f7faf9"/>
  <rect x="64" y="56" width="1152" height="608" rx="38" fill="#ffffff" stroke="#dbe7e4" stroke-width="2"/>
  <rect x="96" y="92" width="210" height="44" rx="22" fill="${accent}"/>
  <text x="201" y="121" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#ffffff" letter-spacing="2">${eyebrow.toUpperCase()}</text>
  <text x="104" y="202" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="#0f172a">${title}</text>
  ${lineMarkup}
  <circle cx="1098" cy="536" r="64" fill="#ccfbf1"/>
  <text x="1098" y="554" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="900" fill="#0f766e">${index + 1}</text>
  <text x="104" y="606" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0f766e">Cyber Mentor</text>
</svg>`;
}

async function uploadBytes(supabase: SupabaseLike, filePath: string, body: Uint8Array | Blob, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
}

async function createSilentAudio(filePath: string, durationSeconds: number) {
  await execFileAsync(ffmpegPath(), [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-t",
    String(Math.max(1, durationSeconds)),
    "-c:a",
    "aac",
    filePath,
  ]);
}

async function generateTtsAudio(text: string, fallbackPath: string, durationSeconds: number) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_PROVIDER_API_KEY;
  const useSilent = process.env.LESSON_RENDERER_TTS === "silent" || !apiKey;

  if (useSilent) {
    await createSilentAudio(fallbackPath, durationSeconds);
    return fallbackPath;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LESSON_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: process.env.LESSON_TTS_VOICE ?? "alloy",
        input: text.slice(0, 4096),
        response_format: "mp3",
        instructions: "Warm, clear, supportive teaching voice for a teen learning platform. Clearly disclose this is an AI-generated narration.",
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed with ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }

    const audioPath = fallbackPath.replace(/\.m4a$/i, ".mp3");
    await writeFile(audioPath, Buffer.from(await response.arrayBuffer()));
    return audioPath;
  } catch (error) {
    if (process.env.LESSON_RENDERER_ALLOW_SILENT_FALLBACK === "false") {
      throw error;
    }
    await createSilentAudio(fallbackPath, durationSeconds);
    return fallbackPath;
  }
}

async function renderScene(slidePath: string, audioPath: string, outputPath: string, durationSeconds: number) {
  await execFileAsync(ffmpegPath(), [
    "-y",
    "-loop",
    "1",
    "-t",
    String(Math.max(1, durationSeconds)),
    "-i",
    slidePath,
    "-i",
    audioPath,
    "-vf",
    "scale=1280:720,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    outputPath,
  ]);
}

async function concatScenes(scenePaths: string[], outputPath: string, workDir: string) {
  const listPath = path.join(workDir, "scenes.txt");
  const listBody = scenePaths.map((scenePath) => `file '${scenePath.replaceAll("'", "'\\''")}'`).join("\n");
  await writeFile(listPath, listBody);

  await execFileAsync(ffmpegPath(), [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    outputPath,
  ]);
}

export async function runLocalLessonRenderer(
  supabase: SupabaseLike,
  renderId: string,
  manifest: RenderManifest,
): Promise<LessonRender> {
  const basePath = manifest.base_path;
  const workDir = await mkdtemp(path.join(tmpdir(), "lesson-render-"));
  const slideUrls: string[] = [];
  const audioUrls: string[] = [];

  try {
    await supabase
      .from("lesson_renders")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", renderId)
      .select("id")
      .single();

    const sceneVideos: string[] = [];

    for (const [index, scene] of manifest.slide_manifest.entries()) {
      const duration = Math.max(2, Number(scene.duration_seconds) || 5);
      const sceneId = scene.scene_id || `scene-${index + 1}`;
      const slidePath = path.join(workDir, `${sceneId}.svg`);
      const audioPath = path.join(workDir, `${sceneId}.m4a`);
      const sceneVideoPath = path.join(workDir, `${sceneId}.mp4`);
      const narration = manifest.tts_narration.find((item) => item.scene_id === scene.scene_id)?.text ?? scene.title;

      await writeFile(slidePath, sceneSvg(scene, index));
      const finalAudioPath = await generateTtsAudio(narration, audioPath, duration);
      await renderScene(slidePath, finalAudioPath, sceneVideoPath, duration);

      slideUrls.push(await uploadBytes(supabase, `${basePath}/slides/${sceneId}.svg`, new Blob([await readFile(/* turbopackIgnore: true */ slidePath)], { type: "image/svg+xml" }), "image/svg+xml"));
      audioUrls.push(await uploadBytes(supabase, `${basePath}/audio/${path.basename(finalAudioPath)}`, await readFile(/* turbopackIgnore: true */ finalAudioPath), finalAudioPath.endsWith(".mp3") ? "audio/mpeg" : "audio/mp4"));
      sceneVideos.push(sceneVideoPath);
    }

    const mp4Path = path.join(workDir, "lesson.mp4");
    await concatScenes(sceneVideos, mp4Path, workDir);
    const mp4Url = await uploadBytes(supabase, manifest.mp4_output_path ?? `${basePath}/lesson.mp4`, await readFile(/* turbopackIgnore: true */ mp4Path), "video/mp4");
    const nextManifest = {
      ...manifest,
      slide_asset_urls: slideUrls,
      tts_audio_urls: audioUrls,
      local_renderer_completed: true,
      local_renderer_error: null,
    };

    const { data, error } = await supabase
      .from("lesson_renders")
      .update({
        status: "completed",
        mp4_url: mp4Url,
        render_json: nextManifest,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", renderId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    const row = data as Record<string, unknown>;

    return {
      render_id: String(row.id),
      storyboard_id: typeof row.storyboard_id === "string" ? row.storyboard_id : null,
      generated_lesson_id: typeof row.generated_lesson_id === "string" ? row.generated_lesson_id : null,
      status: "completed",
      mp4_url: typeof row.mp4_url === "string" ? row.mp4_url : null,
      thumbnail_url: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
      captions_vtt_url: typeof row.captions_vtt_url === "string" ? row.captions_vtt_url : null,
      captions_srt_url: typeof row.captions_srt_url === "string" ? row.captions_srt_url : null,
      transcript_url: typeof row.transcript_url === "string" ? row.transcript_url : null,
      manifest_url: typeof row.manifest_url === "string" ? row.manifest_url : null,
      error_message: null,
      render_json: nextManifest,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local renderer failed.";
    await supabase
      .from("lesson_renders")
      .update({
        status: "failed",
        render_json: { ...manifest, slide_asset_urls: slideUrls, tts_audio_urls: audioUrls, local_renderer_completed: false, local_renderer_error: message },
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", renderId)
      .select("id")
      .single();
    throw new Error(message);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
