"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";

type ChatInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (message: string) => Promise<void> | void;
};

export function ChatInput({ disabled = false, placeholder = "Ask your mentor...", onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function submit() {
    const message = value.trim();

    if (!message || disabled) {
      return;
    }

    setValue("");
    await onSend(message);
    textareaRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-3xl border border-teal-100 bg-white p-3 shadow-lg">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder}
        className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-11 rounded-2xl bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Ask
      </button>
    </form>
  );
}
