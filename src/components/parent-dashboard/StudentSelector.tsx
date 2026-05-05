"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type LinkedStudentOption = {
  id: string;
  display_name: string;
  email: string | null;
};

type StudentSelectorProps = {
  students: LinkedStudentOption[];
  selectedStudentId: string;
};

export function StudentSelector({ students, selectedStudentId }: StudentSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="block">
      <span className="sr-only">Select student</span>
      <select
        value={selectedStudentId}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("studentId", event.target.value);
          router.push(`/parent/dashboard?${params.toString()}`);
        }}
        className="w-full rounded-md border border-white/20 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200 sm:min-w-64"
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.display_name}
            {student.email ? ` (${student.email})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

