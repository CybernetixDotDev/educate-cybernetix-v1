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
You MUST create teaching scenes from lesson.teaching_sequence before task scenes.
Teaching scenes MUST appear in this order:
1. "intro" - Hook
2. "why-it-matters" - Why It Matters
3. "mental-model" - Mental Model Diagram
4. "i-do" - I Do Demo
5. "we-do" - We Do Guided Step
6. "you-do" - You Do Setup
7. "common-mistake" - Common Mistake
8. "teaching-recap" - Recap
Then create one scene for every hands-on task.
Task scene IDs MUST be "task-1", "task-2", "task-3", etc. in the same order as lesson.tasks.
The hook scene ID MUST be "intro".
Every scene MUST include Zylo in the scene plan. Put a plain-English Zylo direction in asset_references, such as "Zylo floats in and waves", "Zylo points at the diagram", or "Zylo celebrates the checkpoint".
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
Use demo_slide for I Do / We Do / You Do scenes.
Zylo should feel like the lesson host: he floats in during intro, points at diagrams during teaching, explains each task, reacts to mistakes, and celebrates in recap/outro.
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
    { type: "badge", label: "Zylo mission", detail: `Task ${index + 1}: one focused build step`, icon: "mentor" },
    { type: "card", label: task.title, detail: task.action, icon: "project" },
    { type: "card", label: "Checkpoint", detail: `Submit proof as ${task.checkpoint_types?.join(", ") || task.checkpoint_type}.`, icon: "checkpoint" },
  ];
}

function zyloTaskDirection(task: LessonGeneratorOutput["tasks"][number], index: number) {
  const formats = task.checkpoint_types?.join(", ") || task.checkpoint_type;
  return `Zylo points at the task card and says: "Task ${index + 1}: ${task.title}. Show me your proof with ${formats} when you are done."`;
}

function joinLines(items: string[], fallback: string) {
  return items.length > 0 ? items.join("\n") : fallback;
}

function teachingVisualElements(kind: "hook" | "why" | "model" | "demo" | "mistake" | "recap", lesson: LessonGeneratorOutput): StoryboardScene["visual_elements"] {
  if (kind === "model") {
    return [
      { type: "icon", label: "Start", detail: "The first part of the idea", icon: "browser" },
      { type: "arrow", label: "connects", detail: "Follow the flow" },
      { type: "icon", label: "System", detail: "The part that responds", icon: "server" },
      { type: "arrow", label: "returns", detail: "See the result" },
      { type: "badge", label: "Mental model", detail: "Understand before building", icon: "mentor" },
    ];
  }

  if (kind === "demo") {
    return [
      { type: "badge", label: "Watch", detail: "First see the move", icon: "mentor" },
      { type: "card", label: "Try", detail: "Then follow one small step", icon: "checkpoint" },
      { type: "card", label: "Build", detail: lesson.build_task.expected_outcome ?? lesson.build_task.title ?? "Create the project piece", icon: "project" },
    ];
  }

  if (kind === "mistake") {
    return [
      { type: "badge", label: "Common mistake", detail: "Spot it early", icon: "checkpoint" },
      { type: "card", label: "Slow down", detail: "Name the part that is confusing", icon: "mentor" },
      { type: "card", label: "Fix", detail: "Take the next smallest step", icon: "project" },
    ];
  }

  if (kind === "recap") {
    return [
      { type: "badge", label: "Recap", detail: "Lock in the idea", icon: "mentor" },
      { type: "card", label: "Next", detail: "Start the guided build", icon: "project" },
      { type: "card", label: "Proof", detail: "Submit a checkpoint when done", icon: "checkpoint" },
    ];
  }

  if (kind === "why") {
    return [
      { type: "badge", label: "Why it matters", detail: "Connect skill to real life", icon: "mentor" },
      { type: "card", label: "Use it", detail: lesson.build_task.expected_outcome ?? lesson.hook, icon: "project" },
      { type: "card", label: "Confidence", detail: "You are becoming a creator", icon: "checkpoint" },
    ];
  }

  return [
    { type: "badge", label: "Zylo", detail: "Guided lesson", icon: "mentor" },
    { type: "card", label: lesson.build_task.title ?? "Creator project", detail: lesson.build_task.expected_outcome ?? lesson.hook, icon: "project" },
  ];
}

function teachingSequenceScenes(lesson: LessonGeneratorOutput): StoryboardScene[] {
  const sequence = lesson.teaching_sequence;
  const iDoSteps = sequence.i_do.steps;
  const weDoSteps = sequence.we_do.steps;
  const recapBullets = sequence.recap.bullets;

  return [
    {
      scene_id: "intro",
      title: sequence.cinematic_hook.title || "Hook",
      duration_seconds: 18,
      on_screen_text: sequence.cinematic_hook.body,
      visual_type: "title_slide",
      animation_style: "Cinematic title reveal with a friendly mentor badge and one bold project card.",
      narration_text: sequence.cinematic_hook.body,
      asset_references: [
        "Zylo floats in, waves, and introduces himself as the lesson host.",
        ...(sequence.cinematic_hook.visual_prompt ? [sequence.cinematic_hook.visual_prompt] : []),
      ],
      visual_elements: teachingVisualElements("hook", lesson),
    },
    {
      scene_id: "why-it-matters",
      title: sequence.why_it_matters.title || "Why It Matters",
      duration_seconds: 22,
      on_screen_text: sequence.why_it_matters.relatable_example
        ? `${sequence.why_it_matters.body}\n${sequence.why_it_matters.relatable_example}`
        : sequence.why_it_matters.body,
      visual_type: "concept_slide",
      animation_style: "Real-world example card slides beside the main idea.",
      narration_text: [sequence.why_it_matters.body, sequence.why_it_matters.relatable_example].filter(Boolean).join(" "),
      asset_references: ["Zylo leans in with an encouraging expression and points to the real-world example."],
      visual_elements: teachingVisualElements("why", lesson),
    },
    {
      scene_id: "mental-model",
      title: sequence.mental_model.title || "Mental Model Diagram",
      duration_seconds: 28,
      on_screen_text: [sequence.mental_model.body, sequence.mental_model.metaphor].filter(Boolean).join("\n"),
      visual_type: "diagram_slide",
      animation_style: "Diagram pieces appear left to right with arrows showing the flow.",
      narration_text: [sequence.mental_model.body, sequence.mental_model.metaphor, sequence.mental_model.diagram_prompt].filter(Boolean).join(" "),
      asset_references: [
        "Zylo points at each diagram node as the flow appears.",
        ...(sequence.mental_model.diagram_prompt ? [sequence.mental_model.diagram_prompt] : []),
      ],
      visual_elements: teachingVisualElements("model", lesson),
    },
    {
      scene_id: "i-do",
      title: sequence.i_do.title || "I Do Demo",
      duration_seconds: 30,
      on_screen_text: joinLines(iDoSteps.slice(0, 4), sequence.i_do.example ?? "Watch the first move."),
      visual_type: "demo_slide",
      animation_style: "Mentor demonstrates the steps with numbered cards.",
      narration_text: [joinLines(iDoSteps, ""), sequence.i_do.example].filter(Boolean).join(" "),
      asset_references: ["Zylo demonstrates the first move and points at the example steps."],
      visual_elements: teachingVisualElements("demo", lesson),
    },
    {
      scene_id: "we-do",
      title: sequence.we_do.title || "We Do Guided Step",
      duration_seconds: 30,
      on_screen_text: joinLines(weDoSteps.slice(0, 4), sequence.we_do.guided_prompt ?? "Try the next step with guidance."),
      visual_type: "demo_slide",
      animation_style: "Guided step cards animate with a pause-and-try marker.",
      narration_text: [joinLines(weDoSteps, ""), sequence.we_do.guided_prompt].filter(Boolean).join(" "),
      asset_references: ["Zylo pauses beside the steps and invites the student to try with him."],
      visual_elements: teachingVisualElements("demo", lesson),
    },
    {
      scene_id: "you-do",
      title: sequence.you_do.title || "You Do Setup",
      duration_seconds: 24,
      on_screen_text: [sequence.you_do.instruction, sequence.you_do.expected_output ? `Goal: ${sequence.you_do.expected_output}` : ""].filter(Boolean).join("\n"),
      visual_type: "demo_slide",
      animation_style: "Project goal card appears with a clear action arrow.",
      narration_text: [sequence.you_do.instruction, sequence.you_do.expected_output].filter(Boolean).join(" "),
      asset_references: ["Zylo points at the project goal and hands the mission to the student."],
      visual_elements: teachingVisualElements("demo", lesson),
    },
    {
      scene_id: "common-mistake",
      title: sequence.common_mistake.title || "Common Mistake",
      duration_seconds: 22,
      on_screen_text: `${sequence.common_mistake.mistake}\nFix: ${sequence.common_mistake.fix}`,
      visual_type: "concept_slide",
      animation_style: "Mistake card flips into a fix card.",
      narration_text: `${sequence.common_mistake.mistake} ${sequence.common_mistake.fix}`,
      asset_references: ["Zylo uses a thoughtful expression, then points from the mistake card to the fix card."],
      visual_elements: teachingVisualElements("mistake", lesson),
    },
    {
      scene_id: "teaching-recap",
      title: sequence.recap.title || "Recap",
      duration_seconds: 22,
      on_screen_text: joinLines(recapBullets.slice(0, 4), sequence.recap.next_step ?? lesson.next_step),
      visual_type: "recap_slide",
      animation_style: "Recap checklist appears, then highlights the first task.",
      narration_text: [joinLines(recapBullets, ""), sequence.recap.next_step].filter(Boolean).join(" "),
      asset_references: ["Zylo celebrates the learning moment and points toward the first task."],
      visual_elements: teachingVisualElements("recap", lesson),
    },
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
    asset_references: [zyloTaskDirection(task, index), ...(task.video_url ? [task.video_url] : [])],
    visual_elements: taskVisualElements(task, index),
  }));

  return [...teachingSequenceScenes(lesson), ...taskScenes];
}

function sceneMatchesTask(scene: StoryboardScene, task: LessonGeneratorOutput["tasks"][number], index: number) {
  const text = `${scene.scene_id} ${scene.title} ${scene.on_screen_text}`.toLowerCase();
  return scene.scene_id === `task-${index + 1}` || text.includes(task.task_id.toLowerCase()) || text.includes(task.title.toLowerCase());
}

function ensureStoryboardCoverage(scenes: StoryboardScene[], lesson: LessonGeneratorOutput): StoryboardScene[] {
  const fallback = fallbackScenes(lesson);
  const normalized = scenes.length > 0 ? scenes : fallback;
  const teachingScenes = teachingSequenceScenes(lesson);
  const taskScenes = lesson.tasks.map((task, index): StoryboardScene => {
    const found = normalized.find((scene) => sceneMatchesTask(scene, task, index));
    return {
      scene_id: `task-${index + 1}`,
      title: found?.title || task.title,
      duration_seconds: found?.duration_seconds ?? 24,
      on_screen_text: found?.on_screen_text || task.action,
      visual_type: "checklist_slide",
      animation_style: found?.animation_style || "Task cards appear one at a time with a checkpoint badge.",
      narration_text: found?.narration_text || task.instruction,
      asset_references: [zyloTaskDirection(task, index), ...(found?.asset_references ?? [])],
      visual_elements: found?.visual_elements?.length ? found.visual_elements : taskVisualElements(task, index),
    };
  });

  return [...teachingScenes, ...taskScenes];
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
    total_duration_seconds: totalDuration,
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
