import Link from "next/link";

const MODULES = [
  ["week1-internet-html-css", "Week 1", "Internet, HTML, and CSS"],
  ["week2-tailwind-uiux", "Week 2", "Tailwind and UI/UX"],
  ["week3-git-github-terminal", "Week 3", "Git, GitHub, and Terminal"],
  ["week4-javascript-fundamentals", "Week 4", "JavaScript Fundamentals"],
  ["week5-nextjs-fundamentals", "Week 5", "Next.js Fundamentals"],
  ["week6-apis-datafetching", "Week 6", "APIs and Data Fetching"],
  ["week7-supabase-database-auth", "Week 7", "Supabase Database and Auth"],
  ["week8-threejs-fundamentals", "Week 8", "Three.js Fundamentals"],
  ["week9-project-planning", "Week 9", "Project Planning"],
  ["week10-build-phase-1", "Week 10", "Build Phase 1"],
  ["week11-build-phase-2", "Week 11", "Build Phase 2"],
  ["week12-deploy-present", "Week 12", "Deploy and Present"],
] as const;

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Learning Hub</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Choose your next module.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Open a module to continue lessons, quizzes, and mentor-guided practice.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map(([moduleId, week, title]) => (
            <Link
              key={moduleId}
              href={`/learn/${moduleId}/intro`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
            >
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-600">{week}</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Start or resume lessons for this module.</p>
              <p className="mt-5 text-sm font-black text-cyan-700">Open module</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
