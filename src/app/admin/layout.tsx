import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { requireRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const role = await requireRole(["admin"]);

  if (!role) {
    redirect("/auth?next=/admin");
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-950 lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminTopBar />
        {children}
      </div>
    </div>
  );
}
