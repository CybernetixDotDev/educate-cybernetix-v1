import { MENTOR_IDENTITY } from "@/lib/mentor/identity";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-violet-50 shadow-sm ring-2 ring-teal-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MENTOR_IDENTITY.poses.thinking} alt="Zylo thinking" className="h-full w-full object-contain p-1" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-teal-100 bg-white px-4 py-3 text-teal-900 shadow-sm">
        <span className="text-sm font-bold">{MENTOR_IDENTITY.name} is thinking</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
        </span>
      </div>
    </div>
  );
}
