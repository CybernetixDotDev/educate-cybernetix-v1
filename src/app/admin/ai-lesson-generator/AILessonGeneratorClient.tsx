"use client";

import { GenerationActions } from "@/components/ai-lesson-generator/GenerationActions";
import { GenerationForm, type ModuleOption } from "@/components/ai-lesson-generator/GenerationForm";
import { GeneratedLessonPreview } from "@/components/ai-lesson-generator/GeneratedLessonPreview";
import { generateLesson, type GeneratedLesson, type LessonGenerationInput } from "@/lib/ai/generateLesson";
import { generateLessonContent } from "@/lib/ai/generateLessonContent";
import { generateLessonMetadata } from "@/lib/ai/generateLessonMetadata";
import { generateLessonQuiz } from "@/lib/ai/generateLessonQuiz";
import { saveGeneratedLesson } from "@/lib/ai/saveGeneratedLesson";
import { useState } from "react";

type AILessonGeneratorClientProps = {
  modules: ModuleOption[];
};

const DEFAULT_INPUT: LessonGenerationInput = {
  module_id: "",
  lesson_title: "",
  difficulty_level: "beginner",
  learning_objectives: [],
};

function mergeContent(current: GeneratedLesson, generated: GeneratedLesson): GeneratedLesson {
  return {
    ...current,
    body: generated.body,
    codeExamples: generated.codeExamples,
    images: generated.images,
  };
}

function mergeQuiz(current: GeneratedLesson, generated: GeneratedLesson): GeneratedLesson {
  return {
    ...current,
    quiz: generated.quiz,
  };
}

function mergeMetadata(current: GeneratedLesson, generated: GeneratedLesson): GeneratedLesson {
  return {
    ...current,
    metadata: {
      ...current.metadata,
      ...generated.metadata,
      module_id: current.metadata.module_id,
      lesson_id: generated.metadata.lesson_id || current.metadata.lesson_id,
    },
  };
}

export function AILessonGeneratorClient({ modules }: AILessonGeneratorClientProps) {
  const [input, setInput] = useState<LessonGenerationInput>(DEFAULT_INPUT);
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateInput() {
    if (!input.module_id || !input.lesson_title || input.learning_objectives.length === 0) {
      setError("module_id, lesson_title, and at least one learning objective are required");
      return false;
    }

    return true;
  }

  async function runGeneration(task: () => Promise<{ ok: boolean; lesson: GeneratedLesson | null; error: string | null }>, success: string) {
    if (!validateInput()) {
      return null;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await task();

      if (!result.ok || !result.lesson) {
        setError(result.error ?? "Generation failed");
        return null;
      }

      setStatus(success);
      return result.lesson;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    const generated = await runGeneration(() => generateLesson(input), "Lesson generated");

    if (generated) {
      setLesson(generated);
    }
  }

  async function handleRegenerateContent() {
    if (!lesson) {
      return;
    }

    const generated = await runGeneration(() => generateLessonContent(input), "Content regenerated");

    if (generated) {
      setLesson(mergeContent(lesson, generated));
    }
  }

  async function handleRegenerateQuiz() {
    if (!lesson) {
      return;
    }

    const generated = await runGeneration(() => generateLessonQuiz(input), "Quiz regenerated");

    if (generated) {
      setLesson(mergeQuiz(lesson, generated));
    }
  }

  async function handleRegenerateMetadata() {
    if (!lesson) {
      return;
    }

    const generated = await runGeneration(() => generateLessonMetadata(input), "Metadata regenerated");

    if (generated) {
      setLesson(mergeMetadata(lesson, generated));
    }
  }

  async function handleSave() {
    if (!lesson) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await saveGeneratedLesson(lesson);

      if (!result.ok) {
        setError(result.error ?? "Save failed");
        return;
      }

      setStatus("Generated lesson saved to Supabase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <GenerationForm modules={modules} value={input} onChange={setInput} />
      <GenerationActions
        hasLesson={Boolean(lesson)}
        loading={loading}
        onGenerate={() => void handleGenerate()}
        onRegenerateContent={() => void handleRegenerateContent()}
        onRegenerateQuiz={() => void handleRegenerateQuiz()}
        onRegenerateMetadata={() => void handleRegenerateMetadata()}
        onSave={() => void handleSave()}
      />

      {loading && <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">Generating...</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}

      <GeneratedLessonPreview lesson={lesson} onChange={setLesson} />
    </div>
  );
}
