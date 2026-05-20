"use client";

import type { MentorMessage } from "@/hooks/useMentor";
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

  useEffect(() => {
    scrollAnchorRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [message.id, scrollAnchorRef]);

  return (
    <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(44rem,88%)] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isStudent
            ? "rounded-br-md bg-teal-600 text-white"
            : isSystem
              ? "rounded-bl-md bg-rose-50 text-rose-800"
              : "rounded-bl-md border border-teal-100 bg-white text-slate-700"
        }`}
      >
        <div className="space-y-3">
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
