"use client";

import type { AdminRoleUser } from "@/lib/admin/roles/types";

type UserListProps = {
  users: AdminRoleUser[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
};

function roleBadge(role: string) {
  const classes =
    role === "admin"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : role === "parent"
        ? "bg-violet-50 text-violet-700 ring-violet-200"
        : "bg-cyan-50 text-cyan-700 ring-cyan-200";

  return (
    <span key={role} className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${classes}`}>
      {role}
    </span>
  );
}

export function UserList({ users, selectedUserId, onSelectUser }: UserListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-950">Users</h2>
        <p className="mt-1 text-sm text-slate-500">Select an account to edit its role or parent links.</p>
      </div>
      <div className="max-h-[680px] divide-y divide-slate-100 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No users found.</div>
        ) : (
          users.map((user) => {
            const selected = user.user_id === selectedUserId;

            return (
              <button
                key={user.user_id}
                type="button"
                onClick={() => onSelectUser(user.user_id)}
                className={`block w-full px-4 py-4 text-left transition ${
                  selected ? "bg-cyan-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{user.display_name}</p>
                    <p className="truncate text-sm text-slate-500">{user.email ?? "No email on auth user"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {user.roles.length > 0 ? user.roles.map(roleBadge) : roleBadge("no role")}
                  </div>
                </div>
                {user.linked_students.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Linked students: {user.linked_students.map((student) => student.display_name).join(", ")}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

