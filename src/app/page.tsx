import { SignOutButton } from "@/components/auth/SignOutButton";
import { dashboardPathForRole, getCurrentUserRole } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

const courseTracks = [
  {
    title: "12-Week Tech-Foundations Accelerator",
    description: "Learn the web, JavaScript, databases, 3D basics, and project delivery through weekly missions.",
    meta: "First course",
  },
  {
    title: "AI Study Buddy",
    description: "Build a helpful assistant while learning prompts, data, interfaces, and responsible AI habits.",
    meta: "Project pathway",
  },
  {
    title: "3D Product Viewer",
    description: "Create a shareable interactive product experience with web design and Three.js fundamentals.",
    meta: "Portfolio project",
  },
  {
    title: "Mini Business Launch",
    description: "Turn an idea into a simple page, payment-ready product story, and clear presentation.",
    meta: "Coming next",
  },
];

const steps = [
  {
    title: "Choose a mission",
    body: "Students start each week with one clear theme and a visible project outcome.",
  },
  {
    title: "Learn in small steps",
    body: "Short lessons, videos, diagrams, examples, and checkpoints keep momentum high.",
  },
  {
    title: "Build with Cyber Mentor",
    body: "The mentor explains, guides, debugs, reviews, and encourages without overwhelming the student.",
  },
  {
    title: "Showcase the work",
    body: "Every week ends with a project moment students can share with parents or mentors.",
  },
];

const outcomes = ["Real projects", "AI mentor support", "Parent-friendly progress", "Certificates and badges"];

export default async function LandingPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const isSignedIn = Boolean(data.user);
  const dashboardPath = isSignedIn ? dashboardPathForRole(await getCurrentUserRole()) : "/dashboard";
  const primaryHref = isSignedIn ? dashboardPath : "/auth?mode=signup";

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      <section className="relative isolate min-h-[86vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85"
          alt="Teen student learning on a laptop"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/55" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#f7faf9] to-transparent" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-tight text-white">
            Educate Cybernetix
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href={dashboardPath} className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-50">
                  Dashboard
                </Link>
                <SignOutButton className="hidden rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-60 sm:inline-flex" />
              </>
            ) : (
              <>
                <Link href="/auth?mode=signin" className="rounded-full border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
                  Sign in
                </Link>
                <Link href="/auth?mode=signup" className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-50">
                  Start free
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="mx-auto flex max-w-7xl px-5 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-3xl text-white">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-200">AI-guided tech courses for teens</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Real-world tech learning that feels personal.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
              Students learn in short, friendly lessons, build visible projects, and get supportive help from Cyber Mentor whenever they are stuck.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className="rounded-full bg-teal-400 px-6 py-4 text-center text-sm font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:bg-teal-300">
                {isSignedIn ? "Continue your mission" : "Start learning"}
              </Link>
              <Link href="/learn" className="rounded-full border border-white/50 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-white/10">
                View courses
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {outcomes.map((item) => (
                <span key={item} className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Simple enough to start. Powerful enough to grow.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-black text-teal-800">{index + 1}</span>
                <h3 className="mt-5 text-xl font-black text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">Course missions</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Start with tech foundations. Add new teen courses later.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The platform is built for modular courses: programming now, then blockchain, investing, marketing, content creation, and more.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {courseTracks.map((track) => (
              <article key={track.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50">
                <p className="text-xs font-black uppercase tracking-wide text-teal-700">{track.meta}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{track.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_0.9fr]">
          <div className="p-7 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">For students and parents</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950">
              Every week ends with proof of progress.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Students build something visible, get a badge or certificate moment, and parents receive a clear summary of what improved and what comes next.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Weekly showcase", "Growth timeline", "Parent summaries"].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{item}</p>
                </div>
              ))}
            </div>
            <Link href={primaryHref} className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800">
              {isSignedIn ? "Open dashboard" : "Create an account"}
            </Link>
          </div>
          <div className="min-h-80 bg-teal-50 p-7 sm:p-10">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-teal-700">This week</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950">Build your first personal webpage</h3>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 rounded-full bg-teal-500" />
              </div>
              <div className="mt-5 space-y-3">
                {["Watch the intro", "Complete a micro-lesson", "Ask Cyber Mentor", "Showcase the project"].map((task) => (
                  <div key={task} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-800">{task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
