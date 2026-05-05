import type { AppRole } from "@/lib/auth/roles";

export type AdminRoleUser = {
  user_id: string;
  email: string | null;
  display_name: string;
  roles: AppRole[];
  student_profile_id: string | null;
  linked_students: Array<{
    student_id: string;
    display_name: string;
    email: string | null;
  }>;
};

export type RoleActionResult = {
  ok: boolean;
  message: string;
};

