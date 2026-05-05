"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "./assertAdmin";
import { createSupabaseAdminClient } from "./adminClient";
import type { RoleActionResult } from "./types";

export async function linkParentStudent(parentUserId: string, studentId: string): Promise<RoleActionResult> {
  try {
    await assertAdmin();

    if (!parentUserId || !studentId) {
      return { ok: false, message: "Select both a parent and a student." };
    }

    const admin = await createSupabaseAdminClient();
    const [{ data: parentRole, error: parentError }, { data: student, error: studentError }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", parentUserId).maybeSingle(),
      admin.from("students").select("id, user_id").eq("id", studentId).maybeSingle(),
    ]);

    if (parentError) throw parentError;
    if (studentError) throw studentError;

    if (parentRole?.role !== "parent") {
      return { ok: false, message: "The selected parent account must have the parent role first." };
    }

    if (!student?.user_id) {
      return { ok: false, message: "The selected student profile is not linked to an auth user." };
    }

    const { data: studentRole, error: studentRoleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", student.user_id)
      .maybeSingle();

    if (studentRoleError) throw studentRoleError;
    if (studentRole?.role !== "student") {
      return { ok: false, message: "The selected student profile must belong to a user with the student role." };
    }

    const { error } = await admin
      .from("parent_students")
      .upsert({ parent_user_id: parentUserId, student_id: studentId }, { onConflict: "parent_user_id,student_id" });

    if (error) throw error;

    revalidatePath("/admin/roles");
    return { ok: true, message: "Parent linked to student." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to link parent and student." };
  }
}

