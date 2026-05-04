import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";

function AuthFallback() {
  return <div className="h-[34rem] animate-pulse rounded-3xl bg-white/70" />;
}

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-5 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_28rem]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Educate Cybernetix</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Sign in and pick up exactly where your learning left off.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Google sign-in and email/password both connect to the same student dashboard, mentor, lessons,
            project tasks, and progress tracking.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["AI mentor", "Project builder", "Parent summaries"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <Suspense fallback={<AuthFallback />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
