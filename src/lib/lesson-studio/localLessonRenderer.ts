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

  if (error && contentType.startsWith("audio/")) {
    const fallback = await supabase.storage.from(BUCKET).upload(filePath.replace(/\.[^.]+$/, ".bin"), body, {
      contentType: "application/octet-stream",
      upsert: true,
    });
    if (fallback.error) throw new Error(fallback.error.message);
    return supabase.storage.from(BUCKET).getPublicUrl(filePath.replace(/\.[^.]+$/, ".bin")).data.publicUrl;
  }

  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
}

async function uploadOptionalAudio(supabase: SupabaseLike, filePath: string, body: Uint8Array, contentType: string) {
  try {
    return await uploadBytes(supabase, filePath, body, contentType);
  } catch (error) {
    console.warn("[lesson-renderer] audio asset upload skipped", {
      filePath,
      contentType,
      error: error instanceof Error ? error.message : "Unknown upload error",
    });
    return null;
  }
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

function ffmpegText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

function filterText(value: string, maxLength = 48) {
  return ffmpegText(value.replace(/\s+/g, " ").trim().slice(0, maxLength));
}

function iconGlyph(icon?: string) {
  switch (icon) {
    case "browser":
      return "WEB";
    case "dns":
      return "DNS";
    case "server":
      return "SRV";
    case "database":
      return "DB";
    case "code":
      return "</>";
    case "checkpoint":
      return "OK";
    case "project":
      return "DIY";
    case "mentor":
      return "AI";
    default:
      return "IDEA";
  }
}

function visualElements(scene: RenderManifest["slide_manifest"][number]) {
  if (Array.isArray(scene.visual_elements) && scene.visual_elements.length > 0) {
    return scene.visual_elements.slice(0, 7);
  }

  const lines = wrapText(scene.on_screen_text || scene.title, 32).slice(0, 5);
  return lines.map((line, index) => ({
    type: "card" as const,
    label: index === 0 ? scene.title : `Step ${index + 1}`,
    detail: line,
    icon: scene.visual_type === "code_slide" ? "code" as const : "checkpoint" as const,
  }));
}

function commonFrame(scene: RenderManifest["slide_manifest"][number], index: number, accent = "0f766e") {
  const title = filterText(scene.title || `Scene ${index + 1}`, 58);
  return [
    "drawbox=x=0:y=0:w=1280:h=720:color=f7faf9:t=fill",
    "drawbox=x=54:y=46:w=1172:h=628:color=white:t=fill",
    `drawbox=x=86:y=82:w=250:h=48:color=${accent}:t=fill`,
    "drawtext=text='CYBER MENTOR':x=112:y=99:fontsize=18:fontcolor=white",
    `drawtext=text='${title}':x=86:y=178:fontsize=48:fontcolor=0f172a`,
    `drawtext=text='${index + 1}':x=1130:y=596:fontsize=44:fontcolor=${accent}`,
  ];
}

function titleFilters(scene: RenderManifest["slide_manifest"][number], index: number) {
  const lines = wrapText(scene.on_screen_text || scene.title, 38).slice(0, 3);
  return [
    ...commonFrame(scene, index, "0f766e"),
    "drawbox=x=820:y=178:w=300:h=300:color=ccfbf1:t=fill",
    "drawtext=text='AI':x=928:y=352:fontsize=92:fontcolor=0f766e",
    ...lines.map((line, lineIndex) => `drawtext=text='${filterText(line, 50)}':x=86:y=${300 + lineIndex * 58}:fontsize=38:fontcolor=0f172a`),
    "drawbox=x=86:y=542:w=330:h=58:color=0f766e:t=fill",
    "drawtext=text='Start small. Build real.':x=116:y=579:fontsize=24:fontcolor=white",
    "format=yuv420p",
  ];
}

function diagramFilters(scene: RenderManifest["slide_manifest"][number], index: number) {
  const elements = visualElements(scene).filter((item) => item.type !== "arrow").slice(0, 4);
  const slots = [
    { x: 112, y: 330 },
    { x: 382, y: 330 },
    { x: 652, y: 330 },
    { x: 922, y: 330 },
  ];
  const filters = [...commonFrame(scene, index, "2563eb")];

  elements.forEach((element, elementIndex) => {
    const slot = slots[elementIndex] ?? slots[0];
    filters.push(`drawbox=x=${slot.x}:y=${slot.y}:w=190:h=150:color=eff6ff:t=fill`);
    filters.push(`drawbox=x=${slot.x + 48}:y=${slot.y - 54}:w=94:h=94:color=2563eb:t=fill`);
    filters.push(`drawtext=text='${filterText(iconGlyph(element.icon), 8)}':x=${slot.x + 66}:y=${slot.y + 2}:fontsize=30:fontcolor=white`);
    filters.push(`drawtext=text='${filterText(element.label, 18)}':x=${slot.x + 22}:y=${slot.y + 72}:fontsize=26:fontcolor=0f172a`);
    filters.push(`drawtext=text='${filterText(element.detail ?? "", 22)}':x=${slot.x + 22}:y=${slot.y + 112}:fontsize=16:fontcolor=475569`);
    if (elementIndex < elements.length - 1) {
      filters.push(`drawbox=x=${slot.x + 198}:y=${slot.y + 72}:w=72:h=8:color=14b8a6:t=fill`);
      filters.push(`drawtext=text='>':x=${slot.x + 260}:y=${slot.y + 95}:fontsize=28:fontcolor=14b8a6`);
    }
  });

  filters.push("drawtext=text='Watch the path. Each arrow is one small step.':x=112:y=560:fontsize=24:fontcolor=0f766e");
  filters.push("format=yuv420p");
  return filters;
}

function cardFilters(scene: RenderManifest["slide_manifest"][number], index: number, accent = "0f766e") {
  const elements = visualElements(scene).slice(0, 4);
  const filters = [...commonFrame(scene, index, accent)];

  elements.forEach((element, elementIndex) => {
    const y = 270 + elementIndex * 86;
    filters.push(`drawbox=x=104:y=${y}:w=760:h=64:color=f1f5f9:t=fill`);
    filters.push(`drawbox=x=104:y=${y}:w=10:h=64:color=${accent}:t=fill`);
    filters.push(`drawtext=text='${filterText(element.label, 34)}':x=132:y=${y + 26}:fontsize=24:fontcolor=0f172a`);
    filters.push(`drawtext=text='${filterText(element.detail ?? "", 62)}':x=132:y=${y + 52}:fontsize=16:fontcolor=475569`);
  });

  filters.push(`drawbox=x=926:y=280:w=170:h=170:color=ccfbf1:t=fill`);
  filters.push(`drawtext=text='${scene.video_kind === "task" ? "TASK" : "GO"}':x=974:y=382:fontsize=34:fontcolor=0f766e`);
  filters.push("format=yuv420p");
  return filters;
}

function codeFilters(scene: RenderManifest["slide_manifest"][number], index: number) {
  const lines = wrapText(scene.on_screen_text || scene.title, 46).slice(0, 6);
  return [
    ...commonFrame(scene, index, "7c3aed"),
    "drawbox=x=112:y=270:w=820:h=320:color=111827:t=fill",
    "drawbox=x=112:y=270:w=820:h=42:color=1f2937:t=fill",
    "drawtext=text='lesson-demo.html':x=142:y=296:fontsize=18:fontcolor=e5e7eb",
    ...lines.map((line, lineIndex) => `drawtext=text='${filterText(line, 58)}':x=148:y=${360 + lineIndex * 36}:fontsize=24:fontcolor=d1fae5`),
    "drawbox=x=980:y=330:w=130:h=130:color=ede9fe:t=fill",
    "drawtext=text='</>':x=1014:y=410:fontsize=36:fontcolor=7c3aed",
    "format=yuv420p",
  ];
}

function drawTextFilter(scene: RenderManifest["slide_manifest"][number], index: number) {
  if (scene.visual_type === "title_slide") return titleFilters(scene, index).join(",");
  if (scene.visual_type === "diagram_slide") return diagramFilters(scene, index).join(",");
  if (scene.visual_type === "code_slide") return codeFilters(scene, index).join(",");
  if (scene.visual_type === "checklist_slide") return cardFilters(scene, index, "0f766e").join(",");
  if (scene.visual_type === "quiz_prompt_slide") return cardFilters(scene, index, "7c3aed").join(",");
  if (scene.visual_type === "recap_slide") return cardFilters(scene, index, "0f766e").join(",");

  return cardFilters(scene, index, "2563eb").join(",");
}

function introSceneIndexes(scenes: RenderManifest["slide_manifest"]) {
  return scenes.length > 0 ? [0] : [];
}

function lessonSceneIndexes(scenes: RenderManifest["slide_manifest"]) {
  const firstTaskIndex = scenes.findIndex((scene) => scene.video_kind === "task");
  if (firstTaskIndex <= 1) return [];
  return scenes
    .slice(1, firstTaskIndex)
    .map((_, index) => index + 1);
}

async function renderScene(scene: RenderManifest["slide_manifest"][number], index: number, audioPath: string, outputPath: string, durationSeconds: number) {
  const baseArgs = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0xf7faf9:s=1280x720:r=30:d=${Math.max(1, durationSeconds)}`,
    "-i",
    audioPath,
  ];
  const outputArgs = [
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
  ];

  try {
    await execFileAsync(ffmpegPath(), [
      ...baseArgs,
      "-vf",
      drawTextFilter(scene, index),
      ...outputArgs,
    ]);
  } catch {
    await execFileAsync(ffmpegPath(), [
      ...baseArgs,
      "-vf",
      "format=yuv420p",
      ...outputArgs,
    ]);
  }
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
    const sceneVideoUrls: NonNullable<LessonRender["render_json"]["scene_video_urls"]> = [];

    for (const [index, scene] of manifest.slide_manifest.entries()) {
      const duration = Math.max(2, Number(scene.duration_seconds) || 5);
      const sceneId = scene.scene_id || `scene-${index + 1}`;
      const slidePath = path.join(workDir, `${sceneId}.svg`);
      const audioPath = path.join(workDir, `${sceneId}.m4a`);
      const sceneVideoPath = path.join(workDir, `${sceneId}.mp4`);
      const narration = manifest.tts_narration.find((item) => item.scene_id === scene.scene_id)?.text ?? scene.title;

      await writeFile(slidePath, sceneSvg(scene, index));
      const finalAudioPath = await generateTtsAudio(narration, audioPath, duration);
      await renderScene(scene, index, finalAudioPath, sceneVideoPath, duration);

      slideUrls.push(await uploadBytes(supabase, `${basePath}/slides/${sceneId}.svg`, new Blob([await readFile(/* turbopackIgnore: true */ slidePath)], { type: "image/svg+xml" }), "image/svg+xml"));
      const audioUrl = await uploadOptionalAudio(
        supabase,
        `${basePath}/audio/${path.basename(finalAudioPath)}`,
        await readFile(/* turbopackIgnore: true */ finalAudioPath),
        finalAudioPath.endsWith(".mp3") ? "audio/mpeg" : "audio/mp4",
      );
      if (audioUrl) audioUrls.push(audioUrl);
      const sceneVideoUrl = await uploadBytes(
        supabase,
        `${basePath}/scenes/${sceneId}.mp4`,
        await readFile(/* turbopackIgnore: true */ sceneVideoPath),
        "video/mp4",
      );
      sceneVideoUrls.push({
        scene_id: sceneId,
        title: scene.title || `Scene ${index + 1}`,
        url: sceneVideoUrl,
        duration_seconds: duration,
        kind: scene.video_kind ?? "other",
        task_index: scene.task_index,
        task_id: scene.task_id,
      });
      sceneVideos.push(sceneVideoPath);
    }

    const introIndexes = introSceneIndexes(manifest.slide_manifest);
    const introPaths = introIndexes
      .map((index) => sceneVideos[index])
      .filter((scenePath): scenePath is string => Boolean(scenePath));
    let introVideoUrl: string | undefined;
    if (introPaths.length > 0) {
      const introPath = path.join(workDir, "intro.mp4");
      await concatScenes(introPaths, introPath, workDir);
      introVideoUrl = await uploadBytes(
        supabase,
        `${basePath}/intro.mp4`,
        await readFile(/* turbopackIgnore: true */ introPath),
        "video/mp4",
      );
    }

    const lessonIndexes = lessonSceneIndexes(manifest.slide_manifest);
    const lessonPaths = lessonIndexes
      .map((index) => sceneVideos[index])
      .filter((scenePath): scenePath is string => Boolean(scenePath));
    let lessonVideoUrl: string | undefined;
    if (lessonPaths.length > 0) {
      const lessonPath = path.join(workDir, "lesson-walkthrough.mp4");
      await concatScenes(lessonPaths, lessonPath, workDir);
      lessonVideoUrl = await uploadBytes(
        supabase,
        `${basePath}/lesson-walkthrough.mp4`,
        await readFile(/* turbopackIgnore: true */ lessonPath),
        "video/mp4",
      );
    }

    const mp4Path = path.join(workDir, "lesson.mp4");
    await concatScenes(sceneVideos, mp4Path, workDir);
    const mp4Url = await uploadBytes(supabase, manifest.mp4_output_path ?? `${basePath}/lesson.mp4`, await readFile(/* turbopackIgnore: true */ mp4Path), "video/mp4");
    const nextManifest = {
      ...manifest,
      slide_asset_urls: slideUrls,
      tts_audio_urls: audioUrls,
      intro_video_url: introVideoUrl,
      lesson_video_url: lessonVideoUrl,
      scene_video_urls: sceneVideoUrls,
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
