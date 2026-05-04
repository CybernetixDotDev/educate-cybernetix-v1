import { dashboardPathForRole, getCurrentUserRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

const skills = ["HTML", "CSS", "JavaScript", "Next.js", "Supabase", "Three.js"];

export default async function LandingPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const isSignedIn = Boolean(data.user);
  const dashboardPath = isSignedIn ? dashboardPathForRole(await getCurrentUserRole()) : "/dashboard";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#22d3ee33,transparent_34%),radial-gradient(circle_at_bottom_right,#a78bfa33,transparent_30%)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-tight">
            Educate Cybernetix
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href={dashboardPath} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
                  Dashboard
                </Link>
                <Link href="/auth/signout" className="hidden rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white sm:inline-flex">
                  Sign out
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth?mode=signin" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white">
                  Sign in
                </Link>
                <Link href="/auth?mode=signup" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950">
                  Start free
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-20 lg:pt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Teen coding + AI mentorship</p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              Build real web, AI, and 3D projects with a mentor beside you.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Educate Cybernetix guides students through twelve weeks of practical coding lessons, quizzes,
              project tasks, and AI coaching designed for steady progress.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={isSignedIn ? dashboardPath : "/auth?mode=signup"} className="rounded-2xl bg-cyan-400 px-6 py-4 text-center text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30">
                {isSignedIn ? "Continue learning" : "Create student account"}
              </Link>
              <Link href="/mentor" className="rounded-2xl border border-white/20 px-6 py-4 text-center text-sm font-black text-white">
                Meet the AI Mentor
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-2xl bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-cyan-200">Week 7</p>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  7 day streak
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-black">Supabase Database & Auth</h2>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" />
              </div>
              <div className="mt-6 grid gap-3">
                {["Finish auth callback", "Secure profile data", "Connect project tasks"].map((task) => (
                  <div key={task} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-bold text-white">{task}</p>
                    <p className="mt-1 text-xs text-slate-400">AI mentor ready for debugging and next steps</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white py-14 text-slate-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">What students build</p>
              <h2 className="mt-3 text-3xl font-black">A dashboard for steady, visible progress.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {skills.map((skill) => (
                <div key={skill} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black">{skill}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Lessons, quizzes, and project tasks that turn concepts into working code.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
