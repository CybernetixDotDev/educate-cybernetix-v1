"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "./assertAdmin";
import { createSupabaseAdminClient } from "./adminClient";
import type { RoleActionResult } from "./types";

export async function unlinkParentStudent(parentUserId: string, studentId: string): Promise<RoleActionResult> {
  try {
    await assertAdmin();

    if (!parentUserId || !studentId) {
      return { ok: false, message: "Select a linked student to remove." };
    }

    const admin = await createSupabaseAdminClient();
    const { error } = await admin
      .from("parent_students")
      .delete()
      .eq("parent_user_id", parentUserId)
      .eq("student_id", studentId);

    if (error) throw error;

    revalidatePath("/admin/roles");
    return { ok: true, message: "Parent-student link removed." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to unlink parent and student." };
  }
}

