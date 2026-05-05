import type { AdminOverview } from "@/app/admin/page";

type Card = {
  label: string;
  value: number;
  helper: string;
  tone: string;
};

export function PlatformOverviewCards({ overview }: { overview: AdminOverview }) {
  const cards: Card[] = [
    { label: "Students", value: overview.totalStudents, helper: "Learner profiles", tone: "bg-cyan-50 text-cyan-900" },
    { label: "Parents", value: overview.totalParents, helper: "Parent accounts", tone: "bg-violet-50 text-violet-900" },
    { label: "Admins", value: overview.totalAdmins, helper: "Admin operators", tone: "bg-slate-100 text-slate-900" },
    { label: "Lessons", value: overview.totalLessons, helper: "Tracked lesson records", tone: "bg-emerald-50 text-emerald-900" },
    { label: "Quizzes", value: overview.totalQuizzes, helper: "Quiz submissions", tone: "bg-amber-50 text-amber-900" },
    { label: "Projects", value: overview.totalProjects, helper: "Student projects", tone: "bg-blue-50 text-blue-900" },
    { label: "Certificates", value: overview.totalCertificates, helper: "Generated certificates", tone: "bg-rose-50 text-rose-900" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className={`mt-3 inline-flex rounded-lg px-3 py-2 text-3xl font-black ${card.tone}`}>{card.value}</p>
          <p className="mt-3 text-xs font-medium text-slate-500">{card.helper}</p>
        </div>
      ))}
    </section>
  );
}

