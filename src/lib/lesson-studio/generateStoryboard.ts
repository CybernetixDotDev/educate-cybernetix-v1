"use server";

import { callJsonLLM } from "@/lib/ai/provider";
import { getModel } from "@/lib/ai/getModel";
import { requireRole } from "@/lib/auth/roles";
import type { LessonBrief, LessonGeneratorOutput, LessonStoryboard, LessonStudioActionResult, StoryboardScene } from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const STORYBOARD_GENERATOR_SYSTEM = `You are the Storyboard Generator for Educate-Cybernetix.

You convert a generated lesson package into a clean, professional scene plan for a short narrated MP4 lecture.

You MUST preserve the lesson topic, age range, skill level, objectives, task path, and final project outcome.
You MUST produce a clear scene-by-scene plan that a renderer can turn into slides/scenes.
You MUST return valid JSON only.

Output exactly this JSON shape:
{
  "title": "",
  "total_duration_seconds": 0,
  "style_notes": "",
  "scenes": [
    {
      "scene_id": "scene-1",
      "title": "",
      "duration_seconds": 15,
      "on_screen_text": "",
      "visual_type": "title_slide",
      "animation_style": "",
      "narration_text": "",
      "asset_references": []
    }
  ],
  "caption_notes": "",
  "render_notes": ""
}

Scene types must be one of:
title_slide, concept_slide, demo_slide, checklist_slide, quiz_prompt_slide, recap_slide.

Style: StarterSchool-style, premium, clean, fast-paced, friendly, visual, and easy to follow.`;

const visualTypes = new Set<StoryboardScene["visual_type"]>([
  "title_slide",
  "concept_slide",
  "demo_slide",
  "checklist_slide",
  "quiz_prompt_slide",
  "recap_slide",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function duration(value: unknown, fallback = 20) {
  const seconds = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(8, Math.min(90, Math.round(seconds)));
}

function visualType(value: unknown, fallback: StoryboardScene["visual_type"]): StoryboardScene["visual_type"] {
  return typeof value === "string" && visualTypes.has(value as StoryboardScene["visual_type"])
    ? value as StoryboardScene["visual_type"]
    : fallback;
}

function fallbackScenes(lesson: LessonGeneratorOutput): StoryboardScene[] {
  const taskScenes = lesson.tasks.slice(0, 3).map((task, index) => ({
    scene_id: `scene-${index + 4}`,
    title: task.title,
    duration_seconds: 24,
    on_screen_text: task.action,
    visual_type: "checklist_slide" as const,
    animation_style: "Checklist items appear one at a time.",
    narration_text: task.instruction,
    asset_references: task.video_url ? [task.video_url] : [],
  }));

  return [
    {
      scene_id: "scene-1",
      title: "Hook",
      duration_seconds: 15,
      on_screen_text: lesson.hook,
      visual_type: "title_slide",
      animation_style: "Soft fade in with one bold headline.",
      narration_text: lesson.hook,
      asset_references: [],
    },
    {
      scene_id: "scene-2",
      title: "Objective",
      duration_seconds: 20,
      on_screen_text: lesson.objective.join("\n"),
      visual_type: "concept_slide",
      animation_style: "Objective bullets slide in gently.",
      narration_text: lesson.objective.join(" "),
      asset_references: [],
    },
    {
      scene_id: "scene-3",
      title: "Teaching Steps",
      duration_seconds: 35,
      on_screen_text: lesson.teaching_steps.slice(0, 5).join("\n"),
      visual_type: "demo_slide",
      animation_style: "Step cards move from left to right.",
      narration_text: lesson.teaching_steps.join(" "),
      asset_references: [],
    },
    ...taskScenes,
    {
      scene_id: `scene-${taskScenes.length + 4}`,
      title: "Recap",
      duration_seconds: 20,
      on_screen_text: lesson.recap,
      visual_type: "recap_slide",
      animation_style: "Final summary card fades in.",
      narration_text: lesson.recap,
      asset_references: [],
    },
  ];
}

function normalizeStoryboard(value: unknown, lesson: LessonGeneratorOutput): LessonStoryboard {
  const record = isRecord(value) ? value : {};
  const rawScenes = Array.isArray(record.scenes) ? record.scenes.filter(isRecord) : [];
  const scenes = rawScenes.length > 0
    ? rawScenes.map((scene, index) => ({
        scene_id: stringValue(scene.scene_id, `scene-${index + 1}`),
        title: stringValue(scene.title, `Scene ${index + 1}`),
        duration_seconds: duration(scene.duration_seconds),
        on_screen_text: stringValue(scene.on_screen_text),
        visual_type: visualType(scene.visual_type, index === 0 ? "title_slide" : "concept_slide"),
        animation_style: stringValue(scene.animation_style, "Simple fade and slide transitions."),
        narration_text: stringValue(scene.narration_text),
        asset_references: stringArray(scene.asset_references),
      }))
    : fallbackScenes(lesson);

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0);

  return {
    title: stringValue(record.title, "Lesson Storyboard"),
    total_duration_seconds: typeof record.total_duration_seconds === "number" && record.total_duration_seconds > 0
      ? Math.round(record.total_duration_seconds)
      : totalDuration,
    style_notes: stringValue(record.style_notes, "Clean, premium, high-whitespace, teen-friendly visual style."),
    scenes,
    caption_notes: stringValue(record.caption_notes, "Generate captions from narration_text for each scene."),
    render_notes: stringValue(record.render_notes, "Render as a short narrated MP4 with simple motion and clear visual hierarchy."),
  };
}

async function storyboardContext() {
  const supabase = createClient(await cookies());
  const [{ data: aiConfig }, { data: moduleContext }] = await Promise.all([
    supabase.from("ai_config").select("*").eq("config_key", "global-ai-mentor").maybeSingle(),
    supabase.from("ai_module_context").select("*").eq("module_key", "lesson-studio").maybeSingle(),
  ]);

  return { supabase, aiConfig: aiConfig ?? {}, moduleContext: moduleContext ?? {} };
}

export async function generateStoryboard(
  lesson: LessonGeneratorOutput,
  brief: LessonBrief,
): Promise<LessonStudioActionResult<LessonStoryboard>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  if (!lesson.hook || lesson.tasks.length === 0) {
    return { ok: false, data: null, error: "Generate a lesson package before creating the storyboard." };
  }

  try {
    const context = await storyboardContext();
    const model = await getModel("json", context.aiConfig);
    const prompt = [
      "Generate a storyboard for this lesson package.",
      "The storyboard will be used by a future MP4 renderer.",
      "Keep scenes short, visual, and practical.",
      "",
      "GLOBAL AI CONFIG:",
      JSON.stringify(context.aiConfig, null, 2),
      "",
      "LESSON STUDIO CONTEXT:",
      JSON.stringify(context.moduleContext, null, 2),
      "",
      "LESSON BRIEF:",
      JSON.stringify(brief, null, 2),
      "",
      "GENERATED LESSON PACKAGE:",
      JSON.stringify(lesson, null, 2),
    ].join("\n");

    const raw = await callJsonLLM<unknown>(model, prompt, {
      system: STORYBOARD_GENERATOR_SYSTEM,
      temperature: 0.2,
      metadata: { system: "storyboard-generator", lesson_title: brief.lesson_title },
    });
    const storyboard = normalizeStoryboard(raw, lesson);
    const { data: userResult } = await context.supabase.auth.getUser();
    const { data: savedStoryboard } = await context.supabase
      .from("lesson_storyboards")
      .insert({
        generated_lesson_id: lesson.generated_lesson_id ?? null,
        storyboard_json: storyboard,
        status: "generated",
        created_by: userResult.user?.id ?? null,
      })
      .select("id")
      .single();

    revalidatePath("/admin/ai-lesson-generator");

    return {
      ok: true,
      data: {
        ...storyboard,
        storyboard_id: savedStoryboard?.id,
        generated_lesson_id: lesson.generated_lesson_id ?? null,
      },
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Storyboard generation failed.",
    };
  }
}
