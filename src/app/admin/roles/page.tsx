import { RoleManagementClient } from "@/app/admin/roles/RoleManagementClient";
import { getAllUsers } from "@/lib/admin/roles/getAllUsers";
import { requireRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function RoleManagementPanel() {
  let users;

  try {
    users = await getAllUsers();
  } catch (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-950">Role data could not be loaded</h2>
        <p className="mt-2">
          {error instanceof Error ? error.message : "Unable to load users and role relationships."}
        </p>
        <p className="mt-3 text-rose-700">
          This screen needs a server-only Supabase service key because Supabase Auth users cannot be listed from the
          browser client.
        </p>
      </div>
    );
  }

  return <RoleManagementClient users={users} />;
}

export default async function AdminRolesPage() {
  const role = await requireRole(["admin"]);

  if (!role) {
    redirect("/auth?next=/admin/roles");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Access Control</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Role Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Manage student, parent, and admin access, then link parent accounts to student profiles for reporting.
            </p>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading users and role relationships...
            </div>
          }
        >
          <RoleManagementPanel />
        </Suspense>
      </div>
    </main>
  );
}
