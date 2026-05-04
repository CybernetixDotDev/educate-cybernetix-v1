"use client";

import { useMemo, useState } from "react";

type JSONEditorProps = {
  name: string;
  value: unknown;
  label?: string;
  rows?: number;
};

export function JSONEditor({ name, value, label = "JSON", rows = 16 }: JSONEditorProps) {
  const initialValue = useMemo(() => JSON.stringify(value ?? {}, null, 2), [value]);
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function validate(nextText: string) {
    setText(nextText);

    try {
      JSON.parse(nextText || "{}");
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Invalid JSON");
    }
  }

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <textarea
        name={name}
        value={text}
        onChange={(event) => validate(event.target.value)}
        rows={rows}
        spellCheck={false}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-6 text-cyan-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
      {error && <span className="mt-2 block text-sm text-rose-600">{error}</span>}
    </label>
  );
}
