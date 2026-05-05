"use client";

import { assignRole } from "@/lib/admin/roles/assignRole";
import { removeRole } from "@/lib/admin/roles/removeRole";
import type { AdminRoleUser, RoleActionResult } from "@/lib/admin/roles/types";
import type { AppRole } from "@/lib/auth/roles";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type RoleEditorProps = {
  user: AdminRoleUser | null;
  onResult: (result: RoleActionResult) => void;
};

const ROLE_OPTIONS: AppRole[] = ["student", "parent", "admin"];

export function RoleEditor({ user, onResult }: RoleEditorProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppRole>("student");
  const [isPending, startTransition] = useTransition();
  const currentRole = useMemo(() => user?.roles[0] ?? null, [user]);

  if (!user) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Role Editor</h2>
        <p className="mt-2 text-sm text-slate-500">Select a user to manage roles.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Role Editor</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email ?? user.user_id}</p>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current role</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{currentRole ?? "No role assigned"}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Assign role</span>
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as AppRole)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await assignRole(user.user_id, selectedRole);
              onResult(result);
              router.refresh();
            });
          }}
          className="self-end rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Assign Role"}
        </button>

        <button
          type="button"
          disabled={isPending || !currentRole}
          onClick={() => {
            startTransition(async () => {
              const result = await removeRole(user.user_id);
              onResult(result);
              router.refresh();
            });
          }}
          className="self-end rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Remove Role
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        This project currently stores one effective role per user. Assigning a role replaces the previous role.
      </p>
    </section>
  );
}

