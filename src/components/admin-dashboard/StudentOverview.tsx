import type { AdminStudentRow } from "@/app/admin/page";
import Link from "next/link";

export function StudentOverview({ students, totalStudents }: { students: AdminStudentRow[]; totalStudents: number }) {
  const completed = students.filter((student) => student.onboarding_complete).length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Student Management</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Newest students</h2>
          <p className="mt-2 text-sm text-slate-600">{completed} of {students.length} recent students completed onboarding.</p>
        </div>
        <Link href="/admin/students" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          View All
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {students.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No students yet.</p>}
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{student.display_name}</p>
              <p className="truncate text-xs text-slate-500">{student.email ?? "No email"} · {new Date(student.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${student.onboarding_complete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {student.onboarding_complete ? "Onboarded" : "Pending"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">Total student profiles: {totalStudents}</p>
    </section>
  );
}

