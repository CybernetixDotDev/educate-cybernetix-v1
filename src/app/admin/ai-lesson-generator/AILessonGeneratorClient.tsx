"use client";

import { LessonBriefForm } from "@/components/lesson-studio/LessonBriefForm";
import { LessonPackagePreview } from "@/components/lesson-studio/LessonPackagePreview";
import { PublishStatusPanel, type PublishStatus } from "@/components/lesson-studio/PublishStatusPanel";
import { RenderPipelinePanel } from "@/components/lesson-studio/RenderPipelinePanel";
import { ReviewPublishPanel } from "@/components/lesson-studio/ReviewPublishPanel";
import { StoryboardPreview } from "@/components/lesson-studio/StoryboardPreview";
import { generateLessonPackage } from "@/lib/lesson-studio/generateLessonPackage";
import { generateStoryboard } from "@/lib/lesson-studio/generateStoryboard";
import { getLessonRender, renderLessonMp4 } from "@/lib/lesson-studio/renderLessonMp4";
import { saveLessonBlueprint } from "@/lib/lesson-studio/saveLessonBlueprint";
import type { LessonBlueprintSummary, LessonBrief, LessonGeneratorOutput, LessonRender, LessonStoryboard, PublishTarget } from "@/lib/lesson-studio/types";
import { useMemo, useState } from "react";

type AILessonGeneratorClientProps = {
  blueprints: LessonBlueprintSummary[];
};

const DEFAULT_BRIEF: LessonBrief = {
  lesson_title: "",
  age_range: "Ages 12-16",
  skill_level: "beginner",
  subject_area: "Web development",
  learning_objectives: [],
  required_project_outcome: "",
  hands_on_task_requirements: [],
  task_verification_criteria: [],
  final_project_submission_requirements: {
    required_uploads: ["screenshot", "link"],
    submission_checklist: [],
    stretch_goals: [],
    completion_criteria: [],
    micro_survey_questions: ["Do you want to continue?", "What was the most interesting thing you learned?"],
    ai_mentor_feedback_rules: [
      "Review all task checkpoints before awarding completion",
      "Be supportive and specific",
      "Do not reveal full solutions",
      "Unlock the next guided build only when completion criteria are met",
    ],
  },
  required_tools: [],
  estimated_duration: "30 minutes",
  tone_style: "Warm, simple, mentor-like, StarterSchool-style",
  quiz_question_count: 5,
  quiz_difficulty: "easy",
  safety_constraints: ["Keep examples age-appropriate", "Do not require personal data"],
  reference_notes: "",
  example_assets: [],
  branding_theme_tags: ["premium", "creator identity", "project-based"],
};

function withBriefDefaults(brief: LessonBrief): LessonBrief {
  return {
    ...DEFAULT_BRIEF,
    ...brief,
    learning_objectives: brief.learning_objectives ?? [],
    hands_on_task_requirements: (brief.hands_on_task_requirements ?? []).map((task) => ({
      ...task,
      checkpoint_types: task.checkpoint_types?.length ? task.checkpoint_types : [task.checkpoint_type],
    })),
    task_verification_criteria: brief.task_verification_criteria ?? [],
    final_project_submission_requirements:
      brief.final_project_submission_requirements ?? DEFAULT_BRIEF.final_project_submission_requirements,
    required_tools: brief.required_tools ?? [],
    safety_constraints: brief.safety_constraints ?? [],
    example_assets: brief.example_assets ?? [],
    branding_theme_tags: brief.branding_theme_tags ?? [],
  };
}

export function AILessonGeneratorClient({ blueprints }: AILessonGeneratorClientProps) {
  const [brief, setBrief] = useState<LessonBrief>(DEFAULT_BRIEF);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonGeneratorOutput | null>(null);
  const [storyboard, setStoryboard] = useState<LessonStoryboard | null>(null);
  const [render, setRender] = useState<LessonRender | null>(null);
  const [loading, setLoading] = useState<"saving" | "generating" | "storyboarding" | "rendering" | null>(null);
  const [refreshingRender, setRefreshingRender] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [publishTarget, setPublishTarget] = useState<PublishTarget | null>(null);
  const [localBlueprints, setLocalBlueprints] = useState(blueprints);

  const blueprintOptions = useMemo(
    () => localBlueprints.map((blueprint) => ({ id: blueprint.id, title: blueprint.title, updated_at: blueprint.updated_at })),
    [localBlueprints],
  );

  function selectBlueprint(id: string) {
    if (!id) {
      setSelectedBlueprintId(null);
      setBrief(DEFAULT_BRIEF);
      setLesson(null);
      setStoryboard(null);
      setRender(null);
      setPublishStatus(null);
      setPublishTarget(null);
      return;
    }

    const selected = localBlueprints.find((blueprint) => blueprint.id === id);
    if (!selected) return;

    setSelectedBlueprintId(selected.id);
    setBrief(withBriefDefaults(selected.brief));
    setLesson(null);
    setStoryboard(null);
    setRender(null);
    setPublishStatus(null);
    setPublishTarget(null);
    setStatus(`Loaded blueprint: ${selected.title}`);
    setError(null);
  }

  async function handleSaveBlueprint() {
    setLoading("saving");
    setStatus(null);
    setError(null);

    try {
      const result = await saveLessonBlueprint(brief, selectedBlueprintId);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Could not save lesson blueprint.");
        return;
      }

      setSelectedBlueprintId(result.data.id);
      setLocalBlueprints((current) => {
        const withoutCurrent = current.filter((blueprint) => blueprint.id !== result.data?.id);
        return [result.data!, ...withoutCurrent];
      });
      setStatus("Lesson blueprint saved.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerate() {
    setLoading("generating");
    setStatus(null);
    setError(null);

    try {
      let blueprintId = selectedBlueprintId;

      if (!blueprintId) {
        const saved = await saveLessonBlueprint(brief, null);
        if (!saved.ok || !saved.data) {
          setError(saved.error ?? "Save the lesson brief before generating.");
          return;
        }
        blueprintId = saved.data.id;
        setSelectedBlueprintId(saved.data.id);
        setLocalBlueprints((current) => [saved.data!, ...current]);
      }

      const result = await generateLessonPackage(brief, blueprintId);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Lesson generation failed.");
        return;
      }

      setLesson(result.data);
      setStoryboard(null);
      setRender(null);
      setPublishStatus(null);
      setPublishTarget(null);
      setStatus("Lesson package generated.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateStoryboard() {
    if (!lesson) {
      setError("Generate a lesson package before creating the storyboard.");
      return;
    }

    setLoading("storyboarding");
    setStatus(null);
    setError(null);

    try {
      const result = await generateStoryboard(lesson, brief);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Storyboard generation failed.");
        return;
      }

      setStoryboard(result.data);
      setRender(null);
      setPublishStatus(null);
      setPublishTarget(null);
      setStatus("Storyboard generated.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRenderMp4() {
    if (!lesson || !storyboard) {
      setError("Generate a lesson package and storyboard before preparing MP4 render assets.");
      return;
    }

    setLoading("rendering");
    setStatus(null);
    setError(null);

    try {
      const result = await renderLessonMp4(storyboard, lesson);
      if (!result.ok || !result.data) {
        setError(result.error ?? "MP4 render pipeline failed.");
        return;
      }

      setRender(result.data);
      setPublishStatus(null);
      setStatus(
        result.data.status === "completed"
          ? "MP4 render completed."
          : result.data.status === "queued"
            ? "MP4 render queued. Start the lesson render worker to process it."
          : result.data.status === "processing"
            ? "MP4 renderer started."
            : "Render assets prepared and uploaded.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleRefreshRender() {
    if (!render?.render_id) return;

    setRefreshingRender(true);
    setError(null);

    try {
      const result = await getLessonRender(render.render_id);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Could not refresh render status.");
        return;
      }

      setRender(result.data);
      if (result.data.status !== "completed" && !result.data.render_json?.local_renderer_completed) {
        setPublishStatus(null);
      }
      setStatus(
        result.data.mp4_url
          ? "MP4 render completed."
          : `Render status refreshed: ${result.data.status}.`,
      );
    } finally {
      setRefreshingRender(false);
    }
  }

  return (
    <div className="space-y-6">
      <LessonBriefForm
        value={brief}
        blueprints={blueprintOptions}
        selectedBlueprintId={selectedBlueprintId}
        onSelectBlueprint={selectBlueprint}
        onChange={setBrief}
      />

      <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-slate-950">Ready to create?</p>
          <p className="text-sm text-slate-600">Save the brief as a reusable blueprint, then generate the full lesson package.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleSaveBlueprint()}
            disabled={Boolean(loading)}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "saving" ? "Saving..." : "Save Blueprint"}
          </button>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={Boolean(loading)}
            className="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "generating" ? "Generating..." : "Generate Lesson"}
          </button>
          <button
            type="button"
            onClick={() => void handleGenerateStoryboard()}
            disabled={Boolean(loading) || !lesson}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "storyboarding" ? "Generating..." : "Generate Storyboard"}
          </button>
          <button
            type="button"
            onClick={() => void handleRenderMp4()}
            disabled={Boolean(loading) || !lesson || !storyboard}
            className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "rendering" ? "Preparing..." : "Prepare MP4 Render"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}

      <LessonPackagePreview lesson={lesson} />
      <StoryboardPreview storyboard={storyboard} />
      <RenderPipelinePanel render={render} onRefresh={() => void handleRefreshRender()} refreshing={refreshingRender} />
      <ReviewPublishPanel
        key={`${lesson?.generated_lesson_id ?? "empty"}-${storyboard?.storyboard_id ?? "no-storyboard"}-${brief.lesson_title}`}
        lesson={lesson}
        storyboard={storyboard}
        render={render}
        brief={brief}
        onLessonChange={setLesson}
        onStoryboardChange={setStoryboard}
        onStatus={setStatus}
        onError={setError}
        onPublished={setPublishStatus}
        onPublishTargetChange={setPublishTarget}
      />
      <PublishStatusPanel publishStatus={publishStatus} target={publishTarget} onStatusLoaded={setPublishStatus} />
    </div>
  );
}
