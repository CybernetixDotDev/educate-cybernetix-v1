"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ProjectTask = {
  id: string;
  student_project_id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  required_skills: string[];
  evidence: Record<string, unknown>;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentProject = {
  id: string;
  student_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  status: string;
  difficulty_level: string | null;
  technologies: string[];
  repository_url: string | null;
  demo_url: string | null;
  project_data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project_tasks?: ProjectTask[];
};

export type UseProjectProgressOptions = {
  studentId: string | null;
  projectId?: string | null;
};

export type UseProjectProgressResult = {
  project: StudentProject | null;
  tasks: ProjectTask[];
  loading: boolean;
  error: string | null;
  completeTask: (task_id: string, evidence?: Record<string, unknown>) => Promise<ProjectTask | null>;
  refresh: () => Promise<StudentProject | null>;
};

export function useProjectProgress({
  studentId,
  projectId = null,
}: UseProjectProgressOptions): UseProjectProgressResult {
  const supabase = useMemo(() => createClient(), []);
  const [project, setProject] = useState<StudentProject | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setProject(null);
      setTasks([]);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("student_projects")
        .select("*, project_tasks(*)")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      query = projectId ? query.eq("id", projectId).limit(1) : query.limit(1);

      const { data, error: projectError } = await query.maybeSingle();

      if (projectError) {
        throw projectError;
      }

      const row = data as StudentProject | null;
      const sortedTasks = [...(row?.project_tasks ?? [])].sort((left, right) => left.position - right.position);

      setProject(row);
      setTasks(sortedTasks);
      return row;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load project progress";
      setError(message);
      setProject(null);
      setTasks([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId, studentId, supabase]);

  const completeTask = useCallback(
    async (task_id: string, evidence: Record<string, unknown> = {}) => {
      setError(null);

      try {
        const now = new Date().toISOString();
        const { data, error: taskError } = await supabase
          .from("project_tasks")
          .update({
            status: "completed",
            completed_at: now,
            evidence,
            updated_at: now,
          })
          .eq("id", task_id)
          .select()
          .single();

        if (taskError) {
          throw taskError;
        }

        const row = data as ProjectTask;
        setTasks((current) =>
          current
            .map((task) => (task.id === row.id ? row : task))
            .sort((left, right) => left.position - right.position),
        );

        return row;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to complete task";
        setError(message);
        return null;
      }
    },
    [supabase],
  );

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return {
    project,
    tasks,
    loading,
    error,
    completeTask,
    refresh,
  };
}
