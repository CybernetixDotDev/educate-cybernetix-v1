"use client";

import { ParentLinkManager } from "@/components/admin/roles/ParentLinkManager";
import { RoleEditor } from "@/components/admin/roles/RoleEditor";
import { UserList } from "@/components/admin/roles/UserList";
import type { AdminRoleUser, RoleActionResult } from "@/lib/admin/roles/types";
import { useMemo, useState } from "react";

type RoleManagementClientProps = {
  users: AdminRoleUser[];
};

export function RoleManagementClient({ users }: RoleManagementClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.user_id ?? null);
  const [result, setResult] = useState<RoleActionResult | null>(null);
  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) ?? null,
    [selectedUserId, users],
  );
  const studentUsers = useMemo(
    () => users.filter((user) => user.roles.includes("student") && user.student_profile_id),
    [users],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
      <UserList users={users} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />

      <div className="space-y-6">
        {result && (
          <div
            className={`rounded-lg border p-4 text-sm font-medium ${
              result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {result.message}
          </div>
        )}
        <RoleEditor user={selectedUser} onResult={setResult} />
        <ParentLinkManager user={selectedUser} students={studentUsers} onResult={setResult} />
      </div>
    </div>
  );
}

