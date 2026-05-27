import { MENTOR_IDENTITY } from "@/lib/mentor/identity";

type ZyloLessonCompanionProps = {
  pose?: keyof typeof MENTOR_IDENTITY.poses;
  label: string;
  message: string;
};

export function ZyloLessonCompanion({ pose = "floating", label, message }: ZyloLessonCompanionProps) {
  return (
    <aside className="pointer-events-none fixed bottom-5 right-4 z-30 hidden max-w-xs flex-row-reverse items-end gap-3 lg:flex">
      <div className="mb-4 rounded-3xl rounded-bl-md border border-cyan-100 bg-white/95 px-4 py-3 shadow-xl shadow-cyan-900/10 ring-1 ring-cyan-200/50 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-700">{label}</p>
        <p className="mt-1 text-sm font-bold leading-5 text-slate-800">{message}</p>
      </div>
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <div className="absolute inset-x-4 bottom-1 h-5 rounded-full bg-cyan-300/25 blur-lg" />
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-100 via-cyan-100 to-emerald-100 blur-md" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MENTOR_IDENTITY.poses[pose]} alt="Zylo" className="relative h-full w-full object-contain drop-shadow-xl" />
      </div>
    </aside>
  );
}
