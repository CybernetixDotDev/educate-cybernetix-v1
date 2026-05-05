"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "./assertAdmin";
import { createSupabaseAdminClient } from "./adminClient";
import type { RoleActionResult } from "./types";

export async function removeRole(userId: string): Promise<RoleActionResult> {
  try {
    const adminUser = await assertAdmin();

    if (!userId) {
      return { ok: false, message: "Select a valid user." };
    }

    if (adminUser.id === userId) {
      return { ok: false, message: "You cannot remove your own admin role from this screen." };
    }

    const admin = await createSupabaseAdminClient();
    const { error: linkError } = await admin.from("parent_students").delete().eq("parent_user_id", userId);
    if (linkError) throw linkError;

    const { error } = await admin.from("user_roles").delete().eq("user_id", userId);
    if (error) throw error;

    revalidatePath("/admin/roles");
    return { ok: true, message: "Role removed." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to remove role." };
  }
}

