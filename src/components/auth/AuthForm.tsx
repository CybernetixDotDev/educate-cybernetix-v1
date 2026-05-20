"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type AuthMode = "signin" | "signup";

function modeFromParam(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

async function ensureStudentProfile() {
  const response = await fetch("/auth/profile", { method: "POST" });
  return response.ok
    ? ((await response.json()) as { dashboard_path?: string })
    : {};
}

export function AuthForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<AuthMode>(modeFromParam(searchParams.get("mode")));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function submitEmailPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          const profile = await ensureStudentProfile();
          router.replace(next === "/dashboard" ? profile.dashboard_path ?? "/dashboard" : next);
          router.refresh();
          return;
        }

        setMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const profile = await ensureStudentProfile();
      router.replace(next === "/dashboard" ? profile.dashboard_path ?? "/dashboard" : next);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-xl">
      <div className="grid grid-cols-2 rounded-2xl bg-teal-50 p-1">
        {(["signin", "signup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              mode === item ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            {item === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-black text-teal-700">G</span>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={(event) => void submitEmailPassword(event)} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Student name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-teal-400"
              placeholder="Alex Cyber"
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-teal-400"
            placeholder="student@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-teal-400"
            placeholder="At least 6 characters"
          />
        </label>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {message && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        <Link href="/" className="font-bold text-teal-700 hover:text-teal-900">
          Back to home
        </Link>
      </p>
    </div>
  );
}
