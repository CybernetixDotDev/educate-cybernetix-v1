import type { AdminRoleRow } from "@/app/admin/page";
import Link from "next/link";

export function RoleManagementSnapshot({ roles }: { roles: AdminRoleRow[] }) {
  const counts = {
    student: roles.filter((role) => role.role === "student").length,
    parent: roles.filter((role) => role.role === "parent").length,
    admin: roles.filter((role) => role.role === "admin").length,
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Role Management</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Access snapshot</h2>
        </div>
        <Link href="/admin/roles" className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
          Open Role Manager
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <RoleCount label="Students" value={counts.student} />
        <RoleCount label="Parents" value={counts.parent} />
        <RoleCount label="Admins" value={counts.admin} />
      </div>
    </section>
  );
}

function RoleCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

