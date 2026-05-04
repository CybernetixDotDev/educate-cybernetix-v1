"use client";

import { ChatMessage } from "@/components/mentor/ChatMessage";
import { TypingIndicator } from "@/components/mentor/TypingIndicator";
import { useMentor } from "@/hooks/useMentor";
import { useEffect, useRef, useState } from "react";

type BuilderChatPanelProps = {
  studentId: string | null;
  projectId: string | null;
};

export function BuilderChatPanel({ studentId, projectId }: BuilderChatPanelProps) {
  const { messages, sendMessage, loading, error, setMode } = useMentor();
  const [message, setMessage] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMode("builder");
  }, [setMode]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function handleSend() {
    if (!studentId || !projectId || (!message.trim() && !codeSnippet.trim())) return;

    await sendMessage({
      student_id: studentId,
      project_id: projectId,
      mode: "builder",
      module_id: "project-mentor",
      student_message: message,
      code_snippet: codeSnippet || null,
    });

    setMessage("");
    setCodeSnippet("");
  }

  return (
    <section className="flex min-h-[34rem] flex-col rounded-2xl border border-white/80 bg-white/90 shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Builder Mode</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">AI Project Mentor</h2>
        <p className="mt-1 text-sm text-slate-500">Ask for debugging help, code review feedback, architecture suggestions, or build steps.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="grid gap-3">
            {[
              "Break my next feature into exact steps.",
              "Review this component for bugs and cleanup.",
              "Suggest an architecture for my MVP.",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={!studentId || !projectId || loading}
                onClick={() => {
                  setMessage(prompt);
                  void Promise.resolve().then(() =>
                    sendMessage({
                      student_id: studentId ?? "",
                      project_id: projectId,
                      mode: "builder",
                      module_id: "project-mentor",
                      student_message: prompt,
                    }),
                  );
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          messages.map((chatMessage) => (
            <ChatMessage key={chatMessage.id} message={chatMessage} scrollAnchorRef={scrollAnchorRef} />
          ))
        )}
        {loading && <TypingIndicator />}
        <div ref={scrollAnchorRef} />
      </div>

      <div className="border-t border-slate-200 p-4">
        {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <textarea
          value={codeSnippet}
          onChange={(event) => setCodeSnippet(event.target.value)}
          placeholder="Optional code snippet for debugging or review"
          rows={3}
          className="mb-3 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs outline-none focus:border-violet-400"
        />
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder={projectId ? "Ask your builder mentor..." : "Create or select a project first"}
            rows={2}
            className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!studentId || !projectId || loading || (!message.trim() && !codeSnippet.trim())}
            className="self-end rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
