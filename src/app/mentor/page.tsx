"use client";

import { ChatInput } from "@/components/mentor/ChatInput";
import { ChatMessage } from "@/components/mentor/ChatMessage";
import { TypingIndicator } from "@/components/mentor/TypingIndicator";
import { useMentor } from "@/hooks/useMentor";
import { useStudent } from "@/hooks/useStudent";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef } from "react";

function MentorChatPageContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module_id") ?? searchParams.get("moduleId") ?? "general";
  const lessonId = searchParams.get("lesson_id") ?? searchParams.get("lessonId");
  const projectId = searchParams.get("project_id") ?? searchParams.get("projectId");
  const intent = searchParams.get("intent") as "lesson" | "quiz" | "project" | "debug" | "review" | "presentation" | "coach" | null;
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { messages, sendMessage, loading, error, mode } = useMentor();
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const promptSuggestions = useMemo(() => {
    if (intent === "debug") return ["My code is broken. Help me find the cause.", "This error keeps appearing. What should I check first?", "Explain this stack trace in simple steps."];
    if (intent === "review") return ["Review this code for clarity and quality.", "How can I make this component cleaner?", "Check my code for accessibility or security issues."];
    if (intent === "project") return ["What project task should I do next?", "Help me plan the next feature.", "Turn my project idea into a simple MVP plan."];
    if (intent === "presentation") return ["Help me explain my project clearly.", "Create a demo walkthrough for my project.", "What questions might I get after presenting?"];
    if (intent === "quiz") return ["Quiz me on this module.", "Explain the question I got wrong.", "Give me practice questions before the checkpoint."];
    return [
      "Explain this lesson like I am new to it.",
      "My code is not working. Help me debug it.",
      "Help me choose the next project task.",
    ];
  }, [intent]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [loading, messages.length]);

  async function handleSend(message: string) {
    if (!student) {
      return;
    }

    await sendMessage({
      student_id: student.id,
      mode,
      module_id: moduleId,
      lesson_id: lessonId,
      project_id: projectId,
      intent_hint: intent,
      student_message: message,
    });
  }

  return (
    <main className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-cyan-50 to-violet-50 text-slate-950">
      <header className="border-b border-white/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-lg font-black text-white shadow-sm">
              AI
            </div>
            <div>
              <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-950">Cyber Mentor</h1>
                <Link href="/dashboard" className="hidden text-sm font-semibold text-cyan-700 hover:text-cyan-900 sm:inline">
                  Dashboard
                </Link>
              </div>
              <p className="text-sm text-slate-500">
                {studentLoading ? "Loading your profile..." : student ? `Chatting with ${student.display_name}` : "Sign in to chat"}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
            Auto-routes to: <span className="text-slate-950">{mode}</span>
          </div>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">One mentor, the right help</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Tell Cyber Mentor what you are working on or where you are stuck.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              It will route the request internally to teaching, quiz coaching, project planning, debugging, code review, or presentation help.
            </p>
          </div>

          {studentError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{studentError}</div>
          )}
          {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

          <div className="flex flex-1 flex-col gap-4">
            {messages.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={!student || loading}
                    className="rounded-2xl border border-white/80 bg-white/80 p-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} scrollAnchorRef={scrollAnchorRef} />
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>
        </div>
      </section>

      <footer className="sticky bottom-0 border-t border-white/70 bg-white/85 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ChatInput
            disabled={!student || loading}
            placeholder={student ? "Ask Cyber Mentor anything about the lesson, project, code, quiz, or presentation..." : "Sign in to ask your mentor"}
            onSend={handleSend}
          />
        </div>
      </footer>
    </main>
  );
}

function MentorFallback() {
  return (
    <main className="flex h-screen flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto h-12 max-w-6xl animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-6 py-6">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white" />
        <div className="ml-auto h-16 w-2/3 animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

export default function MentorPage() {
  return (
    <Suspense fallback={<MentorFallback />}>
      <MentorChatPageContent />
    </Suspense>
  );
}
