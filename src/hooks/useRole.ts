"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRole = "student" | "parent" | "admin";

export type UseRoleResult = {
  role: AppRole | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<AppRole | null>;
};

export function dashboardPathForRole(role: AppRole | null) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parent/dashboard";
  return "/dashboard";
}

export function useRole(): UseRoleResult {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();

      if (userError?.message === "Auth session missing!" || !userResult.user) {
        setRole(null);
        return null;
      }

      if (userError) throw userError;

      const { data, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userResult.user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      const nextRole = data?.role === "admin" || data?.role === "parent" || data?.role === "student" ? data.role : "student";
      setRole(nextRole);
      return nextRole;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load role";
      setError(message);
      setRole(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return { role, loading, error, refresh };
}
