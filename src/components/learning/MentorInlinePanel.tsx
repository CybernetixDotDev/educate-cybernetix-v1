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
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Ask Mentor</h2>
          <p className="mt-1 text-sm text-slate-500">Get a hint without leaving the lesson.</p>
        </div>
        <Link
          href="/mentor"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
        >
          Open Full Mentor
        </Link>
      </div>

      <div className="mt-4 min-h-40 space-y-3 rounded-lg bg-slate-50 p-3">
        {recentMessages.length === 0 ? (
          <p className="text-sm text-slate-500">Ask for a hint, an example, or a quick check of your idea.</p>
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
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          disabled={!studentId || loading}
          placeholder={studentId ? "What are you stuck on?" : "Sign in to ask the mentor"}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!studentId || !draft.trim() || loading}
          className="w-full rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </aside>
  );
}
