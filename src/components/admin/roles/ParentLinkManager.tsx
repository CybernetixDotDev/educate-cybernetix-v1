"use client";

import { linkParentStudent } from "@/lib/admin/roles/linkParentStudent";
import type { AdminRoleUser, RoleActionResult } from "@/lib/admin/roles/types";
import { unlinkParentStudent } from "@/lib/admin/roles/unlinkParentStudent";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ParentLinkManagerProps = {
  user: AdminRoleUser | null;
  students: AdminRoleUser[];
  onResult: (result: RoleActionResult) => void;
};

export function ParentLinkManager({ user, students, onResult }: ParentLinkManagerProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [isPending, startTransition] = useTransition();
  const isParent = user?.roles.includes("parent") ?? false;
  const availableStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.student_profile_id && !user?.linked_students.some((linked) => linked.student_id === student.student_profile_id),
      ),
    [students, user],
  );

  if (!user) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Parent Student Links</h2>
        <p className="mt-2 text-sm text-slate-500">Select a parent account to manage links.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Parent Student Links</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isParent ? "Connect this parent to one or more student profiles." : "Assign the parent role before linking students."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {user.linked_students.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No linked students.
          </div>
        ) : (
          user.linked_students.map((student) => (
            <div
              key={student.student_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{student.display_name}</p>
                <p className="truncate text-sm text-slate-500">{student.email ?? student.student_id}</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await unlinkParentStudent(user.user_id, student.student_id);
                    onResult(result);
                    router.refresh();
                  });
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Unlink
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Student</span>
          <select
            value={studentId}
            disabled={!isParent}
            onChange={(event) => setStudentId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
          >
            <option value="">Select a student</option>
            {availableStudents.map((student) => (
              <option key={student.student_profile_id} value={student.student_profile_id ?? ""}>
                {student.display_name} {student.email ? `(${student.email})` : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isPending || !isParent || !studentId}
          onClick={() => {
            startTransition(async () => {
              const result = await linkParentStudent(user.user_id, studentId);
              onResult(result);
              if (result.ok) setStudentId("");
              router.refresh();
            });
          }}
          className="self-end rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Link Student"}
        </button>
      </div>
    </section>
  );
}

