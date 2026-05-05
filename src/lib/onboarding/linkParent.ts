import "server-only";

import { createSupabaseAdminClient } from "@/lib/admin/roles/adminClient";

type LinkParentInput = {
  parentEmail: string;
  studentId: string;
};

export async function linkParent({ parentEmail, studentId }: LinkParentInput) {
  const normalizedEmail = parentEmail.trim().toLowerCase();
  if (!normalizedEmail) return;

  const admin = await createSupabaseAdminClient();
  const { data: users, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (userError) throw new Error(userError.message);

  const parentUser = users.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
  if (!parentUser) return;

  const { data: roleRow, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", parentUser.id)
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);
  if (roleRow?.role !== "parent") return;

  const { error } = await admin
    .from("parent_students")
    .upsert({ parent_user_id: parentUser.id, student_id: studentId }, { onConflict: "parent_user_id,student_id" });

  if (error) throw new Error(error.message);
}

