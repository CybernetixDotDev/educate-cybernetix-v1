import type { DashboardMentorInteraction } from "@/app/dashboard/page";
import { MENTOR_IDENTITY } from "@/lib/mentor/identity";
import Link from "next/link";

function extractActions(interaction: DashboardMentorInteraction | undefined) {
  const actions = interaction?.metadata?.next_actions;
  if (Array.isArray(actions)) return actions.filter((item): item is string => typeof item === "string").slice(0, 2);

  const response = interaction?.response?.trim();
  if (response) return [response.slice(0, 180)];

  return ["Ask Zylo what to focus on before your next build session.", "Bring one lesson, code, or project question to the same chat."];
}

export function AIMentorInsight({ interactions }: { interactions: DashboardMentorInteraction[] }) {
  const latest = interactions[0];
  const actions = extractActions(latest);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-violet-50 ring-1 ring-violet-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MENTOR_IDENTITY.poses.thinking} alt="Zylo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">{MENTOR_IDENTITY.name} Insight</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Your Mentor Suggests...</h2>
          </div>
        </div>
        <Link href="/mentor" className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
          Ask Mentor
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <div key={action} className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm leading-6 text-violet-950">
            {action}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        {latest ? `Last Zylo activity: ${new Date(latest.created_at).toLocaleDateString()}` : "No Zylo sessions yet"}
      </p>
    </section>
  );
}
