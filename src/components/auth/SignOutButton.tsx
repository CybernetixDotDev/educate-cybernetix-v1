"use client";

import { useState } from "react";

type SignOutButtonProps = {
  className?: string;
  label?: string;
  signingOutLabel?: string;
  redirectTo?: string;
};

export function SignOutButton({
  className = "rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-60",
  label = "Sign out",
  signingOutLabel = "Signing out...",
  redirectTo = "/",
}: SignOutButtonProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await fetch("/auth/signout", {
        method: "GET",
        cache: "no-store",
      });
    } finally {
      window.location.replace(redirectTo);
    }
  }

  return (
    <button type="button" onClick={() => void signOut()} disabled={signingOut} className={className}>
      {signingOut ? signingOutLabel : label}
    </button>
  );
}
