type PlatformOverviewProps = {
  overview: {
    totalStudents: number;
    totalParents: number;
    totalAdmins: number;
    totalLessons: number;
    totalQuizzes: number;
    totalProjects: number;
    totalCertificates: number;
  };
};

const cards = [
  { key: "totalStudents", label: "Students", tone: "bg-cyan-50 text-cyan-700" },
  { key: "totalParents", label: "Parents", tone: "bg-violet-50 text-violet-700" },
  { key: "totalAdmins", label: "Admins", tone: "bg-slate-100 text-slate-700" },
  { key: "totalLessons", label: "Lessons", tone: "bg-emerald-50 text-emerald-700" },
  { key: "totalQuizzes", label: "Quizzes", tone: "bg-amber-50 text-amber-700" },
  { key: "totalProjects", label: "Projects", tone: "bg-blue-50 text-blue-700" },
  { key: "totalCertificates", label: "Certificates", tone: "bg-rose-50 text-rose-700" },
] as const;

export function PlatformOverview({ overview }: PlatformOverviewProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${card.tone}`}>{card.label}</div>
          <p className="mt-4 text-3xl font-bold text-slate-950">{overview[card.key].toLocaleString()}</p>
        </article>
      ))}
    </section>
  );
}
