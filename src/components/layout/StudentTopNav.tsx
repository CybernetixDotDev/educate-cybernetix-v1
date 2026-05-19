"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { useState } from "react";
import { StudentSidebar } from "./StudentSidebar";

type StudentTopNavProps = {
  studentName: string;
  avatarUrl?: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";
}

export function StudentTopNav({ studentName, avatarUrl }: StudentTopNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <StudentSidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-700"
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">{studentName}</p>
            <p className="text-xs font-semibold text-slate-500">Today&apos;s course work</p>
          </div>
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-black text-cyan-800">
                {initials(studentName)}
              </span>
            )}
            <SignOutButton
              label="Logout"
              signingOutLabel="..."
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </>
  );
}
