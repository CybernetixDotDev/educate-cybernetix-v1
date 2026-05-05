"use server";

import { dashboardPathForRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { linkParent } from "./linkParent";
import type { OnboardingData, OnboardingResult } from "./types";

function validEmail(value: string) {
  return value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeGoals(goals: string[]) {
  return goals.map((goal) => goal.trim()).filter(Boolean).slice(0, 8);
}

export async function saveOnboardingData(input: OnboardingData): Promise<OnboardingResult> {
  try {
    const displayName = input.display_name.trim();
    const gradeLevel = input.grade_level.trim();
    const learningGoals = sanitizeGoals(input.learning_goals);
    const parentEmail = input.parent_email.trim().toLowerCase();
    const projectPreference = input.project_preference.trim();

    if (displayName.length < 2) {
      return { ok: false, message: "Add a display name with at least 2 characters." };
    }

    if (!gradeLevel) {
      return { ok: false, message: "Select a grade level." };
    }

    if (learningGoals.length === 0) {
      return { ok: false, message: "Choose at least one learning goal." };
    }

    if (!validEmail(parentEmail)) {
      return { ok: false, message: "Enter a valid parent email or leave it blank." };
    }

    if (!projectPreference) {
      return { ok: false, message: "Select a project preference." };
    }

    const supabase = createClient(await cookies());
    const { data: userResult, error: userError } = await supabase.auth.getUser();

    if (userError || !userResult.user) {
      return { ok: false, message: "You must be signed in to finish onboarding." };
    }

    const now = new Date().toISOString();
    const { data: student, error: studentError } = await supabase
      .from("students")
      .upsert(
        {
          user_id: userResult.user.id,
          display_name: displayName,
          email: userResult.user.email ?? null,
          grade_level: gradeLevel,
          learning_goals: learningGoals,
          parent_email: parentEmail || null,
          project_preference: projectPreference,
          onboarding_complete: true,
          onboarding_completed_at: now,
          last_active_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    if (studentError) {
      return { ok: false, message: studentError.message };
    }

    await supabase
      .from("user_roles")
      .upsert({ user_id: userResult.user.id, role: "student", updated_at: now }, { onConflict: "user_id" });

    if (parentEmail) {
      await linkParent({ parentEmail, studentId: student.id });
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userResult.user.id)
      .maybeSingle();

    return {
      ok: true,
      message: "Onboarding complete.",
      dashboard_path: dashboardPathForRole(roleRow?.role ?? "student"),
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save onboarding." };
  }
}

