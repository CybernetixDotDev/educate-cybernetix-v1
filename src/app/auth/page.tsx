import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";

function AuthFallback() {
  return <div className="h-[34rem] animate-pulse rounded-3xl bg-white" />;
}

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#f7faf9] px-5 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_28rem]">
        <section>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">Educate Cybernetix</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Welcome back to your next mission.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Sign in to continue your course, build your project, and ask Cyber Mentor for help when you need a clear next step.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Short lessons", "Cyber Mentor", "Visible projects"].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
