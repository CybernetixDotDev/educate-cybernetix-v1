"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type LessonProgress = {
  id: string;
  student_id: string;
  module_key: string;
  lesson_key: string;
  lesson_title: string | null;
  status: string;
  progress_percent: number;
  time_spent_seconds: number;
  completed_steps: string[];
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UseLessonProgressOptions = {
  studentId: string | null;
  moduleId?: string | null;
};

export type CompleteLessonInput = {
  lesson_id: string;
  module_id?: string | null;
  lesson_title?: string | null;
  score?: number | null;
  completed_steps?: string[];
  metadata?: Record<string, unknown>;
};

export type UseLessonProgressResult = {
  progress: LessonProgress[];
  loading: boolean;
  error: string | null;
  completeLesson: (lesson_id: string, input?: Omit<CompleteLessonInput, "lesson_id">) => Promise<LessonProgress | null>;
  refresh: () => Promise<LessonProgress[]>;
};

export function useLessonProgress({
  studentId,
  moduleId = null,
}: UseLessonProgressOptions): UseLessonProgressResult {
  const supabase = useMemo(() => createClient(), []);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setProgress([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("lesson_progress")
        .select("*")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      if (moduleId) {
        query = query.eq("module_key", moduleId);
      }

      const { data, error: progressError } = await query;

      if (progressError) {
        throw progressError;
      }

      const rows = (data ?? []) as LessonProgress[];
      setProgress(rows);
      return rows;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load lesson progress";
      setError(message);
      setProgress([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [moduleId, studentId, supabase]);

  const completeLesson = useCallback(
    async (lesson_id: string, input: Omit<CompleteLessonInput, "lesson_id"> = {}) => {
      if (!studentId) {
        setError("Cannot complete a lesson without a student");
        return null;
      }

      const moduleKey = input.module_id ?? moduleId;

      if (!moduleKey) {
        setError("Cannot complete a lesson without a module_id");
        return null;
      }

      setError(null);

      try {
        const now = new Date().toISOString();
        const { data, error: updateError } = await supabase
          .from("lesson_progress")
          .upsert(
            {
              student_id: studentId,
              module_key: moduleKey,
              lesson_key: lesson_id,
              lesson_title: input.lesson_title ?? null,
              status: "completed",
              progress_percent: 100,
              score: input.score ?? null,
              completed_steps: input.completed_steps ?? [],
              completed_at: now,
              started_at: now,
              metadata: input.metadata ?? {},
              updated_at: now,
            },
            { onConflict: "student_id,module_key,lesson_key" },
          )
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        const row = data as LessonProgress;
        setProgress((current) => {
          const next = current.filter((item) => item.id !== row.id);
          return [row, ...next];
        });
        return row;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to complete lesson";
        setError(message);
        return null;
      }
    },
    [moduleId, studentId, supabase],
  );

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return {
    progress,
    loading,
    error,
    completeLesson,
    refresh,
  };
}
