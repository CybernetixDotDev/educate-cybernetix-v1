"use client";

import type { MentorMode } from "@/hooks/useMentor";
import { useMentor } from "@/hooks/useMentor";
import { MENTOR_IDENTITY } from "@/lib/mentor/identity";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type MentorQuickPanelProps = {
  studentId: string | null;
  moduleId: string;
};

export function MentorQuickPanel({ studentId, moduleId }: MentorQuickPanelProps) {
  const { messages, sendMessage, loading, error } = useMentor();
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<MentorMode>("teacher");
  const recentMessages = useMemo(() => messages.slice(-3), [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId || !draft.trim()) {
      return;
    }

    const sent = await sendMessage({
      student_id: studentId,
      mode,
      module_id: moduleId,
      student_message: draft,
    });

    if (sent) {
      setDraft("");
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 ring-1 ring-teal-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MENTOR_IDENTITY.poses.encouraging} alt="Zylo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">{MENTOR_IDENTITY.name}</h2>
            <p className="text-sm text-slate-500">Ask for a hint, code review, or project nudge.</p>
          </div>
        </div>
        <Link
          href="/mentor"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
        >
          Open Zylo
        </Link>
      </div>

      <div className="mt-5 min-h-32 space-y-3 rounded-lg bg-slate-50 p-3">
        {recentMessages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. Try asking what to focus on next.</p>
        ) : (
          recentMessages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.role === "student"
                  ? "ml-6 bg-cyan-600 text-white"
                  : message.role === "mentor"
                    ? "mr-6 bg-white text-slate-700 shadow-sm"
                    : "bg-rose-50 text-rose-700"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["teacher", "quiz", "builder", "debug"] satisfies MentorMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                mode === item ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-800 hover:bg-teal-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={studentId ? "Ask Zylo..." : "Sign in to ask Zylo"}
            disabled={!studentId || loading}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!studentId || !draft.trim() || loading}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </section>
  );
}
