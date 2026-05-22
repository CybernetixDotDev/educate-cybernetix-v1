"use server";

import { requireRole } from "@/lib/auth/roles";
import { validateLessonJson, validateQuizJson, type CurriculumLessonJson, type CurriculumQuizJson } from "@/lib/curriculum/validateLessonJson";
import type {
  GeneratedQuizQuestion,
  LessonGeneratorOutput,
  LessonRender,
  LessonReviewStatus,
  LessonStoryboard,
  LessonStudioActionResult,
  PublishResult,
  PublishTarget,
} from "@/lib/lesson-studio/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function quizAnswer(question: GeneratedQuizQuestion) {
  if (typeof question.answer === "number" && question.options) {
    return question.options[question.answer] ?? String(question.answer);
  }
  if (typeof question.answer === "boolean") return question.answer ? "True" : "False";
  return String(question.answer);
}

function quizOptions(question: GeneratedQuizQuestion) {
  if (question.type === "true_false") return ["True", "False"];
  return question.options && question.options.length > 0 ? question.options : [quizAnswer(question)];
}

function fallbackQuizQuestions(lesson: LessonGeneratorOutput): GeneratedQuizQuestion[] {
  const objectives = lesson.objective.length > 0 ? lesson.objective : [lesson.hook || lesson.build_task.expected_outcome || "the lesson goal"];
  const projectOutcome = lesson.build_task.expected_outcome || lesson.build_task.title || "the project outcome";

  return [
    {
      type: "mcq",
      question: "What is the main goal of this lesson?",
      options: [projectOutcome, "Only watch the video", "Skip the checkpoint", "Avoid building anything"],
      answer: projectOutcome,
      explanation: "The lesson is project-based, so the main goal is the visible project outcome.",
      difficulty: "easy",
      skill_tags: ["project-based-learning"],
    },
    {
      type: "true_false",
      question: `True or false: this lesson helps you ${objectives[0].toLowerCase().replace(/[.?!]$/g, "")}.`,
      options: ["True", "False"],
      answer: true,
      explanation: `This is one of the lesson objectives: ${objectives[0]}`,
      difficulty: "easy",
      skill_tags: ["lesson-objective"],
    },
    {
      type: "short",
      question: "What should you submit to prove you completed the hands-on work?",
      answer: lesson.tasks[0]?.title ?? "A checkpoint submission showing the task was completed.",
      explanation: "A good answer describes the checkpoint proof the student will submit.",
      difficulty: "easy",
      skill_tags: ["checkpoint"],
    },
  ];
}

function sceneVideos(render?: LessonRender | null) {
  return Array.isArray(render?.render_json?.scene_video_urls) ? render.render_json.scene_video_urls : [];
}

function isPlaceholderVideoUrl(url: string | undefined) {
  return !url || /(^https?:\/\/example\.com\/|yourcdn\.com|placeholder)/i.test(url);
}

function hasSplitTaskVideos(render?: LessonRender | null) {
  return sceneVideos(render).some((scene) => scene.kind === "task" && scene.url);
}

function introVideo(render?: LessonRender | null) {
  if (render?.render_json?.intro_video_url) {
    return {
      title: "Cyber Mentor lesson intro",
      url: render.render_json.intro_video_url,
    };
  }
  return sceneVideos(render).find((scene) => scene.kind === "intro") ?? sceneVideos(render)[0] ?? null;
}

function taskVideoUrl(taskIndex: number, taskId: string, taskTitle: string, render?: LessonRender | null) {
  const videos = sceneVideos(render).filter((scene) => scene.kind === "task");
  const normalizedTitle = taskTitle.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const match = videos.find((scene) => scene.task_id === taskId)
    ?? videos.find((scene) => scene.task_index === taskIndex)
    ?? videos.find((scene) => normalizedTitle && scene.title.toLowerCase().includes(normalizedTitle));

  return match?.url ?? "";
}

function lessonWalkthroughVideo(render?: LessonRender | null) {
  return render?.render_json?.lesson_video_url
    ? {
        type: "video" as const,
        title: "Cyber Mentor lesson walkthrough",
        value: render.render_json.lesson_video_url,
        url: render.render_json.lesson_video_url,
        provider: "lesson-renderer",
        thumbnail_url: render.thumbnail_url ?? undefined,
        transcript: render.transcript_url ?? undefined,
      }
    : null;
}

function toCurriculumQuiz(lessonKey: string, lesson: LessonGeneratorOutput): CurriculumQuizJson {
  const questions = lesson.quiz.questions.length > 0 ? lesson.quiz.questions : fallbackQuizQuestions(lesson);

  return {
    id: `${lessonKey}-quiz`,
    questions: questions.map((question) => ({
      question: question.question,
      options: quizOptions(question),
      answer: quizAnswer(question),
      explanation: question.explanation ?? `Correct answer: ${quizAnswer(question)}`,
    })),
  };
}

function toCurriculumLesson(target: PublishTarget, lesson: LessonGeneratorOutput, render?: LessonRender | null): CurriculumLessonJson {
  const generatedBlocks = lesson.lesson_blocks.filter((block) => Boolean(block.value?.trim() || block.url?.trim()));
  const content = generatedBlocks.length > 0
    ? generatedBlocks
    : [
        { type: "learning_goal" as const, value: lesson.objective.join("\n") },
        { type: "text" as const, title: "Hook", value: lesson.hook },
        { type: "example" as const, title: "Teaching Steps", value: lesson.teaching_steps.join("\n") },
        { type: "task" as const, title: lesson.build_task.title ?? "Build Task", value: lesson.build_task.instructions?.join("\n") ?? lesson.build_task.expected_outcome ?? "" },
        { type: "recap" as const, value: lesson.recap },
      ];
  const intro = introVideo(render);
  const video = intro?.url
    ? {
        type: "video" as const,
        title: intro.title || "Cyber Mentor lesson intro",
        value: intro.url,
        url: intro.url,
        provider: "lesson-renderer",
        thumbnail_url: render?.thumbnail_url ?? undefined,
        transcript: render?.transcript_url ?? lesson.transcript,
      }
    : undefined;
  const lessonVideoBlock = lessonWalkthroughVideo(render);
  const curriculumContent = lessonVideoBlock ? [lessonVideoBlock, ...content] : content;
  const tasks = lesson.tasks.map((task, index) => {
    const renderedTaskVideoUrl = taskVideoUrl(index, task.task_id, task.title, render);
    return {
      ...task,
      video_url: renderedTaskVideoUrl || (isPlaceholderVideoUrl(task.video_url) ? "" : task.video_url),
    };
  });

  return {
    id: target.lesson_key,
    module_id: target.module_key,
    title: target.lesson_title || lesson.build_task.title || target.lesson_key,
    description: lesson.hook,
    estimated_minutes: Math.max(10, Math.round(lesson.tasks.length * 8)),
    objectives: lesson.objective,
    ...(video ? { video } : {}),
    content: curriculumContent,
    tasks,
    final_submission: lesson.final_submission,
    quiz: toCurriculumQuiz(target.lesson_key, lesson),
  };
}

async function nextVersion(supabase: ReturnType<typeof createClient>, table: "lesson_versions" | "quiz_versions", idField: "lesson_id" | "quiz_id", id: string) {
  const { data, error } = await supabase
    .from(table)
    .select("version_number")
    .eq(idField, id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.version_number ?? 0) + 1;
}

async function auditReview(
  supabase: ReturnType<typeof createClient>,
  status: LessonReviewStatus,
  generatedLessonId: string | null | undefined,
  storyboardId: string | null | undefined,
  note: string,
) {
  const { data: userResult } = await supabase.auth.getUser();
  await supabase.from("lesson_reviews").insert({
    generated_lesson_id: generatedLessonId ?? null,
    storyboard_id: storyboardId ?? null,
    status,
    note,
    created_by: userResult.user?.id ?? null,
  });
}

async function resolveCourseId(supabase: ReturnType<typeof createClient>, courseKey: string) {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("course_key", courseKey)
    .maybeSingle();

  if (error) return null;
  return typeof data?.id === "string" ? data.id : null;
}

function weekNumberFromModuleKey(moduleKey: string) {
  const match = moduleKey.match(/^week(\d+)/);
  return match ? Number(match[1]) : null;
}

export async function saveReviewEdits(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  note = "Saved review edits",
): Promise<LessonStudioActionResult<{ lesson: LessonGeneratorOutput; storyboard: LessonStoryboard | null }>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const supabase = createClient(await cookies());

  if (lesson.generated_lesson_id) {
    const { error } = await supabase
      .from("generated_lessons")
      .update({ generated_json: lesson, updated_at: new Date().toISOString() })
      .eq("id", lesson.generated_lesson_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  if (storyboard?.storyboard_id) {
    const { error } = await supabase
      .from("lesson_storyboards")
      .update({ storyboard_json: storyboard, updated_at: new Date().toISOString() })
      .eq("id", storyboard.storyboard_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  await auditReview(supabase, "in_review", lesson.generated_lesson_id, storyboard?.storyboard_id, note);
  revalidatePath("/admin/ai-lesson-generator");

  return { ok: true, data: { lesson, storyboard }, error: null };
}

export async function setLessonReviewStatus(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  status: LessonReviewStatus,
  note = "",
): Promise<LessonStudioActionResult<{ status: LessonReviewStatus }>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const supabase = createClient(await cookies());
  if (lesson.generated_lesson_id) {
    const { error } = await supabase
      .from("generated_lessons")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", lesson.generated_lesson_id);
    if (error) return { ok: false, data: null, error: error.message };
  }
  if (storyboard?.storyboard_id) {
    const { error } = await supabase
      .from("lesson_storyboards")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", storyboard.storyboard_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  await auditReview(supabase, status, lesson.generated_lesson_id, storyboard?.storyboard_id, note);
  revalidatePath("/admin/ai-lesson-generator");

  return { ok: true, data: { status }, error: null };
}

export async function publishReviewedLesson(
  lesson: LessonGeneratorOutput,
  storyboard: LessonStoryboard | null,
  target: PublishTarget,
  render?: LessonRender | null,
): Promise<LessonStudioActionResult<PublishResult>> {
  const role = await requireRole(["admin"]);
  if (!role) return { ok: false, data: null, error: "Admin access is required." };

  const normalizedTarget = {
    ...target,
    course_key: slug(target.course_key || "12-week-tech-foundations-accelerator"),
    module_key: slug(target.module_key),
    lesson_key: slug(target.lesson_key),
    lesson_order_index: Math.max(1, Math.round(target.lesson_order_index || 1)),
  };

  if (!normalizedTarget.module_key || !normalizedTarget.lesson_key) {
    return { ok: false, data: null, error: "Module key and lesson key are required." };
  }

  if (render && render.status !== "completed") {
    return { ok: false, data: null, error: "Wait for the MP4 render to complete before publishing this lesson." };
  }

  if (render && !render.render_json?.intro_video_url) {
    return { ok: false, data: null, error: "This render is missing the separate intro MP4. Prepare a new MP4 render before publishing." };
  }

  if (render && lesson.tasks.length > 0 && !hasSplitTaskVideos(render)) {
    return { ok: false, data: null, error: "This render is missing separate task videos. Prepare a new MP4 render before publishing." };
  }

  const curriculumLesson = toCurriculumLesson(normalizedTarget, lesson, render);
  const curriculumQuiz = toCurriculumQuiz(normalizedTarget.lesson_key, lesson);
  const lessonValidation = validateLessonJson(curriculumLesson);
  if (!lessonValidation.valid || !lessonValidation.data) {
    return { ok: false, data: null, error: lessonValidation.errors.join(" ") };
  }
  const quizValidation = validateQuizJson(curriculumQuiz);
  if (!quizValidation.valid || !quizValidation.data) {
    return { ok: false, data: null, error: quizValidation.errors.join(" ") };
  }

  const supabase = createClient(await cookies());
  const { data: userResult } = await supabase.auth.getUser();
  const courseId = await resolveCourseId(supabase, normalizedTarget.course_key);
  const weekNumber = weekNumberFromModuleKey(normalizedTarget.module_key);

  const { data: moduleRow, error: moduleError } = await supabase
    .from("modules")
    .upsert(
      {
        ...(courseId ? { course_id: courseId } : {}),
        module_key: normalizedTarget.module_key,
        title: normalizedTarget.module_title,
        description: normalizedTarget.module_description,
        order_index: weekNumber ?? 0,
        ...(weekNumber ? { week_number: weekNumber } : {}),
        is_published: true,
        metadata: {
          source: "lesson_studio_publish",
          course_key: normalizedTarget.course_key,
          generated_lesson_id: lesson.generated_lesson_id ?? null,
          storyboard_id: storyboard?.storyboard_id ?? null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_key" },
    )
    .select("id")
    .single();

  if (moduleError) return { ok: false, data: null, error: moduleError.message };

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .upsert(
      {
        module_id: moduleRow.id,
        lesson_key: normalizedTarget.lesson_key,
        title: lessonValidation.data.title,
        order_index: normalizedTarget.lesson_order_index,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_id,lesson_key" },
    )
    .select("id")
    .single();

  if (lessonError) return { ok: false, data: null, error: lessonError.message };

  const lessonVersionNumber = await nextVersion(supabase, "lesson_versions", "lesson_id", lessonRow.id);
  const { data: lessonVersion, error: lessonVersionError } = await supabase
    .from("lesson_versions")
    .insert({
      lesson_id: lessonRow.id,
      version_number: lessonVersionNumber,
      content_json: lessonValidation.data,
      created_by: userResult.user?.id ?? null,
    })
    .select("id, version_number")
    .single();

  if (lessonVersionError) return { ok: false, data: null, error: lessonVersionError.message };

  const { error: lessonUpdateError } = await supabase
    .from("lessons")
    .update({ current_version_id: lessonVersion.id, updated_at: new Date().toISOString() })
    .eq("id", lessonRow.id);

  if (lessonUpdateError) return { ok: false, data: null, error: lessonUpdateError.message };

  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .upsert({ lesson_id: lessonRow.id, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" })
    .select("id")
    .single();

  if (quizError) return { ok: false, data: null, error: quizError.message };

  const quizVersionNumber = await nextVersion(supabase, "quiz_versions", "quiz_id", quizRow.id);
  const { data: quizVersion, error: quizVersionError } = await supabase
    .from("quiz_versions")
    .insert({
      quiz_id: quizRow.id,
      version_number: quizVersionNumber,
      content_json: quizValidation.data,
      created_by: userResult.user?.id ?? null,
    })
    .select("id, version_number")
    .single();

  if (quizVersionError) return { ok: false, data: null, error: quizVersionError.message };

  const { error: quizUpdateError } = await supabase
    .from("quizzes")
    .update({ current_version_id: quizVersion.id, updated_at: new Date().toISOString() })
    .eq("id", quizRow.id);

  if (quizUpdateError) return { ok: false, data: null, error: quizUpdateError.message };

  if (lesson.generated_lesson_id) {
    const { error } = await supabase
      .from("generated_lessons")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", lesson.generated_lesson_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  if (storyboard?.storyboard_id) {
    const { error } = await supabase
      .from("lesson_storyboards")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", storyboard.storyboard_id);
    if (error) return { ok: false, data: null, error: error.message };
  }

  await auditReview(supabase, "published", lesson.generated_lesson_id, storyboard?.storyboard_id, `Published to ${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`);

  revalidatePath("/admin/ai-lesson-generator");
  revalidatePath("/admin/curriculum");
  revalidatePath("/learn");
  revalidatePath(`/learn/${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`);

  return {
    ok: true,
    data: {
      module_id: moduleRow.id,
      lesson_id: lessonRow.id,
      lesson_version_id: lessonVersion.id,
      lesson_version_number: lessonVersion.version_number,
      quiz_id: quizRow.id,
      quiz_version_id: quizVersion.id,
      quiz_version_number: quizVersion.version_number,
      lesson_url: `/learn/${normalizedTarget.module_key}/${normalizedTarget.lesson_key}`,
    },
    error: null,
  };
}
