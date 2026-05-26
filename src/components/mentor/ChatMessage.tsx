"use client";

import type { MentorMessage } from "@/hooks/useMentor";
import { MENTOR_IDENTITY } from "@/lib/mentor/identity";
import { RefObject, useEffect } from "react";

type ChatMessageProps = {
  message: MentorMessage;
  scrollAnchorRef?: RefObject<HTMLDivElement | null>;
};

type TextPart = {
  type: "text";
  content: string;
};

type CodePart = {
  type: "code";
  language: string;
  content: string;
};

type MessagePart = TextPart | CodePart;

function splitCodeBlocks(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "code",
      language: match[1] ?? "text",
      content: match[2]?.trimEnd() ?? "",
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content }];
}

function renderInline(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={`${token}-${index}`} className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={`${token}-${index}`}>{token.slice(1, -1)}</em>;
    }

    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

function MarkdownText({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.every((line) => /^[-*]\s+/.test(line.trim()));

        if (isList) {
          return (
            <ul key={`${block}-${blockIndex}`} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`${line}-${lineIndex}`}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${blockIndex}`} className="whitespace-pre-wrap leading-7">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}

export function ChatMessage({ message, scrollAnchorRef }: ChatMessageProps) {
  const isStudent = message.role === "student";
  const isSystem = message.role === "system";
  const parts = splitCodeBlocks(message.content);
  const isZylo = !isStudent && !isSystem;
  const bubbleClass = isStudent
    ? "rounded-3xl rounded-br-md bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-teal-900/10"
    : isSystem
      ? "rounded-2xl rounded-bl-md bg-rose-50 text-rose-800"
      : [
          "relative overflow-hidden rounded-[2rem] rounded-bl-md border border-cyan-100/80",
          "bg-gradient-to-br from-white via-violet-50/90 to-cyan-50/95 text-slate-700",
          "font-medium leading-relaxed shadow-[0_16px_45px_rgba(14,116,144,0.14)]",
          "ring-1 ring-cyan-200/60 before:absolute before:inset-0 before:pointer-events-none",
          "before:bg-[radial-gradient(circle_at_18%_12%,rgba(216,180,254,0.42),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(103,232,249,0.34),transparent_28%),radial-gradient(circle_at_70%_95%,rgba(110,231,183,0.24),transparent_34%)]",
        ].join(" ");

  useEffect(() => {
    scrollAnchorRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [message.id, scrollAnchorRef]);

  return (
    <div className={`flex items-end gap-3 ${isStudent ? "justify-end" : "justify-start"}`}>
      {isZylo && (
        <div className="relative mb-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-50 via-cyan-50 to-emerald-50 shadow-lg shadow-cyan-900/15 ring-4 ring-white">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-200/45 via-cyan-200/50 to-emerald-200/45 blur-sm" />
          <div className="absolute inset-1 rounded-full bg-white/90" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MENTOR_IDENTITY.avatarPath}
            alt="Zylo"
            className="relative h-[4.4rem] w-[4.4rem] object-contain drop-shadow-sm"
          />
        </div>
      )}
      <div
        className={`max-w-[min(44rem,88%)] px-4 py-3 text-sm shadow-sm ${bubbleClass}`}
      >
        <div className="relative">
          {isZylo && (
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-cyan-100/80 pb-2.5">
              <span className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm shadow-cyan-900/10">
                {MENTOR_IDENTITY.name}
              </span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
                {MENTOR_IDENTITY.tagline}
              </span>
            </div>
          )}
        </div>
        <div className="relative space-y-3">
          {parts.map((part, index) =>
            part.type === "code" ? (
              <div key={`${part.language}-${index}`} className="overflow-hidden rounded-xl bg-slate-950 text-cyan-100">
                <div className="border-b border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {part.language}
                </div>
                <pre className="overflow-x-auto p-3 text-xs leading-5">
                  <code>{part.content}</code>
                </pre>
              </div>
            ) : (
              <MarkdownText key={`${part.content}-${index}`} content={part.content} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
