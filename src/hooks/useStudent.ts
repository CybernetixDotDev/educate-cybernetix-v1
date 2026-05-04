"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type Student = {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  email: string | null;
  date_of_birth: string | null;
  grade_level: string | null;
  avatar_url: string | null;
  parent_name: string | null;
  parent_email: string | null;
  learning_goals: string[];
  accessibility_preferences: Record<string, unknown>;
  profile_metadata: Record<string, unknown>;
  enrolled_at: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UseStudentResult = {
  student: Student | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<Student | null>;
};

export function useStudent(): UseStudentResult {
  const supabase = useMemo(() => createClient(), []);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();

      if (userError?.message === "Auth session missing!") {
        setStudent(null);
        return null;
      }

      if (userError) {
        throw userError;
      }

      if (!userResult.user) {
        setStudent(null);
        return null;
      }

      const { data, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userResult.user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      setStudent(data as Student | null);
      return data as Student | null;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load student";
      setError(message);
      setStudent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return {
    student,
    loading,
    error,
    refresh,
  };
}
