import "server-only";

import type { AppRole } from "@/lib/auth/roles";
import { assertAdmin } from "./assertAdmin";
import { createSupabaseAdminClient } from "./adminClient";
import type { AdminRoleUser } from "./types";

type StudentRow = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  email: string | null;
};

type RoleRow = {
  user_id: string;
  role: AppRole;
};

type ParentStudentRow = {
  parent_user_id: string;
  student_id: string;
};

function displayNameFromMetadata(metadata: Record<string, unknown> | undefined, email: string | null) {
  const value =
    metadata?.display_name ??
    metadata?.full_name ??
    metadata?.name ??
    metadata?.preferred_username ??
    email?.split("@")[0];

  return typeof value === "string" && value.trim().length > 0 ? value : "Unnamed user";
}

export async function getAllUsers(): Promise<AdminRoleUser[]> {
  await assertAdmin();

  const admin = await createSupabaseAdminClient();
  const authUsers = [];
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    authUsers.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  const [{ data: roleRows, error: rolesError }, { data: studentRows, error: studentsError }, { data: links, error: linksError }] =
    await Promise.all([
      admin.from("user_roles").select("user_id, role"),
      admin.from("students").select("id, user_id, display_name, email").order("display_name", { ascending: true }),
      admin.from("parent_students").select("parent_user_id, student_id"),
    ]);

  if (rolesError) throw new Error(rolesError.message);
  if (studentsError) throw new Error(studentsError.message);
  if (linksError) throw new Error(linksError.message);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of (roleRows ?? []) as RoleRow[]) {
    rolesByUser.set(row.user_id, [row.role]);
  }

  const studentByUser = new Map<string, StudentRow>();
  const studentById = new Map<string, StudentRow>();
  for (const student of (studentRows ?? []) as StudentRow[]) {
    if (student.user_id) studentByUser.set(student.user_id, student);
    studentById.set(student.id, student);
  }

  const linksByParent = new Map<string, AdminRoleUser["linked_students"]>();
  for (const link of (links ?? []) as ParentStudentRow[]) {
    const student = studentById.get(link.student_id);
    const existing = linksByParent.get(link.parent_user_id) ?? [];
    existing.push({
      student_id: link.student_id,
      display_name: student?.display_name ?? "Unknown student",
      email: student?.email ?? null,
    });
    linksByParent.set(link.parent_user_id, existing);
  }

  return authUsers
    .map((user) => {
      const email = user.email ?? null;
      const student = studentByUser.get(user.id);

      return {
        user_id: user.id,
        email,
        display_name: student?.display_name ?? displayNameFromMetadata(user.user_metadata, email),
        roles: rolesByUser.get(user.id) ?? [],
        student_profile_id: student?.id ?? null,
        linked_students: linksByParent.get(user.id) ?? [],
      };
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}

