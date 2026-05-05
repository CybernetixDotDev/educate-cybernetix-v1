import type { AdminParentLink } from "@/app/admin/page";
import Link from "next/link";

function studentName(link: AdminParentLink) {
  const nested = link.students;
  const student = Array.isArray(nested) ? nested[0] : nested;
  return student?.display_name ?? student?.email ?? link.student_id;
}

export function ParentOverview({ parentCount, parentLinks }: { parentCount: number; parentLinks: AdminParentLink[] }) {
  const mappedParents = new Set(parentLinks.map((link) => link.parent_user_id)).size;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Parent Management</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Parent links</h2>
          <p className="mt-2 text-sm text-slate-600">{mappedParents} of {parentCount} parent accounts have linked students.</p>
        </div>
        <Link href="/admin/roles" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
          Manage Links
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {parentLinks.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No parent-student links yet.</p>}
        {parentLinks.slice(0, 6).map((link) => (
          <div key={`${link.parent_user_id}-${link.student_id}`} className="rounded-lg border border-slate-100 p-3 text-sm">
            <p className="font-semibold text-slate-900">Parent {link.parent_user_id.slice(0, 8)}</p>
            <p className="mt-1 text-slate-500">Linked to {studentName(link)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

