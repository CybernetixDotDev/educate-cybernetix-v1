"use server";

import { callJsonLLM } from "@/lib/ai/provider";
import { getModel } from "@/lib/ai/getModel";
import { requireRole } from "@/lib/auth/roles";
import type { LessonBrief, LessonGeneratorOutput, LessonStoryboard, LessonStudioActionResult, StoryboardScene } from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const STORYBOARD_GENERATOR_SYSTEM = `You are the Storyboard Generator for Educate-Cybernetix.

You convert a generated lesson package into a clean, professional scene plan for short narrated MP4 lesson videos.

You MUST preserve the lesson topic, age range, skill level, objectives, task path, and final project outcome.
You MUST produce a clear scene-by-scene plan that a renderer can turn into separate videos.
You MUST create one intro scene and one scene for every hands-on task.
Task scene IDs MUST be "task-1", "task-2", "task-3", etc. in the same order as lesson.tasks.
The intro scene ID MUST be "intro".
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
      "asset_references": [],
      "visual_elements": [
        {
          "type": "icon",
          "label": "Browser",
          "detail": "Starts the request",
          "icon": "browser"
        }
      ]
    }
  ],
  "caption_notes": "",
  "render_notes": ""
}

Scene types must be one of:
title_slide, concept_slide, diagram_slide, demo_slide, code_slide, checklist_slide, quiz_prompt_slide, recap_slide.

Use visual_elements heavily. Every scene should include 3-6 visual elements.
Use diagram_slide for flows like browser -> DNS -> server -> response.
Use code_slide for code walkthroughs.
Use checklist_slide for guided build task videos.
Allowed visual element types: icon, arrow, card, code, badge.
Allowed icons: browser, dns, server, database, code, checkpoint, project, mentor.

Style: StarterSchool-style, premium, clean, fast-paced, friendly, visual, and easy to follow.`;

const visualTypes = new Set<StoryboardScene["visual_type"]>([
  "title_slide",
  "concept_slide",
  "diagram_slide",
  "demo_slide",
  "code_slide",
  "checklist_slide",
  "quiz_prompt_slide",
  "recap_slide",
]);

const visualElementTypes = new Set(["icon", "arrow", "card", "code", "badge"]);
const visualElementIcons = new Set(["browser", "dns", "server", "database", "code", "checkpoint", "project", "mentor"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
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
  return lines;
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

function visualElements(value: unknown, fallback: StoryboardScene["visual_elements"] = []): StoryboardScene["visual_elements"] {
  if (!Array.isArray(value)) return fallback;

  return value.filter(isRecord).slice(0, 7).map((item) => {
    const type = typeof item.type === "string" && visualElementTypes.has(item.type) ? item.type : "card";
    const icon = typeof item.icon === "string" && visualElementIcons.has(item.icon) ? item.icon : undefined;
    return {
      type: type as NonNullable<StoryboardScene["visual_elements"]>[number]["type"],
      label: stringValue(item.label, "Key idea"),
      detail: stringValue(item.detail),
      icon: icon as NonNullable<StoryboardScene["visual_elements"]>[number]["icon"],
    };
  });
}

function taskVisualElements(task: LessonGeneratorOutput["tasks"][number], index: number): StoryboardScene["visual_elements"] {
  return [
    { type: "badge", label: `Task ${index + 1}`, detail: "One focused build step", icon: "checkpoint" },
    { type: "card", label: task.title, detail: task.action, icon: "project" },
    { type: "card", label: "Checkpoint", detail: `Submit proof as ${task.checkpoint_types?.join(", ") || task.checkpoint_type}.`, icon: "checkpoint" },
  ];
}

function fallbackScenes(lesson: LessonGeneratorOutput): StoryboardScene[] {
  const taskScenes = lesson.tasks.map((task, index) => ({
    scene_id: `task-${index + 1}`,
    title: task.title,
    duration_seconds: 24,
    on_screen_text: task.action,
    visual_type: "checklist_slide" as const,
    animation_style: "Checklist items appear one at a time.",
    narration_text: task.instruction,
    asset_references: task.video_url ? [task.video_url] : [],
    visual_elements: taskVisualElements(task, index),
  }));

  return [
    {
      scene_id: "intro",
      title: "Hook",
      duration_seconds: 15,
      on_screen_text: lesson.hook,
      visual_type: "title_slide",
      animation_style: "Soft fade in with one bold headline.",
      narration_text: lesson.hook,
      asset_references: [],
      visual_elements: [
        { type: "badge", label: "Cyber Mentor", detail: "Guided lesson", icon: "mentor" },
        { type: "card", label: lesson.build_task.title ?? "Creator project", detail: lesson.build_task.expected_outcome ?? lesson.hook, icon: "project" },
      ],
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
      visual_elements: lesson.objective.slice(0, 4).map((objective, index) => ({
        type: "card" as const,
        label: `Goal ${index + 1}`,
        detail: objective,
        icon: "checkpoint" as const,
      })),
    },
    {
      scene_id: "scene-3",
      title: "Teaching Steps",
      duration_seconds: 35,
      on_screen_text: lesson.teaching_steps.slice(0, 5).join("\n"),
      visual_type: "diagram_slide",
      animation_style: "Step cards move from left to right.",
      narration_text: lesson.teaching_steps.join(" "),
      asset_references: [],
      visual_elements: [
        { type: "icon", label: "Browser", detail: "Starts the request", icon: "browser" },
        { type: "arrow", label: "asks", detail: "Find the address" },
        { type: "icon", label: "DNS", detail: "Finds the server", icon: "dns" },
        { type: "arrow", label: "connects", detail: "Send request" },
        { type: "icon", label: "Server", detail: "Sends the page", icon: "server" },
      ],
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
      visual_elements: [
        { type: "badge", label: "Recap", detail: "You are becoming a creator.", icon: "mentor" },
        { type: "card", label: "Next step", detail: lesson.next_step, icon: "project" },
      ],
    },
  ];
}

function defaultVisualElements(scene: StoryboardScene, lesson: LessonGeneratorOutput): StoryboardScene["visual_elements"] {
  if (scene.visual_type === "diagram_slide") {
    return [
      { type: "icon", label: "Browser", detail: "Starts the request", icon: "browser" },
      { type: "arrow", label: "asks", detail: "Find the address" },
      { type: "icon", label: "DNS", detail: "Finds the server", icon: "dns" },
      { type: "arrow", label: "connects", detail: "Send request" },
      { type: "icon", label: "Server", detail: "Sends the page", icon: "server" },
    ];
  }

  if (scene.visual_type === "code_slide") {
    return [
      { type: "code", label: "Code editor", detail: scene.on_screen_text || scene.title, icon: "code" },
      { type: "badge", label: "Try it", detail: "Change one line and test it", icon: "checkpoint" },
    ];
  }

  if (scene.visual_type === "title_slide") {
    return [
      { type: "badge", label: "Cyber Mentor", detail: "Guided lesson", icon: "mentor" },
      { type: "card", label: lesson.build_task.title ?? "Creator project", detail: lesson.build_task.expected_outcome ?? lesson.hook, icon: "project" },
    ];
  }

  return wrapText(scene.on_screen_text || scene.title, 40).slice(0, 4).map((line, index) => ({
    type: "card",
    label: index === 0 ? scene.title : `Step ${index + 1}`,
    detail: line,
    icon: "checkpoint",
  }));
}

function sceneMatchesTask(scene: StoryboardScene, task: LessonGeneratorOutput["tasks"][number], index: number) {
  const text = `${scene.scene_id} ${scene.title} ${scene.on_screen_text}`.toLowerCase();
  return scene.scene_id === `task-${index + 1}` || text.includes(task.task_id.toLowerCase()) || text.includes(task.title.toLowerCase());
}

function ensureStoryboardCoverage(scenes: StoryboardScene[], lesson: LessonGeneratorOutput): StoryboardScene[] {
  const fallback = fallbackScenes(lesson);
  const normalized = scenes.length > 0 ? scenes : fallback;
  const introSource = normalized.find((scene) => scene.scene_id === "intro") ?? normalized[0] ?? fallback[0];
  const intro: StoryboardScene = {
    ...introSource,
    scene_id: "intro",
    visual_type: "title_slide",
    visual_elements: introSource.visual_elements?.length ? introSource.visual_elements : defaultVisualElements({ ...introSource, visual_type: "title_slide" }, lesson),
  };
  const existingTasks = new Set<string>();
  const taskScenes = lesson.tasks.map((task, index): StoryboardScene => {
    const found = normalized.find((scene) => sceneMatchesTask(scene, task, index));
    existingTasks.add(found?.scene_id ?? "");
    return {
      scene_id: `task-${index + 1}`,
      title: found?.title || task.title,
      duration_seconds: found?.duration_seconds ?? 24,
      on_screen_text: found?.on_screen_text || task.action,
      visual_type: "checklist_slide",
      animation_style: found?.animation_style || "Task cards appear one at a time with a checkpoint badge.",
      narration_text: found?.narration_text || task.instruction,
      asset_references: found?.asset_references ?? [],
      visual_elements: found?.visual_elements?.length ? found.visual_elements : taskVisualElements(task, index),
    };
  });
  const middleScenes = normalized
    .filter((scene) => scene.scene_id !== introSource.scene_id && !existingTasks.has(scene.scene_id) && scene.visual_type !== "recap_slide")
    .slice(0, 3)
    .map((scene, index): StoryboardScene => {
      const shouldDiagram = index === 0 && !normalized.some((item) => item.visual_type === "diagram_slide");
      const nextScene = {
        ...scene,
        scene_id: scene.scene_id.startsWith("task-") ? `lesson-${index + 1}` : scene.scene_id,
        visual_type: shouldDiagram ? "diagram_slide" as const : scene.visual_type,
      };
      return {
        ...nextScene,
        visual_elements: nextScene.visual_elements?.length ? nextScene.visual_elements : defaultVisualElements(nextScene, lesson),
      };
    });
  const lessonWalkthrough = middleScenes.length > 0
    ? middleScenes
    : fallback.slice(1, 3).map((scene) => ({
        ...scene,
        visual_elements: scene.visual_elements?.length ? scene.visual_elements : defaultVisualElements(scene, lesson),
      }));
  const recapSource = normalized.find((scene) => scene.visual_type === "recap_slide") ?? fallback[fallback.length - 1];
  const recap: StoryboardScene = {
    ...recapSource,
    scene_id: "recap",
    visual_type: "recap_slide",
    visual_elements: recapSource.visual_elements?.length ? recapSource.visual_elements : defaultVisualElements({ ...recapSource, visual_type: "recap_slide" }, lesson),
  };

  return [intro, ...lessonWalkthrough, ...taskScenes, recap];
}

function normalizeStoryboard(value: unknown, lesson: LessonGeneratorOutput): LessonStoryboard {
  const record = isRecord(value) ? value : {};
  const rawScenes = Array.isArray(record.scenes) ? record.scenes.filter(isRecord) : [];
  const normalizedScenes = rawScenes.length > 0
    ? rawScenes.map((scene, index) => ({
        scene_id: stringValue(scene.scene_id, `scene-${index + 1}`),
        title: stringValue(scene.title, `Scene ${index + 1}`),
        duration_seconds: duration(scene.duration_seconds),
        on_screen_text: stringValue(scene.on_screen_text),
        visual_type: visualType(scene.visual_type, index === 0 ? "title_slide" : "concept_slide"),
        animation_style: stringValue(scene.animation_style, "Simple fade and slide transitions."),
        narration_text: stringValue(scene.narration_text),
        asset_references: stringArray(scene.asset_references),
        visual_elements: visualElements(scene.visual_elements),
      }))
    : fallbackScenes(lesson);
  const scenes = ensureStoryboardCoverage(normalizedScenes, lesson);

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
