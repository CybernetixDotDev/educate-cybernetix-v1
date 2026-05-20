"use client";

import type { MentorMode } from "@/hooks/useMentor";
import { useMentor } from "@/hooks/useMentor";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type MentorInlinePanelProps = {
  studentId: string | null;
  moduleId: string;
  lessonId: string;
  projectId?: string | null;
  mode?: MentorMode;
};

export function MentorInlinePanel({
  studentId,
  moduleId,
  lessonId,
  projectId = null,
  mode = "teacher",
}: MentorInlinePanelProps) {
  const { messages, sendMessage, loading, error } = useMentor();
  const [draft, setDraft] = useState("");
  const recentMessages = useMemo(() => messages.slice(-5), [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId || !draft.trim()) {
      return;
    }

    const response = await sendMessage({
      student_id: studentId,
      mode,
      module_id: moduleId,
      lesson_id: lessonId,
      project_id: projectId,
      student_message: draft,
    });

    if (response) {
      setDraft("");
    }
  }

  return (
    <aside className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">Your coach</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Cyber Mentor</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Ask for a hint, a metaphor, or one small next step.</p>
        </div>
        <Link
          href="/mentor"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
        >
          Open Chat
        </Link>
      </div>

      <div className="mt-4 min-h-40 space-y-3 rounded-2xl bg-teal-50/60 p-3">
        {recentMessages.length === 0 ? (
          <p className="text-sm leading-6 text-slate-600">
            Try: “Explain this like I’m building my first website” or “What should I do next?”
          </p>
        ) : (
          recentMessages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.role === "student"
                  ? "ml-6 bg-teal-600 text-white"
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
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          disabled={!studentId || loading}
          placeholder={studentId ? "What are you stuck on?" : "Sign in to ask the mentor"}
          className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!studentId || !draft.trim() || loading}
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Thinking..." : "Ask for help"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </aside>
  );
}
