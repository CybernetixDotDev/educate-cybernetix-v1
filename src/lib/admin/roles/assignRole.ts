"use server";

import type { AppRole } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "./assertAdmin";
import { createSupabaseAdminClient } from "./adminClient";
import type { RoleActionResult } from "./types";

function isAppRole(value: string): value is AppRole {
  return value === "student" || value === "parent" || value === "admin";
}

export async function assignRole(userId: string, role: AppRole): Promise<RoleActionResult> {
  try {
    await assertAdmin();

    if (!userId || !isAppRole(role)) {
      return { ok: false, message: "Select a valid user and role." };
    }

    const admin = await createSupabaseAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.role === role) {
      return { ok: true, message: "That role is already assigned." };
    }

    const { error } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (error) throw error;

    revalidatePath("/admin/roles");
    return { ok: true, message: `Role updated to ${role}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to assign role." };
  }
}

